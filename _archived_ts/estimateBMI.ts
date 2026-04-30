/* ============================================================
 * estimateBMI.ts
 *
 * Convert categorical height + weight + gender (the format the
 * LifeScore quiz collects) into an approximate BMI and a health
 * modifier multiplier in [0.5, 1.0].
 *
 *   1.0   = healthy BMI for the user's gender
 *   ~0.8  = mildly outside healthy range
 *   ~0.6  = clinically over/underweight
 *   0.5   = severe outlier (floor — never goes lower)
 *
 * Designed as a multiplicative modifier on health-dimension
 * contributions, not as a standalone score:
 *
 *   const mult = estimateBMI(s.heightRange, s.weightRange, s.gender);
 *   return { ..., delta: rawHealthScore * mult };
 *
 * The multiplier is smooth (Gaussian decay), so adjacent BMI
 * bands never produce visible cliffs in the user-facing score.
 *
 * Pure function. No external dependencies. No I/O. No mutation.
 * Same input always returns the same output.
 * ============================================================ */

// ════════════════════════════════════════════════════════════
//   Configuration — every tunable lives here
// ════════════════════════════════════════════════════════════

/**
 * BMI values at which the modifier is exactly 1.0 — the gender-
 * appropriate "ideal" BMI center.  Women's center sits ~0.5 lower
 * than men's because the same BMI implies more body fat in women.
 * Soft heuristic, well within categorical-input noise.
 */
const BMI_CENTER_MALE    = 22.0;
const BMI_CENTER_FEMALE  = 21.5;
const BMI_CENTER_NEUTRAL = 21.75;

/**
 * Gaussian width.  σ = 4 gives a smooth decay in which:
 *   - BMI within ±1 of center → modifier > 0.97
 *   - BMI at the overweight threshold (25) → modifier ≈ 0.89
 *   - BMI at obesity (30+) or severe underweight (14–) → modifier ≈ 0.65 or lower
 *   - BMI 35+ or < 10 → modifier approaches the floor of 0.5
 */
const BMI_SIGMA = 4.0;

/** Hard floor — even severe outliers never push the multiplier to 0. */
const MIN_MODIFIER = 0.5;
const MAX_MODIFIER = 1.0;

/** Half-width used to fabricate a midpoint for open-ended ranges. */
const OPEN_BAND_HALF_WIDTH = 2.5;

// ════════════════════════════════════════════════════════════
//   Fallback dictionaries — exact labels from quick_questions.js
// ════════════════════════════════════════════════════════════
//
// We try regex parsing first (handles future labels gracefully),
// then consult these maps if the regex fails.  Guarantees the
// actual quiz options always resolve to a sensible midpoint.

const FALLBACK_HEIGHT_MAP: Readonly<Record<string, number>> = Object.freeze({
  // Male bands
  '165cm 以下':  162.5,
  '165 - 170cm': 167.5,
  '170 - 175cm': 172.5,
  '175 - 180cm': 177.5,
  '180 - 185cm': 182.5,
  '185cm 以上':  187.5,
  // Female bands (165-170 / 170-175 overlap with male — same midpoint, fine)
  '155cm 以下':  152.5,
  '155 - 160cm': 157.5,
  '160 - 165cm': 162.5,
  '175cm 以上':  177.5,
});

const FALLBACK_WEIGHT_MAP: Readonly<Record<string, number>> = Object.freeze({
  // Male bands
  '55kg 以下（偏瘦）':       52.5,
  '55 - 70kg（偏轻/正常）':  62.5,
  '55 - 70kg（偏輕/正常）':  62.5,  // zh-TW variant
  '70 - 85kg（正常/健壮）':  77.5,
  '70 - 85kg（正常/健壯）':  77.5,  // zh-TW variant
  '85 - 100kg（偏重）':      92.5,
  '100kg 以上（超重）':      102.5,
  // Female bands
  '45kg 以下（偏瘦）':       42.5,
  '45 - 55kg（偏轻/正常）':  50.0,
  '45 - 55kg（偏輕/正常）':  50.0,  // zh-TW variant
  '55 - 65kg（正常/健康）':  60.0,
  '65 - 80kg（偏重）':       72.5,
  '80kg 以上（超重）':       82.5,
});

// ════════════════════════════════════════════════════════════
//   Parsing helpers
// ════════════════════════════════════════════════════════════

/**
 * Pull all decimal-or-integer numbers out of a string, ignoring
 * surrounding text (Chinese characters, units, parentheticals).
 *
 *   '170 - 175cm'             → [170, 175]
 *   '55 - 70kg（偏轻/正常）'  → [55, 70]
 *   '165cm 以下'              → [165]
 *   '85.5kg'                  → [85.5]
 *   'banana'                  → []
 */
function extractNumbers(input: string): number[] {
  const matches = input.match(/\d+(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map(parseFloat).filter(Number.isFinite);
}

/**
 * Distinguish "less than" from "greater than" when only one
 * number is present in an open-ended range.
 */
function detectOpenDirection(input: string): 'lt' | 'gt' | null {
  // Chinese: 以下/及以下/以内 = less than; 以上/及以上/超过 = more than
  if (/(以下|及以下|以内)/.test(input)) return 'lt';
  if (/(以上|及以上|超过)/.test(input)) return 'gt';
  // English fallbacks for future label additions
  if (/\b(under|below|less)\b/i.test(input)) return 'lt';
  if (/\b(over|above|more)\b/i.test(input) || input.includes('+')) return 'gt';
  return null;
}

/**
 * Parse a categorical range string into a single representative
 * value (its midpoint).
 *
 * Strategy:
 *   1. Regex extraction.
 *   2. Two numbers found → arithmetic midpoint.
 *   3. One number + direction hint → fabricate midpoint.
 *   4. Regex failed → consult fallback dictionary by exact key.
 *   5. Everything failed → null.
 */
export function parseRangeMidpoint(
  rangeStr: string | undefined | null,
  fallbackMap: Readonly<Record<string, number>>,
): number | null {
  if (!rangeStr || typeof rangeStr !== 'string') return null;

  const nums = extractNumbers(rangeStr);

  if (nums.length >= 2) {
    return (nums[0] + nums[1]) / 2;
  }

  if (nums.length === 1) {
    const dir = detectOpenDirection(rangeStr);
    if (dir === 'lt') return nums[0] - OPEN_BAND_HALF_WIDTH;
    if (dir === 'gt') return nums[0] + OPEN_BAND_HALF_WIDTH;
    // Single number with no direction hint — return as-is.
    return nums[0];
  }

  // Regex found nothing.  Consult the fallback dictionary by exact key.
  if (rangeStr in fallbackMap) return fallbackMap[rangeStr];

  return null;
}

// ════════════════════════════════════════════════════════════
//   BMI math
// ════════════════════════════════════════════════════════════

/** Standard BMI: weight (kg) divided by height (m) squared. */
function computeBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/** Pick the BMI center for the multiplier curve based on gender. */
function bmiCenterFor(gender: string | undefined | null): number {
  if (!gender) return BMI_CENTER_NEUTRAL;
  const g = gender.toLowerCase();
  if (g === 'male'   || g === 'm' || g === '男' || g === '男性') return BMI_CENTER_MALE;
  if (g === 'female' || g === 'f' || g === '女' || g === '女性') return BMI_CENTER_FEMALE;
  return BMI_CENTER_NEUTRAL;
}

/**
 * Map a BMI value to a multiplier in [MIN_MODIFIER, MAX_MODIFIER]
 * using a Gaussian decay centered on `center`.
 *
 *   modifier(bmi) = MIN + (MAX - MIN) * exp(-(bmi - center)² / (2σ²))
 *
 * At bmi == center → 1.0.  Decays smoothly toward MIN_MODIFIER as
 * bmi moves away in either direction.  Symmetric — under and over
 * are penalized equally.
 */
function bmiToModifier(bmi: number, center: number): number {
  if (!Number.isFinite(bmi) || bmi <= 0) return MAX_MODIFIER;

  // Cap extreme values.  BMI > 60 is essentially nonsense from a
  // categorical input anyway.
  const cappedBmi = Math.min(bmi, 60);

  const distance = cappedBmi - center;
  const decay = Math.exp(-(distance * distance) / (2 * BMI_SIGMA * BMI_SIGMA));
  const raw = MIN_MODIFIER + (MAX_MODIFIER - MIN_MODIFIER) * decay;

  // Defensive clamp — should already be in range but float math.
  return Math.min(MAX_MODIFIER, Math.max(MIN_MODIFIER, raw));
}

// ════════════════════════════════════════════════════════════
//   Public API
// ════════════════════════════════════════════════════════════

/**
 * Estimate BMI from categorical inputs and return the multiplier.
 *
 * Behavior summary:
 *   - Healthy ranges (BMI 18.5–24.9)         → ~1.0
 *   - Mild over/underweight                  → 0.85–0.95
 *   - Clinical over/underweight              → 0.6–0.75
 *   - Severe obesity / severe underweight    → 0.5 (floor)
 *   - Any unparseable / missing input        → 1.0 (graceful)
 *
 * @param heightRange  e.g. '170 - 175cm', '165cm 以下', '185cm 以上'
 * @param weightRange  e.g. '70 - 85kg（正常/健壮）', '100kg 以上（超重）'
 * @param gender       'male' / 'female' / '男' / '女' / undefined
 * @returns            multiplier in [0.5, 1.0], or 1.0 on bad input
 */
export function estimateBMI(
  heightRange: string | undefined | null,
  weightRange: string | undefined | null,
  gender: string | undefined | null,
): number {
  return estimateBMIVerbose(heightRange, weightRange, gender).modifier;
}

// ────────────────────────────────────────────────────────────
//   Verbose variant — returns the breakdown for the analysis UI
// ────────────────────────────────────────────────────────────

export type BmiCategory =
  | 'underweight_severe'
  | 'underweight'
  | 'healthy'
  | 'overweight'
  | 'obese'
  | 'unknown';

export interface BMIBreakdown {
  /** Final modifier multiplier in [0.5, 1.0]. */
  modifier: number;
  /** Estimated BMI, or null if inputs were unparseable. */
  bmi: number | null;
  /** Parsed midpoint height in cm, or null. */
  heightCm: number | null;
  /** Parsed midpoint weight in kg, or null. */
  weightKg: number | null;
  /** WHO-style category, or 'unknown' if inputs were unparseable. */
  category: BmiCategory;
  /** The center BMI used for the multiplier curve (depends on gender). */
  bmiCenter: number;
}

/**
 * Like `estimateBMI` but exposes intermediate values for the
 * analysis UI ("Estimated BMI 23.4, within healthy range").
 *
 * Always returns a complete object — never throws, never returns
 * null.  Unparseable inputs yield `{modifier: 1.0, bmi: null, ...}`.
 */
export function estimateBMIVerbose(
  heightRange: string | undefined | null,
  weightRange: string | undefined | null,
  gender: string | undefined | null,
): BMIBreakdown {
  const center = bmiCenterFor(gender);

  // Neutral object returned for any unparseable / invalid case.
  const neutral: BMIBreakdown = {
    modifier: MAX_MODIFIER,
    bmi: null,
    heightCm: null,
    weightKg: null,
    category: 'unknown',
    bmiCenter: center,
  };

  // ── Edge: missing inputs ──
  if (!heightRange || !weightRange) return neutral;

  // ── Edge: parsing failure ──
  const heightCm = parseRangeMidpoint(heightRange, FALLBACK_HEIGHT_MAP);
  const weightKg = parseRangeMidpoint(weightRange, FALLBACK_WEIGHT_MAP);
  if (heightCm === null || weightKg === null) return neutral;

  // ── Edge: implausible parsed values (regex matched the wrong number) ──
  if (heightCm < 50 || heightCm > 250) {
    return { ...neutral, heightCm, weightKg };
  }
  if (weightKg < 20 || weightKg > 400) {
    return { ...neutral, heightCm, weightKg };
  }

  // ── Main calculation ──
  const bmi = computeBMI(heightCm, weightKg);
  const modifier = bmiToModifier(bmi, center);

  // Categorize for the UI breakdown.
  let category: BmiCategory;
  if      (bmi < 16)   category = 'underweight_severe';
  else if (bmi < 18.5) category = 'underweight';
  else if (bmi < 25)   category = 'healthy';
  else if (bmi < 30)   category = 'overweight';
  else                 category = 'obese';

  return {
    modifier: Math.round(modifier * 1000) / 1000,
    bmi: Math.round(bmi * 10) / 10,
    heightCm,
    weightKg,
    category,
    bmiCenter: center,
  };
}
