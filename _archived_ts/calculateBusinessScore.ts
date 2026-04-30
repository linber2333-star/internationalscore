/* ============================================================
 * calculateBusinessScore.ts
 *
 * Pure scoring helper for the Entrepreneur path (QKAC1–QKAC4).
 *
 * Models four dimensions of entrepreneurial health and combines
 * them into a single score with cross-cutting effects:
 *
 *   1. Cash flow stage         (QKAC1) — is the business viable?
 *   2. Weekly hours            (QKAC2) — is the founder sustainable?
 *   3. Customer stickiness     (QKAC3) — does the market want this?
 *   4. Entrepreneur channel    (QKAC4) — what's the ceiling?
 *
 * Key behavioral insights baked into the math:
 *
 *   • A profitable business with loyal customers is the gold
 *     standard — it triggers a massive "moat multiplier" because
 *     revenue + retention = compounding.
 *
 *   • A side hustle has a lower base weight — extreme hours in
 *     a side hustle don't produce proportional returns because
 *     the founder's attention is split.
 *
 *   • The Burnout Trap: losing money AND working 80+ hours is
 *     the most dangerous state an entrepreneur can be in.  It
 *     burns health, destroys relationships, and rarely reverses
 *     without external intervention.  The function detects this
 *     and returns `isBurnoutRisk: true` so the engine can apply
 *     a Health penalty upstream.
 *
 * Drops into the Rule Engine as:
 *
 *   E.registerRule({
 *     id: 'wealth.business',
 *     dimension: 'wealth',
 *     appliesTo: (s) => s.primaryStatus === 'entrepreneur',
 *     evaluate: (s) => {
 *       const r = calculateBusinessScore(
 *         s.cashFlowStage, s.weeklyHours,
 *         s.customerBase, s.entrepreneurChannel,
 *       );
 *       // Stash burnout flag for health modifier
 *       if (r.isBurnoutRisk) ctx.scratch.isBurnoutRisk = true;
 *       return { dimension: 'wealth', delta: r.score, ... };
 *     },
 *   });
 *
 * No external dependencies.  No I/O.  Same input → same output.
 * ============================================================ */

// ════════════════════════════════════════════════════════════
//   Configuration — every tunable lives here
// ════════════════════════════════════════════════════════════

// ── Cash flow (QKAC1) ──

/**
 * Cash flow stage values — mapped from QKAC1 option indices:
 *
 *   opt 0 → 'stable_profit'     稳定盈利并保持增长
 *   opt 1 → 'break_even'        基本实现收支平衡
 *   opt 2 → 'pre_revenue'       暂未正式盈利（研发/验证阶段）
 *   opt 3 → 'losing_money'      亏损中，靠积蓄或融资维持
 *   opt 4 → 'severe_debt'       极高负债，面临资金链断裂
 */
type CashFlowStage =
  | 'stable_profit'
  | 'break_even'
  | 'pre_revenue'
  | 'losing_money'
  | 'severe_debt';

const CASH_FLOW_SCORES: Readonly<Record<CashFlowStage, number>> = Object.freeze({
  stable_profit: 10,
  break_even:     5,
  pre_revenue:    2,
  losing_money:  -2,
  severe_debt:   -6,
});

// ── Weekly hours (QKAC2) ──

/**
 * Weekly hours bands — mapped from QKAC2 option indices:
 *
 *   opt 0 → 'under_40'        40小时以内
 *   opt 1 → '40_to_60'        40-60小时
 *   opt 2 → '60_to_80'        60-80小时
 *   opt 3 → 'over_80'         80小时以上（全年无休）
 */
type WeeklyHoursBand =
  | 'under_40'
  | '40_to_60'
  | '60_to_80'
  | 'over_80';

/**
 * Hours scores for NON-side-hustle founders.
 *
 * Under 40 is the sweet spot (score 4): the business runs
 * without the founder grinding.  That implies systems,
 * delegation, or product-market fit — all strong signals.
 *
 * 40–60 is normal startup pace (score 2).
 *
 * 60–80 starts to hurt sustainability (score 0) — it's not
 * penalized, but it's not rewarded either.
 *
 * 80+ is destructive (score -3) — the founder is burning
 * the candle at both ends.  Combined with poor cash flow,
 * this triggers the burnout flag.
 */
const HOURS_SCORES: Readonly<Record<WeeklyHoursBand, number>> = Object.freeze({
  under_40:  4,
  '40_to_60':  2,
  '60_to_80':  0,
  over_80:  -3,
});

/**
 * Hours scores for SIDE HUSTLE founders.
 *
 * Side hustlers have a lower ceiling AND a softer floor.
 * Extreme hours in a side hustle don't produce proportional
 * returns (attention is split with the day job), so the
 * max is 2 instead of 4.  But 80+ hours is also less
 * punishing because it's rarer and usually temporary.
 */
const HOURS_SCORES_SIDE_HUSTLE: Readonly<Record<WeeklyHoursBand, number>> = Object.freeze({
  under_40:  2,
  '40_to_60':  1,
  '60_to_80':  0,
  over_80:  -1,
});

// ── Customer stickiness (QKAC3) ──

/**
 * Customer base levels — mapped from QKAC3 option indices:
 *
 *   opt 0 → 'ultra_sticky'     粘性极高，复购率超过50%
 *   opt 1 → 'sticky'           粘性高，稳定核心客户群
 *   opt 2 → 'moderate_churn'   有一定基础，流失率较高
 *   opt 3 → 'early_validation' 首批客户，仍在验证PMF
 *   opt 4 → 'cold_start'       冷启动，几乎没有实际交易
 */
type CustomerBase =
  | 'ultra_sticky'
  | 'sticky'
  | 'moderate_churn'
  | 'early_validation'
  | 'cold_start';

const CUSTOMER_SCORES: Readonly<Record<CustomerBase, number>> = Object.freeze({
  ultra_sticky:      6,
  sticky:            4,
  moderate_churn:    2,
  early_validation:  1,
  cold_start:        0,
});

// ── Entrepreneur channel (QKAC4) ──

/**
 * Entrepreneur channel — mapped from QKAC4 option indices:
 *
 *   opt 0 → 'certified_mogul'   被认证的企业家
 *   opt 1 → 'founder'           任意行业创始人
 *   opt 2 → 'solo_operator'     小型个体经营者
 *   opt 3 → 'side_hustle'       副业尝试者
 */
type EntrepreneurChannel =
  | 'certified_mogul'
  | 'founder'
  | 'solo_operator'
  | 'side_hustle';

/**
 * Channel base weight — multiplied against the raw composite
 * to determine the final score.  This is the "ceiling" knob.
 *
 * Certified moguls get the full weight because the market has
 * already validated them.  Side hustlers get a compressed
 * weight because the venture hasn't earned full conviction.
 */
const CHANNEL_WEIGHTS: Readonly<Record<EntrepreneurChannel, number>> = Object.freeze({
  certified_mogul: 1.00,
  founder:         0.85,
  solo_operator:   0.65,
  side_hustle:     0.45,
});

// ── Moat multiplier ──

/**
 * When cash flow is 'stable_profit' AND customer base is
 * 'ultra_sticky', the business has a genuine moat.  This
 * combination is extremely rare and deserves a multiplicative
 * bonus — it's the entrepreneurial equivalent of compound
 * interest.
 *
 * 1.50 means a 50% bonus on top of the already-high base.
 */
const MOAT_MULTIPLIER = 1.50;

// ── Burnout penalty ──

/**
 * When cash flow is 'losing_money' or 'severe_debt' AND
 * weekly hours are 'over_80', the founder is in the burnout
 * trap: working unsustainably hard on something that isn't
 * working financially.
 *
 * The penalty factor scales the final score downward and
 * the function sets `isBurnoutRisk: true` so the engine
 * can apply a separate Health dimension penalty.
 */
const BURNOUT_PENALTY_FACTOR = 0.40;

// ── Output range ──

const SCORE_FLOOR = -10;
const SCORE_CEILING = 25;

// ════════════════════════════════════════════════════════════
//   Public types
// ════════════════════════════════════════════════════════════

export interface BusinessScoreResult {
  /**
   * Final score in [SCORE_FLOOR, SCORE_CEILING].
   * Positive = business is contributing to wealth dimension.
   * Negative = business is actively draining wealth.
   */
  score: number;

  /**
   * True if the founder is in the burnout trap:
   * losing money + working 80+ hours.  The engine should
   * use this to reduce the Health dimension score.
   */
  isBurnoutRisk: boolean;

  /**
   * True if the business has a moat (stable profit +
   * ultra-sticky customers).  Useful for analysis UI.
   */
  hasMoat: boolean;

  /**
   * The channel weight applied.  Useful for the analysis
   * breakdown to show "side hustle ceiling: 45%".
   */
  channelWeight: number;

  /**
   * Raw component scores before weighting, for the
   * analysis breakdown charts.
   */
  breakdown: {
    cashFlow: number;
    hours: number;
    customers: number;
    rawComposite: number;
  };
}

// ════════════════════════════════════════════════════════════
//   Core logic
// ════════════════════════════════════════════════════════════

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Determine if a cash flow stage qualifies for the burnout
 * check — i.e., is the business financially distressed?
 */
function isFinanciallyDistressed(cashFlow: CashFlowStage): boolean {
  return cashFlow === 'losing_money' || cashFlow === 'severe_debt';
}

// ════════════════════════════════════════════════════════════
//   Public API
// ════════════════════════════════════════════════════════════

/**
 * Calculate the business/entrepreneurship score from four
 * categorical inputs corresponding to QKAC1–QKAC4.
 *
 * Behavior summary:
 *
 *   cashFlow        customers        channel          hours     → score  burnout  moat
 *   ─────────────   ──────────────   ──────────────   ────────  ──────  ───────  ────
 *   stable_profit   ultra_sticky     certified_mogul  under_40  → 25     no       yes
 *   stable_profit   ultra_sticky     side_hustle      under_40  → 11     no       yes
 *   stable_profit   sticky           founder          40_to_60  → 11     no       no
 *   break_even      moderate_churn   founder          40_to_60  →  6     no       no
 *   pre_revenue     early_validation founder          60_to_80  →  2     no       no
 *   losing_money    cold_start       founder          over_80   → -3     YES      no
 *   severe_debt     cold_start       founder          over_80   → -6     YES      no
 *   severe_debt     cold_start       side_hustle      over_80   → -3     YES      no
 *
 * Edge cases (all return neutral score 0):
 *   - undefined / null inputs
 *   - unrecognized category strings
 *
 * @param cashFlow       From QKAC1 mapping
 * @param weeklyHours    From QKAC2 mapping
 * @param customerBase   From QKAC3 mapping
 * @param channel        From QKAC4 mapping
 * @returns Full result — never throws, never returns null.
 */
export function calculateBusinessScore(
  cashFlow: string | undefined | null,
  weeklyHours: string | undefined | null,
  customerBase: string | undefined | null,
  channel: string | undefined | null,
): BusinessScoreResult {

  // ── Neutral fallback for missing/unrecognized inputs ──
  const neutral: BusinessScoreResult = {
    score: 0,
    isBurnoutRisk: false,
    hasMoat: false,
    channelWeight: 1.0,
    breakdown: { cashFlow: 0, hours: 0, customers: 0, rawComposite: 0 },
  };

  // Validate all inputs exist in their respective lookup tables
  const cf = cashFlow as CashFlowStage;
  const wh = weeklyHours as WeeklyHoursBand;
  const cb = customerBase as CustomerBase;
  const ch = channel as EntrepreneurChannel;

  if (!cashFlow || CASH_FLOW_SCORES[cf] === undefined) return neutral;
  if (!weeklyHours || HOURS_SCORES[wh] === undefined) return neutral;
  if (!customerBase || CUSTOMER_SCORES[cb] === undefined) return neutral;
  if (!channel || CHANNEL_WEIGHTS[ch] === undefined) return neutral;

  // ── Step 1: Look up component scores ──

  const isSideHustle = ch === 'side_hustle';
  const cashFlowPts  = CASH_FLOW_SCORES[cf];
  const hoursPts     = isSideHustle ? HOURS_SCORES_SIDE_HUSTLE[wh] : HOURS_SCORES[wh];
  const customerPts  = CUSTOMER_SCORES[cb];

  // ── Step 2: Raw composite (additive) ──

  const rawComposite = cashFlowPts + hoursPts + customerPts;

  // ── Step 3: Channel weight (multiplicative ceiling) ──

  const channelWeight = CHANNEL_WEIGHTS[ch];
  let weighted = rawComposite * channelWeight;

  // ── Step 4: Moat multiplier ──
  // stable_profit + ultra_sticky → revenue + retention = moat

  const hasMoat = cf === 'stable_profit' && cb === 'ultra_sticky';
  if (hasMoat) {
    weighted *= MOAT_MULTIPLIER;
  }

  // ── Step 5: Burnout detection ──
  // Financially distressed + 80+ hours → burnout trap

  const isBurnoutRisk = isFinanciallyDistressed(cf) && wh === 'over_80';
  if (isBurnoutRisk) {
    weighted *= BURNOUT_PENALTY_FACTOR;
  }

  // ── Step 6: Clamp and round ──

  const finalScore = clamp(Math.round(weighted), SCORE_FLOOR, SCORE_CEILING);

  return {
    score: finalScore,
    isBurnoutRisk,
    hasMoat,
    channelWeight,
    breakdown: {
      cashFlow: cashFlowPts,
      hours: hoursPts,
      customers: customerPts,
      rawComposite,
    },
  };
}

// ════════════════════════════════════════════════════════════
//   Convenience: returns just the score number
// ════════════════════════════════════════════════════════════

export function getBusinessScore(
  cashFlow: string | undefined | null,
  weeklyHours: string | undefined | null,
  customerBase: string | undefined | null,
  channel: string | undefined | null,
): number {
  return calculateBusinessScore(cashFlow, weeklyHours, customerBase, channel).score;
}
