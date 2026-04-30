/* ============================================================
 * ls-fn-bmi.js
 *
 * Vanilla JS port of estimateBMI.ts.
 * Attaches to window.LSFn.bmi.
 *
 * Returns a MULTIPLIER in [0.5, 1.0] range.
 * The calling code in scoring-rules.js applies this to an
 * inflated BASELINE of 35 (was 10, inflated by 3.5x).
 *
 * Formula: delta = BASELINE * multiplier - BASELINE
 * - Perfect BMI (mult=1.0): delta = 0
 * - Poor BMI (mult=0.5): delta = -17.5 (rounded to -18)
 * ============================================================ */
(function () {
  'use strict';

  var BMI_CENTER_MALE    = 22.0;
  var BMI_CENTER_FEMALE  = 21.5;
  var BMI_CENTER_NEUTRAL = 21.75;
  var BMI_SIGMA = 4.0;
  var MIN_MODIFIER = 0.5;
  var MAX_MODIFIER = 1.0;
  var OPEN_BAND_HALF_WIDTH = 2.5;

  var FALLBACK_HEIGHT_MAP = {
    '165cm 以下': 162.5, '165 - 170cm': 167.5, '170 - 175cm': 172.5,
    '175 - 180cm': 177.5, '180 - 185cm': 182.5, '185cm 以上': 187.5,
    '155cm 以下': 152.5, '155 - 160cm': 157.5, '160 - 165cm': 162.5,
    '175cm 以上': 177.5,
  };

  var FALLBACK_WEIGHT_MAP = {
    '55kg 以下（偏瘦）': 52.5,
    '55 - 70kg（偏轻/正常）': 62.5,
    '55 - 70kg（偏輕/正常）': 62.5,
    '70 - 85kg（正常/健壮）': 77.5,
    '70 - 85kg（正常/健壯）': 77.5,
    '85 - 100kg（偏重）': 92.5,
    '100kg 以上（超重）': 102.5,
    '45kg 以下（偏瘦）': 42.5,
    '45 - 55kg（偏轻/正常）': 50.0,
    '45 - 55kg（偏輕/正常）': 50.0,
    '55 - 65kg（正常/健康）': 60.0,
    '65 - 80kg（偏重）': 72.5,
    '80kg 以上（超重）': 82.5,
  };

  function extractNumbers(input) {
    var matches = input.match(/\d+(?:\.\d+)?/g);
    if (!matches) return [];
    var out = [];
    for (var i = 0; i < matches.length; i++) {
      var n = parseFloat(matches[i]);
      if (isFinite(n)) out.push(n);
    }
    return out;
  }

  function detectOpenDirection(input) {
    if (/(以下|及以下|以内)/.test(input)) return 'lt';
    if (/(以上|及以上|超过)/.test(input)) return 'gt';
    if (/\b(under|below|less)\b/i.test(input)) return 'lt';
    if (/\b(over|above|more)\b/i.test(input) || input.indexOf('+') !== -1) return 'gt';
    return null;
  }

  function parseRangeMidpoint(rangeStr, fallbackMap) {
    if (!rangeStr || typeof rangeStr !== 'string') return null;
    var nums = extractNumbers(rangeStr);
    if (nums.length >= 2) return (nums[0] + nums[1]) / 2;
    if (nums.length === 1) {
      var dir = detectOpenDirection(rangeStr);
      if (dir === 'lt') return nums[0] - OPEN_BAND_HALF_WIDTH;
      if (dir === 'gt') return nums[0] + OPEN_BAND_HALF_WIDTH;
      return nums[0];
    }
    if (fallbackMap && Object.prototype.hasOwnProperty.call(fallbackMap, rangeStr)) {
      return fallbackMap[rangeStr];
    }
    return null;
  }

  function computeBMI(heightCm, weightKg) {
    var heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }

  function bmiCenterFor(gender) {
    if (!gender) return BMI_CENTER_NEUTRAL;
    var g = String(gender).toLowerCase();
    if (g === 'male' || g === 'm' || g === '男' || g === '男性') return BMI_CENTER_MALE;
    if (g === 'female' || g === 'f' || g === '女' || g === '女性') return BMI_CENTER_FEMALE;
    return BMI_CENTER_NEUTRAL;
  }

  function bmiToModifier(bmi, center) {
    if (!isFinite(bmi) || bmi <= 0) return MAX_MODIFIER;
    var capped = Math.min(bmi, 60);
    var distance = capped - center;
    var decay = Math.exp(-(distance * distance) / (2 * BMI_SIGMA * BMI_SIGMA));
    var raw = MIN_MODIFIER + (MAX_MODIFIER - MIN_MODIFIER) * decay;
    return Math.min(MAX_MODIFIER, Math.max(MIN_MODIFIER, raw));
  }

  function estimateBMIVerbose(heightRange, weightRange, gender) {
    var center = bmiCenterFor(gender);
    var neutral = {
      modifier: MAX_MODIFIER,
      bmi: null,
      heightCm: null,
      weightKg: null,
      category: 'unknown',
      bmiCenter: center,
    };
    if (!heightRange || !weightRange) return neutral;
    var heightCm = parseRangeMidpoint(heightRange, FALLBACK_HEIGHT_MAP);
    var weightKg = parseRangeMidpoint(weightRange, FALLBACK_WEIGHT_MAP);
    if (heightCm === null || weightKg === null) return neutral;
    if (heightCm < 50 || heightCm > 250) {
      return { modifier: MAX_MODIFIER, bmi: null, heightCm: heightCm, weightKg: weightKg, category: 'unknown', bmiCenter: center };
    }
    if (weightKg < 20 || weightKg > 400) {
      return { modifier: MAX_MODIFIER, bmi: null, heightCm: heightCm, weightKg: weightKg, category: 'unknown', bmiCenter: center };
    }
    var bmi = computeBMI(heightCm, weightKg);
    var modifier = bmiToModifier(bmi, center);
    var category;
    if (bmi < 16)      category = 'underweight_severe';
    else if (bmi < 18.5) category = 'underweight';
    else if (bmi < 25) category = 'healthy';
    else if (bmi < 30) category = 'overweight';
    else               category = 'obese';
    return {
      modifier: Math.round(modifier * 1000) / 1000,
      bmi: Math.round(bmi * 10) / 10,
      heightCm: heightCm,
      weightKg: weightKg,
      category: category,
      bmiCenter: center,
    };
  }

  function estimateBMI(heightRange, weightRange, gender) {
    return estimateBMIVerbose(heightRange, weightRange, gender).modifier;
  }

  window.LSFn = window.LSFn || {};
  window.LSFn.bmi = {
    estimate: estimateBMI,
    estimateVerbose: estimateBMIVerbose,
    parseRangeMidpoint: parseRangeMidpoint,
  };
})();
