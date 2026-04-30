/* ============================================================
 * ls-fn-wealth.js
 *
 * Vanilla JS port of calculateWealthScore.ts.
 * Attaches to window.LSFn.wealth.
 *
 * Dynamic age-aware wealth scoring using a quadratic life-cycle
 * baseline.
 *
 * NOTE: This function returns RAW scores in [-10, +14] range.
 * The calling code in scoring-rules.js applies 3.5x inflation
 * to convert to the 150-point scale.
 * ============================================================ */
(function () {
  'use strict';

  var AGE_CENTER = {
    under_18: 16, '18_25': 22, '26_35': 30, '36_45': 40, '46_55': 50,
    '56_65': 60, '66_75': 70, '76_85': 80, '86_100': 92, over_100: 105,
  };

  var SAVINGS_PERCENTILE = {
    net_debt:             -0.20,
    paycheck_to_paycheck:  0.05,
    low:                   0.20,
    moderate:              0.45,
    healthy:               0.70,
    abundant:              1.00,
    unspecified:           NaN,
  };

  var PEAK_AGE = 58;
  var PEAK_WEALTH = 0.75;
  var CURVATURE = 0.70 / 1296;
  var MAX_POSITIVE_SCORE = 14;
  var MAX_NEGATIVE_SCORE = -10;
  var PENALTY_SEVERITY = 18;
  var REWARD_SCALE = 9;

  function expectedWealthAt(age) {
    if (!isFinite(age)) return 0;
    var raw = PEAK_WEALTH - CURVATURE * Math.pow(age - PEAK_AGE, 2);
    return Math.max(0, Math.min(PEAK_WEALTH, raw));
  }

  function adultEarningWeight(age) {
    if (!isFinite(age) || age < 18) return 0;
    if (age < 35) return (age - 18) / 17;
    if (age <= 65) return 1;
    if (age < 85) return 1 - 0.5 * ((age - 65) / 20);
    return 0.5;
  }

  function clamp(value, min, max) {
    if (!isFinite(value)) return 0;
    return Math.min(max, Math.max(min, value));
  }

  function calculateWealthScore(ageRange, savingsLevel) {
    if (!ageRange || !savingsLevel) return 0;
    if (!Object.prototype.hasOwnProperty.call(AGE_CENTER, ageRange)) return 0;
    if (!Object.prototype.hasOwnProperty.call(SAVINGS_PERCENTILE, savingsLevel)) return 0;
    var age = AGE_CENTER[ageRange];
    var userPercentile = SAVINGS_PERCENTILE[savingsLevel];
    if (!isFinite(userPercentile)) return 0;
    if (age < 18) return 0;

    var baseline = expectedWealthAt(age);
    var gap = userPercentile - baseline;
    var weight = adultEarningWeight(age);
    var EPSILON = 1e-9;
    var rawScore;
    if (gap < -EPSILON) {
      rawScore = -PENALTY_SEVERITY * weight * gap * gap;
    } else if (gap > EPSILON) {
      rawScore = REWARD_SCALE * Math.log(1 + gap);
    } else {
      rawScore = 0;
    }
    return clamp(rawScore, MAX_NEGATIVE_SCORE, MAX_POSITIVE_SCORE);
  }

  function calculateWealthScoreVerbose(ageRange, savingsLevel) {
    var empty = { score: 0, baseline: 0, userPercentile: 0, gap: 0, weight: 0, band: 'on_track' };
    if (!ageRange || !savingsLevel) return empty;
    if (!Object.prototype.hasOwnProperty.call(AGE_CENTER, ageRange)) return empty;
    if (!Object.prototype.hasOwnProperty.call(SAVINGS_PERCENTILE, savingsLevel)) return empty;
    var age = AGE_CENTER[ageRange];
    var userPercentile = SAVINGS_PERCENTILE[savingsLevel];
    if (!isFinite(userPercentile)) return empty;
    if (age < 18) {
      return { score: 0, baseline: 0, userPercentile: userPercentile, gap: 0, weight: 0, band: 'on_track' };
    }
    var baseline = expectedWealthAt(age);
    var gap = userPercentile - baseline;
    var weight = adultEarningWeight(age);
    var score = calculateWealthScore(ageRange, savingsLevel);
    // Band thresholds based on RAW score (pre-inflation)
    var band;
    if (score <= -6)      band = 'severe_penalty';
    else if (score < 0)   band = 'mild_penalty';
    else if (score === 0) band = 'on_track';
    else if (score < 8)   band = 'mild_reward';
    else                  band = 'strong_reward';
    return { score: score, baseline: baseline, userPercentile: userPercentile, gap: gap, weight: weight, band: band };
  }

  window.LSFn = window.LSFn || {};
  window.LSFn.wealth = {
    calculate: calculateWealthScore,
    calculateVerbose: calculateWealthScoreVerbose,
  };
})();
