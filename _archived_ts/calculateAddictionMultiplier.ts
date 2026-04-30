/* ============================================================
 * calculateAddictionMultiplier.ts
 *
 * Pure scoring helper for the Mind & Cognition dimension based
 * on QKT12 (non-substance addictions: gambling, shopping, gaming,
 * social media, etc.).
 *
 * Returns BOTH a multiplier for the mind dimension AND a flag
 * the engine uses to cap the user's max attainable score in
 * Career/Wealth — addictions don't just dent your cognitive
 * score, they erode your earning potential.  Two pieces of
 * information from one call lets the rule engine apply both
 * effects coherently without recomputing.
 *
 * Drops into the LifeScore Rule Engine as e.g.:
 *
 *   E.registerRule({
 *     id: 'mind.addictions',
 *     dimension: 'mind',
 *     priority: 5,  // run before any wealth-cap modifiers
 *     appliesTo: (s) => Array.isArray(s.addictions),
 *     evaluate: (s, ctx) => {
 *       const result = calculateAddictionMultiplier(s.addictions);
 *       // Stash the flag for the wealth modifier to read later
 *       ctx.scratch.isSeverelyHijacked = result.isSeverelyHijacked;
 *       return {
 *         dimension: 'mind',
 *         delta: BASE_MIND_POINTS * result.multiplier - BASE_MIND_POINTS,
 *         ruleId: 'mind.addictions',
 *         reason: '行为成瘾',
 *       };
 *     },
 *   });
 *
 * No external dependencies. No I/O. Same input → same output.
 * ============================================================ */

// ════════════════════════════════════════════════════════════
//   Configuration — every tunable lives here
// ════════════════════════════════════════════════════════════

/**
 * Multiplier lookup keyed by addiction count.
 *
 *   0  → 1.0  (no penalty, full mental capacity)
 *   1  → 0.8  (mild — one indulgence is manageable)
 *   2  → 0.5  (severe — quality of attention degrades fast)
 *   3+ → 0.2  (catastrophic — multiple competing compulsions)
 *
 * Note the *ratios* between adjacent steps (0.8, 0.625, 0.4) — the
 * decay accelerates, which is the desired non-linear "exponential"
 * shape. Each additional addiction hurts more than the last,
 * because attention is finite and each new compulsion crowds out
 * the others' recovery time.
 *
 * If you ever want to extend past 3, the natural extension is:
 *   count > 3 → MULTIPLIER_TABLE[3] * Math.pow(0.5, count - 3)
 * but the current spec stops at 3+, so we plateau there.
 */
const MULTIPLIER_TABLE: Readonly<Record<number, number>> = Object.freeze({
  0: 1.0,
  1: 0.8,
  2: 0.5,
  3: 0.2,
});

/**
 * Threshold at which the user is "severely hijacked" — at this
 * count or above, the cross-dimension flag fires and the engine
 * caps their wealth/career score.  Per spec: count ≥ 2.
 *
 * Two simultaneous addictions is the inflection point because it
 * represents loss of compartmentalization: the user can no longer
 * reliably contain one compulsion while functioning normally
 * elsewhere.  Career and wealth start to leak.
 */
const HIJACK_THRESHOLD = 2;

/**
 * Maximum score a hijacked user can attain in the Career/Wealth
 * dimension, expressed as a fraction of the dimension's max.
 * The engine reads this off the result and applies it as a
 * post-hoc cap on the wealth dimension's contribution.
 *
 * 0.6 means: even if all your other wealth signals are perfect
 * (manor housing, abundant savings, top-tier profession), you
 * cap at 60% of the max because the addictions are eating into
 * your earning trajectory.
 */
const HIJACKED_WEALTH_CAP = 0.6;

// ════════════════════════════════════════════════════════════
//   Public types
// ════════════════════════════════════════════════════════════

export interface AddictionResult {
  /** Multiplier for the mind dimension, in [0.2, 1.0]. */
  multiplier: number;
  /**
   * True iff the user has 2+ valid addictions.  When true, the
   * engine should cap their max wealth/career dimension score
   * at HIJACKED_WEALTH_CAP × max.
   */
  isSeverelyHijacked: boolean;
  /**
   * Cap fraction the engine should apply to wealth/career when
   * hijacked.  1.0 if not hijacked (no cap), HIJACKED_WEALTH_CAP
   * (0.6) if hijacked.  Provided so the engine doesn't have to
   * remember the magic number.
   */
  wealthCapFraction: number;
  /**
   * Number of distinct, valid addictions counted.  Useful for
   * the analysis UI ("You reported 2 behavioral addictions...").
   */
  count: number;
}

// ════════════════════════════════════════════════════════════
//   Helpers
// ════════════════════════════════════════════════════════════

/**
 * Strip null/undefined/empty/whitespace-only entries and dedupe
 * (case-insensitive, whitespace-trimmed).  Sloppy upstream code
 * shouldn't be able to inflate the count by sending duplicates.
 *
 * Returns the cleaned, deduped list.
 */
function cleanAddictions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const entry of input) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (trimmed.length === 0) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }

  return out;
}

/**
 * Lookup the multiplier for a given count.  Counts above the
 * highest table entry collapse to that entry (the "3+" plateau).
 */
function lookupMultiplier(count: number): number {
  if (count <= 0) return MULTIPLIER_TABLE[0];
  if (count === 1) return MULTIPLIER_TABLE[1];
  if (count === 2) return MULTIPLIER_TABLE[2];
  return MULTIPLIER_TABLE[3]; // 3 or more — plateau
}

// ════════════════════════════════════════════════════════════
//   Public API
// ════════════════════════════════════════════════════════════

/**
 * Calculate the addiction-based mind multiplier and the
 * cross-dimension hijack flag.
 *
 * Behavior summary:
 *
 *   addictions.length    multiplier    isSeverelyHijacked
 *   ─────────────────    ──────────    ──────────────────
 *           0              1.0              false
 *           1              0.8              false
 *           2              0.5              true   ← inflection
 *          ≥3              0.2              true
 *
 * Edge cases (all return `{multiplier: 1.0, isSeverelyHijacked: false, count: 0}`):
 *   - undefined / null input
 *   - non-array input
 *   - empty array
 *   - array of only empty strings or whitespace
 *   - array of only non-string values
 *
 * Duplicates are deduped before counting (case-insensitive).
 * Whitespace-only entries are dropped.
 *
 * @param addictions  Array of addiction identifiers.  Strings are
 *                    treated opaquely — the function doesn't care
 *                    whether they're option keys ('gambling'),
 *                    Chinese labels ('赌博'), or option indices
 *                    coerced to strings ('3').  Only the count
 *                    of distinct non-empty entries matters.
 * @returns           Full result object — never throws, never
 *                    returns null.
 */
export function calculateAddictionMultiplier(
  addictions: string[] | undefined | null,
): AddictionResult {
  // ── Edge case 1: missing or non-array input ──
  // Treated as "no addictions reported" — fully neutral result.
  if (!addictions) {
    return {
      multiplier: 1.0,
      isSeverelyHijacked: false,
      wealthCapFraction: 1.0,
      count: 0,
    };
  }

  // ── Clean & dedupe ──
  const cleaned = cleanAddictions(addictions);
  const count = cleaned.length;

  // ── Lookup multiplier ──
  const multiplier = lookupMultiplier(count);

  // ── Hijack flag ──
  const isSeverelyHijacked = count >= HIJACK_THRESHOLD;
  const wealthCapFraction = isSeverelyHijacked ? HIJACKED_WEALTH_CAP : 1.0;

  return {
    multiplier,
    isSeverelyHijacked,
    wealthCapFraction,
    count,
  };
}

// ════════════════════════════════════════════════════════════
//   Convenience: a thin wrapper that returns just the number
// ════════════════════════════════════════════════════════════

/**
 * Convenience helper for callers that only need the multiplier
 * and don't care about the hijack flag.  Identical math, just a
 * different return shape.
 */
export function getAddictionMultiplier(
  addictions: string[] | undefined | null,
): number {
  return calculateAddictionMultiplier(addictions).multiplier;
}
