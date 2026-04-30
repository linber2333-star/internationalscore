/* ============================================================
 * ls-fn-addiction.js
 *
 * Vanilla JS port of calculateAddictionMultiplier.ts.
 * Attaches to window.LSFn.addiction.
 *
 * Returns a MULTIPLIER in [0.2, 1.0] range based on addiction count.
 * The calling code in scoring-rules.js applies this to an
 * inflated BASELINE of 35 (was 10, inflated by 3.5x).
 *
 * Formula: delta = BASELINE * multiplier - BASELINE
 * - No addictions (mult=1.0): delta = 0
 * - 1 addiction (mult=0.8): delta = -7
 * - 2 addictions (mult=0.5): delta = -17.5 (rounded to -18)
 * - 3+ addictions (mult=0.2): delta = -28
 * ============================================================ */
(function () {
  'use strict';

  var MULTIPLIER_TABLE = { 0: 1.0, 1: 0.8, 2: 0.5, 3: 0.2 };
  var HIJACK_THRESHOLD = 2;
  var HIJACKED_WEALTH_CAP = 0.6;

  function cleanAddictions(input) {
    if (!Array.isArray(input)) return [];
    var seen = {};
    var out = [];
    for (var i = 0; i < input.length; i++) {
      var entry = input[i];
      if (typeof entry !== 'string') continue;
      var trimmed = entry.trim();
      if (trimmed.length === 0) continue;
      var key = trimmed.toLowerCase();
      if (seen[key]) continue;
      seen[key] = true;
      out.push(trimmed);
    }
    return out;
  }

  function lookupMultiplier(count) {
    if (count <= 0) return MULTIPLIER_TABLE[0];
    if (count === 1) return MULTIPLIER_TABLE[1];
    if (count === 2) return MULTIPLIER_TABLE[2];
    return MULTIPLIER_TABLE[3];
  }

  function calculateAddictionMultiplier(addictions) {
    if (!addictions) {
      return {
        multiplier: 1.0,
        isSeverelyHijacked: false,
        wealthCapFraction: 1.0,
        count: 0,
      };
    }
    var cleaned = cleanAddictions(addictions);
    var count = cleaned.length;
    var multiplier = lookupMultiplier(count);
    var isSeverelyHijacked = count >= HIJACK_THRESHOLD;
    var wealthCapFraction = isSeverelyHijacked ? HIJACKED_WEALTH_CAP : 1.0;
    return {
      multiplier: multiplier,
      isSeverelyHijacked: isSeverelyHijacked,
      wealthCapFraction: wealthCapFraction,
      count: count,
    };
  }

  function getAddictionMultiplier(addictions) {
    return calculateAddictionMultiplier(addictions).multiplier;
  }

  window.LSFn = window.LSFn || {};
  window.LSFn.addiction = {
    calculate: calculateAddictionMultiplier,
    getMultiplier: getAddictionMultiplier,
  };
})();
