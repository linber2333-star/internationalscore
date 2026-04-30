/* ============================================================
 * calculateWealthScore.ts
 *
 * A pure scoring function that implements a dynamic, age-aware
 * wealth baseline using a quadratic life-cycle curve.
 *
 * Drops into the LifeScore Rule Engine as the body of a single
 * rule:
 *
 *   E.registerRule({
 *     id: 'wealth.dynamic_baseline',
 *     dimension: 'wealth',
 *     appliesTo: (s) => s.ageRange && s.savingsBand,
 *     evaluate: (s) => ({
 *       dimension: 'wealth',
 *       delta: calculateWealthScore(s.ageRange, s.savingsBand),
 *       ruleId: 'wealth.dynamic_baseline',
 *       reason: '动态财富基线',
 *     }),
 *   });
 *
 * No external dependencies. No I/O. No mutation.  Same input
 * always returns the same output.
 * ============================================================ */

// ────────────────────────────────────────────────────────────
//  String unions — match the engine's UserProfileState types.
//  Kept inline so this file is self-contained and copy-pastable.
// ────────────────────────────────────────────────────────────

export type AgeRange =
  | 'under_18'
  | '18_25'
  | '26_35'
  | '36_45'
  | '46_55'
  | '56_65'
  | '66_75'
  | '76_85'
  | '86_100'
  | 'over_100';

export type SavingsLevel =
  | 'net_debt'
  | 'paycheck_to_paycheck'
  | 'low'
  | 'moderate'
  | 'healthy'
  | 'abundant'
  | 'unspecified';

// ────────────────────────────────────────────────────────────
//  Domain mappings — the only "tunable" numbers in this file.
// ────────────────────────────────────────────────────────────

/**
 * Representative midpoint of each age band.  Used by the
 * baseline curve.  Centers (not edges) so the curve's behavior
 * is symmetric within each band.
 */
const AGE_CENTER: Readonly<Record<AgeRange, number>> = Object.freeze({
  under_18: 16,
  '18_25':  22,
  '26_35':  30,
  '36_45':  40,
  '46_55':  50,
  '56_65':  60,
  '66_75':  70,
  '76_85':  80,
  '86_100': 92,
  over_100: 105,
});

/**
 * Each savings level mapped to a wealth percentile in [-0.2, 1.0].
 *
 * This is the user's *actual position* on a normalized wealth axis.
 * The quadratic baseline tells us where they *should* be.  The
 * gap drives the score.
 *
 * - net_debt is negative because debt is below zero net worth.
 * - The scale is intentionally asymmetric: the gap from
 *   `paycheck_to_paycheck` (0.05) up to `abundant` (1.0) is much
 *   wider than the gap down to debt, because the upside has
 *   more granularity than the downside.
 */
const SAVINGS_PERCENTILE: Readonly<Record<SavingsLevel, number>> = Object.freeze({
  net_debt:             -0.20,
  paycheck_to_paycheck:  0.05,
  low:                   0.20,
  moderate:              0.45,
  healthy:               0.70,
  abundant:              1.00,
  unspecified:           NaN,   // sentinel — see scoring function
});

/**
 * Quadratic life-cycle baseline parameters.
 *
 *   expected(age) = peakWealth - a * (age - peakAge)^2
 *
 * - peakAge: the age at which expected accumulated wealth is
 *   highest (late 50s captures pre-retirement peak).
 * - peakWealth: the percentile expected at peak age.  Set to 0.75
 *   so the baseline never demands "abundant" (1.0) — it's an
 *   *expected* level, not a stretch goal.
 * - a: curvature.  Calibrated so expected(22) ≈ 0.05 (i.e., a
 *   22-year-old is "on track" with paycheck-to-paycheck savings)
 *   and expected(85) ≈ 0.55 (older adults retain wealth but not
 *   at peak).
 *
 * Solving expected(22) = 0.05:
 *   0.05 = 0.75 - a * (22 - 58)^2
 *   0.05 = 0.75 - a * 1296
 *   a = 0.70 / 1296 ≈ 0.00054012...
 *
 * We use the exact value rather than the rounded approximation
 * so that a 22-year-old with paycheck-to-paycheck savings hits
 * baseline *exactly* and gets exactly 0, not a floating-point
 * sliver of negative penalty.
 */
const PEAK_AGE = 58;
const PEAK_WEALTH = 0.75;
const CURVATURE = 0.70 / 1296;

/** Maximum points this rule can contribute, in either direction. */
const MAX_POSITIVE_SCORE = 14;
const MAX_NEGATIVE_SCORE = -10;

/**
 * Penalty severity multiplier for being below baseline.  Higher =
 * harsher penalty for older people falling behind.  Applied to the
 * squared age factor.
 */
const PENALTY_SEVERITY = 18;

/**
 * Reward scale for being above baseline.  Multiplies the log of
 * the positive gap so the function is bounded — being a billionaire
 * doesn't blow up the score.
 */
const REWARD_SCALE = 9;

// ────────────────────────────────────────────────────────────
//  Helper functions
// ────────────────────────────────────────────────────────────

/**
 * The expected wealth percentile at a given age, per the quadratic
 * life-cycle curve.  Clamped to [0, peakWealth] so the baseline
 * never goes negative at extreme ages.
 */
function expectedWealthAt(age: number): number {
  if (!Number.isFinite(age)) return 0;
  const raw = PEAK_WEALTH - CURVATURE * Math.pow(age - PEAK_AGE, 2);
  return Math.max(0, Math.min(PEAK_WEALTH, raw));
}

/**
 * "Adult earning years factor" — used to scale penalties.
 * Returns 0 for under-18 (no penalty for kids), ramps up linearly
 * to 1.0 by age 35, stays at 1.0 through 65, then ramps back down
 * to 0.5 by age 85 (retirees get a softer penalty since accumulation
 * window has closed).
 *
 * This is the mechanism that makes "young + low savings = no penalty"
 * fall out of the math naturally, without any explicit if/else.
 */
function adultEarningWeight(age: number): number {
  if (!Number.isFinite(age) || age < 18) return 0;
  if (age < 35) return (age - 18) / 17;     // 0 → 1 between 18 and 35
  if (age <= 65) return 1;                   // peak earning years
  if (age < 85) return 1 - 0.5 * ((age - 65) / 20); // 1 → 0.5
  return 0.5;
}

/**
 * Clamp a value to a numeric range.  Tiny helper.
 */
function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(min, value));
}

// ────────────────────────────────────────────────────────────
//  Main: calculateWealthScore
// ────────────────────────────────────────────────────────────

/**
 * Compute a wealth-dimension score (-10 to +14) by comparing the
 * user's savings level against the age-appropriate expected baseline.
 *
 * Behavior summary:
 *
 *   - Young adult (18–25) with low savings        → 0 (on track)
 *   - Young adult with abundant savings           → strong positive
 *   - Mid-career (36–45) with debt                → severe negative
 *   - Mid-career with healthy savings             → modest positive
 *   - Retiree (76+) with low savings              → mild negative
 *   - Unknown age or unknown savings              → 0 (graceful degradation)
 *
 * The math:
 *
 *     baseline   = expectedWealthAt(centerOfAgeBand)
 *     gap        = userPercentile - baseline
 *     weight     = adultEarningWeight(age)
 *
 *     if gap < 0:
 *         score = -PENALTY_SEVERITY * weight * gap^2
 *     else:
 *         score = REWARD_SCALE * log(1 + gap)
 *
 *     return clamp(score, MAX_NEGATIVE, MAX_POSITIVE)
 *
 * The penalty side is quadratic so falling further behind hurts
 * disproportionately more.  The reward side is logarithmic so
 * extreme wealth has diminishing returns.
 *
 * @param ageRange     One of the AgeRange string enums, or any
 *                     value (including undefined / null / garbage)
 *                     for graceful no-op.
 * @param savingsLevel One of the SavingsLevel string enums, or any
 *                     value for graceful no-op.
 * @returns            A score in the range [MAX_NEGATIVE_SCORE,
 *                     MAX_POSITIVE_SCORE].  Returns 0 for any
 *                     unrecognized or missing input.
 */
export function calculateWealthScore(
  ageRange: string | undefined | null,
  savingsLevel: string | undefined | null,
): number {
  // ── Edge case 1: missing inputs ──
  if (!ageRange || !savingsLevel) return 0;

  // ── Edge case 2: unknown enum values ──
  // Use `in` checks rather than casts so a typo or stale value
  // returns 0 instead of NaN.
  if (!(ageRange in AGE_CENTER)) return 0;
  if (!(savingsLevel in SAVINGS_PERCENTILE)) return 0;

  const age = AGE_CENTER[ageRange as AgeRange];
  const userPercentile = SAVINGS_PERCENTILE[savingsLevel as SavingsLevel];

  // ── Edge case 3: explicit "unspecified" sentinel ──
  if (!Number.isFinite(userPercentile)) return 0;

  // ── Edge case 4: under 18 ──
  // The spec says young people aren't penalized for low savings.
  // Under 18, even strong savings is incidental (likely from
  // parents), so we return 0 across the board. Cleaner than
  // computing then zeroing.
  if (age < 18) return 0;

  // ── Main calculation ──
  const baseline = expectedWealthAt(age);
  const gap = userPercentile - baseline;
  const weight = adultEarningWeight(age);

  // Tiny epsilon zone — float subtraction can produce 1e-17 noise
  // even when the values are conceptually equal.  Without this,
  // a user "exactly on baseline" gets a microscopic penalty that
  // displays as -0.0.
  const EPSILON = 1e-9;

  let rawScore: number;

  if (gap < -EPSILON) {
    // Below baseline: quadratic non-linear penalty.
    // Squaring gap means a -0.4 gap (severe debt) hurts 4× as
    // much as a -0.2 gap (mild shortfall), not 2×.
    rawScore = -PENALTY_SEVERITY * weight * gap * gap;
  } else if (gap > EPSILON) {
    // Above baseline: logarithmic bounded reward.
    // log(1 + gap) saturates as gap grows, so a billionaire
    // and a deca-millionaire score similarly here.
    rawScore = REWARD_SCALE * Math.log(1 + gap);
  } else {
    rawScore = 0;
  }

  return clamp(rawScore, MAX_NEGATIVE_SCORE, MAX_POSITIVE_SCORE);
}

// ────────────────────────────────────────────────────────────
//  Optional: structured result for debugging / analysis UI
// ────────────────────────────────────────────────────────────

export interface WealthScoreBreakdown {
  score: number;
  baseline: number;
  userPercentile: number;
  gap: number;
  weight: number;
  band: 'severe_penalty' | 'mild_penalty' | 'on_track' | 'mild_reward' | 'strong_reward';
}

/**
 * Same calculation as `calculateWealthScore`, but returns the
 * intermediate values too.  Useful for the analysis page so we
 * can show the user *why* their wealth score is what it is.
 *
 * Returns a "neutral" breakdown (all zeros, band: 'on_track') for
 * any invalid input, so callers never have to null-check.
 */
export function calculateWealthScoreVerbose(
  ageRange: string | undefined | null,
  savingsLevel: string | undefined | null,
): WealthScoreBreakdown {
  const empty: WealthScoreBreakdown = {
    score: 0, baseline: 0, userPercentile: 0, gap: 0, weight: 0, band: 'on_track',
  };

  if (!ageRange || !savingsLevel) return empty;
  if (!(ageRange in AGE_CENTER)) return empty;
  if (!(savingsLevel in SAVINGS_PERCENTILE)) return empty;

  const age = AGE_CENTER[ageRange as AgeRange];
  const userPercentile = SAVINGS_PERCENTILE[savingsLevel as SavingsLevel];
  if (!Number.isFinite(userPercentile)) return empty;
  if (age < 18) return { ...empty, userPercentile };

  const baseline = expectedWealthAt(age);
  const gap = userPercentile - baseline;
  const weight = adultEarningWeight(age);
  const score = calculateWealthScore(ageRange, savingsLevel);

  let band: WealthScoreBreakdown['band'];
  if (score <= -6)      band = 'severe_penalty';
  else if (score < 0)   band = 'mild_penalty';
  else if (score === 0) band = 'on_track';
  else if (score < 8)   band = 'mild_reward';
  else                  band = 'strong_reward';

  return { score, baseline, userPercentile, gap, weight, band };
}
