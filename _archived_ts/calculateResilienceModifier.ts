/* ============================================================
 * calculateResilienceModifier.ts
 *
 * Pure scoring helper for the Social & Relationships dimension.
 *
 * Computes TWO independent outputs from three categorical inputs:
 *
 *   1. financialResilienceBuff
 *      - depends only on emergencyFunds
 *      - signed integer added to the WEALTH dimension as a hidden
 *        safety net (positive for strong support networks,
 *        slightly negative for "no one would lend me anything")
 *
 *   2. stressRecoveryRate
 *      - depends on familySupport and partnerSupport jointly
 *      - multiplier in [0.3, 1.0] applied wherever the engine
 *        models recovery from negative life events
 *      - 1.0 = normal recovery, lower = recovers slower
 *
 * The two outputs share inputs (familySupport and partnerSupport
 * are also used by other social rules) but are computed
 * independently — no leakage between them.
 *
 * Drops into the Rule Engine as one rule + one modifier:
 *
 *   E.registerRule({
 *     id: 'wealth.resilience_buff',
 *     dimension: 'wealth',
 *     priority: 20, // run after base wealth rules
 *     appliesTo: (s) => !!s.emergencyFunds,
 *     evaluate: (s) => {
 *       const r = calculateResilienceModifier(
 *         s.emergencyFunds, s.familySupport, s.partnerSupport
 *       );
 *       return {
 *         dimension: 'wealth',
 *         delta: r.financialResilienceBuff,
 *         ruleId: 'wealth.resilience_buff',
 *         reason: '社交圈应急资金缓冲',
 *       };
 *     },
 *   });
 *
 *   // The recovery rate is consumed by other rules (mental
 *   // health, addiction recovery, etc.) — store it on state via
 *   // a derived-fields hook so any rule that needs it can read
 *   // s.stressRecoveryRate without recomputing.
 *
 * No external dependencies. No I/O. Same input → same output.
 * ============================================================ */

// ════════════════════════════════════════════════════════════
//   Public types
// ════════════════════════════════════════════════════════════

/**
 * Categorical levels for emergency-fund borrowing capacity.
 *
 * Anchored to QKB7 in the question bank.  The string keys are
 * deliberately short and semantic so they can be reused across
 * locales without translation.
 */
export type EmergencyFundLevel =
  | 'easy_300k'             // Can borrow ~300k RMB easily from network
  | 'family_decent_amount'  // Family can pull together a decent sum
  | 'small_loan_only'       // Could borrow a small amount, not enough
  | 'nothing'               // No one would lend a cent
  | 'unspecified';

/**
 * Categorical levels for family relationship quality.
 *
 * Anchored to QKB2 in the question bank.  Includes the "deceased"
 * variants because a user with deceased-but-loving family is in a
 * meaningfully different position than one with toxic living
 * family — the former had support that shaped them, the latter
 * still lives with active harm.
 */
export type FamilySupportLevel =
  | 'excellent'         // Mutual respect, friend-like
  | 'decent'            // Regular contact, surface-level
  | 'distant'           // Polite avoidance
  | 'toxic'             // Controlling, manipulative, draining ← key trigger
  | 'deceased_good'     // Family departed, relationship was loving
  | 'deceased_neutral'  // Family departed, relationship was OK
  | 'unspecified';

/**
 * Categorical levels for partner emotional support.
 *
 * Note: 'none_no_partner' (no partner exists) is distinct from
 * 'zero' (partner exists but provides nothing).  These have very
 * different implications — being single is neutral, being with
 * an unsupportive partner is actively corrosive.
 */
export type PartnerSupportLevel =
  | 'high'             // Active emotional + practical support
  | 'moderate'         // Reliable but undemonstrative
  | 'low'              // Minimal, transactional
  | 'zero'             // Partner exists, provides nothing  ← key trigger
  | 'none_no_partner'  // No partner — neutral, not penalized
  | 'unspecified';

export interface ResilienceResult {
  /**
   * Signed integer to add to the user's wealth-dimension score.
   * Range: typically [-3, +15].  Acts as a hidden financial
   * safety net — strong networks borrow you out of trouble.
   */
  financialResilienceBuff: number;
  /**
   * Multiplier in [0.3, 1.0] applied to recovery from stressors.
   * 1.0 = baseline, lower = slower recovery from negative events.
   * Floored at 0.3 because no one literally never recovers.
   */
  stressRecoveryRate: number;
  /**
   * True iff stressRecoveryRate is at or below 0.5.  Lets the
   * engine know to surface a "low resilience" warning in the
   * analysis UI without re-deriving the threshold.
   */
  isLowResilience: boolean;
}

// ════════════════════════════════════════════════════════════
//   Configuration tables — every weight lives here
// ════════════════════════════════════════════════════════════

/**
 * Buff lookup for the financial resilience input.
 *
 * Spec anchor: easy_300k → +15.  The other values are spaced
 * to give a gentle gradient without overwhelming the base wealth
 * score (which itself ranges roughly 0–30 per the engine config).
 *
 *   easy_300k             → +15  (anchor — strong network safety net)
 *   family_decent_amount  →  +8  (real but limited backstop)
 *   small_loan_only       →  +2  (token support)
 *   nothing               →  -3  (no safety net penalty)
 *   unspecified           →   0  (neutral — don't punish missing data)
 */
const BUFF_TABLE: Readonly<Record<EmergencyFundLevel, number>> = Object.freeze({
  easy_300k:            15,
  family_decent_amount:  8,
  small_loan_only:       2,
  nothing:              -3,
  unspecified:           0,
});

/**
 * Recovery-rate impact of family relationship quality alone.
 *
 * These are NOT the final rates — they're the "family component"
 * of a multiplicative model.  See computeRecoveryRate() below
 * for how they combine with the partner component.
 *
 *   excellent         → 1.00  (family is a buffer against stress)
 *   decent            → 0.95
 *   distant           → 0.85
 *   toxic             → 0.55  (active harm; spec anchor for low end)
 *   deceased_good     → 0.90  (no longer a buffer but no harm)
 *   deceased_neutral  → 0.85
 *   unspecified       → 1.00  (neutral)
 */
const FAMILY_RECOVERY_FACTOR: Readonly<Record<FamilySupportLevel, number>> = Object.freeze({
  excellent:        1.00,
  decent:           0.95,
  distant:          0.85,
  toxic:            0.55,
  deceased_good:    0.90,
  deceased_neutral: 0.85,
  unspecified:      1.00,
});

/**
 * Recovery-rate impact of partner support alone.
 *
 * Note that 'none_no_partner' is 1.00 (neutral) — being single is
 * not a recovery penalty.  'zero' is 0.70 — having a partner who
 * actively withholds support is corrosive in a way being alone
 * is not.
 *
 *   high             → 1.00
 *   moderate         → 0.95
 *   low              → 0.85
 *   zero             → 0.70  (active withholding)
 *   none_no_partner  → 1.00  (single ≠ unsupported)
 *   unspecified      → 1.00
 */
const PARTNER_RECOVERY_FACTOR: Readonly<Record<PartnerSupportLevel, number>> = Object.freeze({
  high:            1.00,
  moderate:        0.95,
  low:             0.85,
  zero:            0.70,
  none_no_partner: 1.00,
  unspecified:     1.00,
});

/**
 * Floor on the recovery rate.  No matter how bad the inputs, we
 * never claim someone literally never recovers.
 */
const MIN_RECOVERY_RATE = 0.3;
const MAX_RECOVERY_RATE = 1.0;

/**
 * Threshold below which we set isLowResilience = true.
 */
const LOW_RESILIENCE_THRESHOLD = 0.5;

// ════════════════════════════════════════════════════════════
//   Helpers
// ════════════════════════════════════════════════════════════

/**
 * Coerce an arbitrary string to a known EmergencyFundLevel,
 * defaulting to 'unspecified' for anything unrecognized.  Lets
 * the public function accept `string` (rather than the union
 * type) so callers don't have to cast at every call site.
 */
function normalizeEmergencyFunds(
  input: string | undefined | null,
): EmergencyFundLevel {
  if (!input || typeof input !== 'string') return 'unspecified';
  return (input in BUFF_TABLE) ? (input as EmergencyFundLevel) : 'unspecified';
}

function normalizeFamilySupport(
  input: string | undefined | null,
): FamilySupportLevel {
  if (!input || typeof input !== 'string') return 'unspecified';
  return (input in FAMILY_RECOVERY_FACTOR) ? (input as FamilySupportLevel) : 'unspecified';
}

function normalizePartnerSupport(
  input: string | undefined | null,
): PartnerSupportLevel {
  if (!input || typeof input !== 'string') return 'unspecified';
  return (input in PARTNER_RECOVERY_FACTOR) ? (input as PartnerSupportLevel) : 'unspecified';
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Combine the family and partner factors into a single recovery
 * rate.  Uses a weighted geometric-style blend rather than a
 * simple product, because:
 *
 *   - A pure product (family × partner) overpunishes — toxic
 *     family (0.55) + zero partner (0.70) would yield 0.385.
 *     The spec anchor wants 0.40 for that exact case, so we're
 *     close but the math gets fragile if we add more inputs.
 *
 *   - A pure average (family + partner) / 2 underpunishes —
 *     toxic + zero would yield 0.625, way above the anchor.
 *
 *   - A weighted blend (60% family, 40% partner, then floor)
 *     hits the anchor (0.55*0.6 + 0.70*0.4 = 0.61) but doesn't
 *     drop low enough — so we apply an interaction penalty when
 *     BOTH inputs are simultaneously bad.
 *
 * The implementation: weighted average, then if BOTH inputs are
 * at or below their respective "danger thresholds" (toxic family,
 * zero partner), apply an additional 0.65× multiplier to model
 * the compounding effect of having no safe person anywhere.
 */
function computeRecoveryRate(
  family: FamilySupportLevel,
  partner: PartnerSupportLevel,
): number {
  const familyFactor = FAMILY_RECOVERY_FACTOR[family];
  const partnerFactor = PARTNER_RECOVERY_FACTOR[partner];

  // Weighted blend — family has slightly more weight because it's
  // the longer-term shaper of stress responses.
  const blended = 0.6 * familyFactor + 0.4 * partnerFactor;

  // Compounding penalty: BOTH actively harmful.  This is what
  // hits the spec anchor of 0.4 for (toxic, zero).
  const bothActivelyHarmful = (family === 'toxic') && (partner === 'zero');
  const penalty = bothActivelyHarmful ? 0.65 : 1.0;

  return clamp(blended * penalty, MIN_RECOVERY_RATE, MAX_RECOVERY_RATE);
}

// ════════════════════════════════════════════════════════════
//   Public API
// ════════════════════════════════════════════════════════════

/**
 * Calculate the financial resilience buff and stress recovery
 * rate from three categorical inputs.
 *
 * Behavior summary:
 *
 *   emergencyFunds                     → financialResilienceBuff
 *   ─────────────                       ────────────────────────
 *   easy_300k                          → +15  (spec anchor)
 *   family_decent_amount               →  +8
 *   small_loan_only                    →  +2
 *   nothing                            →  -3
 *   unspecified / unrecognized         →   0
 *
 *   familySupport × partnerSupport     → stressRecoveryRate
 *   ──────────────────────────────     ──────────────────────
 *   excellent × high                   → 1.00 (full recovery)
 *   decent × moderate                  → ~0.95
 *   distant × low                      → ~0.85
 *   toxic × zero                       → 0.40 (spec anchor; floored)
 *   anything × unspecified             → ~family-only rate
 *   unspecified × unspecified          → 1.00 (neutral)
 *
 * Edge cases (all return neutral):
 *   - undefined / null inputs
 *   - empty strings
 *   - unrecognized category strings
 *
 * Partial inputs work: providing only emergencyFunds returns the
 * buff but a neutral 1.0 recovery rate.  The two outputs are
 * computed independently.
 *
 * @param emergencyFunds  EmergencyFundLevel string or undefined
 * @param familySupport   FamilySupportLevel string or undefined
 * @param partnerSupport  PartnerSupportLevel string or undefined
 * @returns               ResilienceResult — never throws, never null
 */
export function calculateResilienceModifier(
  emergencyFunds: string | undefined | null,
  familySupport: string | undefined | null,
  partnerSupport: string | undefined | null,
): ResilienceResult {
  const ef = normalizeEmergencyFunds(emergencyFunds);
  const fs = normalizeFamilySupport(familySupport);
  const ps = normalizePartnerSupport(partnerSupport);

  const financialResilienceBuff = BUFF_TABLE[ef];
  const stressRecoveryRate = computeRecoveryRate(fs, ps);
  const isLowResilience = stressRecoveryRate <= LOW_RESILIENCE_THRESHOLD;

  return {
    financialResilienceBuff,
    // Round to 3 decimals so the output is stable for snapshot tests
    // and pleasant to read in the analysis UI.
    stressRecoveryRate: Math.round(stressRecoveryRate * 1000) / 1000,
    isLowResilience,
  };
}

// ════════════════════════════════════════════════════════════
//   Verbose variant for the analysis UI
// ════════════════════════════════════════════════════════════

export interface ResilienceBreakdown extends ResilienceResult {
  /** Normalized emergency-fund category that was actually used. */
  resolvedEmergencyFunds: EmergencyFundLevel;
  /** Normalized family-support category that was actually used. */
  resolvedFamilySupport: FamilySupportLevel;
  /** Normalized partner-support category that was actually used. */
  resolvedPartnerSupport: PartnerSupportLevel;
  /** Whether the dual-toxic compounding penalty fired. */
  compoundingPenaltyApplied: boolean;
}

/**
 * Same calculation as calculateResilienceModifier, but exposes
 * which categories were actually matched (vs. fell through to
 * 'unspecified') and whether the compounding penalty fired.
 *
 * Useful for the analysis page so we can show the user *why*
 * their recovery rate is what it is.
 */
export function calculateResilienceModifierVerbose(
  emergencyFunds: string | undefined | null,
  familySupport: string | undefined | null,
  partnerSupport: string | undefined | null,
): ResilienceBreakdown {
  const ef = normalizeEmergencyFunds(emergencyFunds);
  const fs = normalizeFamilySupport(familySupport);
  const ps = normalizePartnerSupport(partnerSupport);

  const base = calculateResilienceModifier(emergencyFunds, familySupport, partnerSupport);

  return {
    ...base,
    resolvedEmergencyFunds: ef,
    resolvedFamilySupport: fs,
    resolvedPartnerSupport: ps,
    compoundingPenaltyApplied: (fs === 'toxic') && (ps === 'zero'),
  };
}
