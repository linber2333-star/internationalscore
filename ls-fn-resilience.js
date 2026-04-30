/* ============================================================
 * ls-fn-resilience.js
 *
 * Vanilla JS port of calculateResilienceModifier.ts.
 * Attaches to window.LSFn.resilience.
 *
 * Returns RAW financialResilienceBuff in [-3, +15] range.
 * The calling code in scoring-rules.js applies 3.5x inflation
 * to positive values only, resulting in [-3, +53] effective range.
 *
 * Also returns stressRecoveryRate for display purposes.
 * ============================================================ */
(function () {
  'use strict';

  var BUFF_TABLE = {
    easy_300k:            15,
    family_decent_amount:  8,
    small_loan_only:       2,
    nothing:              -3,
    unspecified:           0,
  };

  var FAMILY_RECOVERY_FACTOR = {
    excellent:        1.00,
    decent:           0.95,
    distant:          0.85,
    toxic:            0.55,
    deceased_good:    0.90,
    deceased_neutral: 0.85,
    unspecified:      1.00,
  };

  var PARTNER_RECOVERY_FACTOR = {
    high:            1.00,
    moderate:        0.95,
    low:             0.85,
    zero:            0.70,
    none_no_partner: 1.00,
    unspecified:     1.00,
  };

  var MIN_RECOVERY_RATE = 0.3;
  var MAX_RECOVERY_RATE = 1.0;
  var LOW_RESILIENCE_THRESHOLD = 0.5;

  function normalize(input, table) {
    if (!input || typeof input !== 'string') return 'unspecified';
    return Object.prototype.hasOwnProperty.call(table, input) ? input : 'unspecified';
  }

  function clamp(v, lo, hi) {
    if (!isFinite(v)) return lo;
    return Math.min(hi, Math.max(lo, v));
  }

  function computeRecoveryRate(family, partner) {
    var familyFactor = FAMILY_RECOVERY_FACTOR[family];
    var partnerFactor = PARTNER_RECOVERY_FACTOR[partner];
    var blended = 0.6 * familyFactor + 0.4 * partnerFactor;
    var bothActivelyHarmful = (family === 'toxic') && (partner === 'zero');
    var penalty = bothActivelyHarmful ? 0.65 : 1.0;
    return clamp(blended * penalty, MIN_RECOVERY_RATE, MAX_RECOVERY_RATE);
  }

  function calculateResilienceModifier(emergencyFunds, familySupport, partnerSupport) {
    var ef = normalize(emergencyFunds, BUFF_TABLE);
    var fs = normalize(familySupport, FAMILY_RECOVERY_FACTOR);
    var ps = normalize(partnerSupport, PARTNER_RECOVERY_FACTOR);

    var buff = BUFF_TABLE[ef];
    var rate = computeRecoveryRate(fs, ps);
    var isLow = rate <= LOW_RESILIENCE_THRESHOLD;

    return {
      financialResilienceBuff: buff,
      stressRecoveryRate: Math.round(rate * 1000) / 1000,
      isLowResilience: isLow,
    };
  }

  function calculateResilienceModifierVerbose(emergencyFunds, familySupport, partnerSupport) {
    var ef = normalize(emergencyFunds, BUFF_TABLE);
    var fs = normalize(familySupport, FAMILY_RECOVERY_FACTOR);
    var ps = normalize(partnerSupport, PARTNER_RECOVERY_FACTOR);
    var base = calculateResilienceModifier(emergencyFunds, familySupport, partnerSupport);
    base.resolvedEmergencyFunds = ef;
    base.resolvedFamilySupport = fs;
    base.resolvedPartnerSupport = ps;
    base.compoundingPenaltyApplied = (fs === 'toxic') && (ps === 'zero');
    return base;
  }

  window.LSFn = window.LSFn || {};
  window.LSFn.resilience = {
    calculate: calculateResilienceModifier,
    calculateVerbose: calculateResilienceModifierVerbose,
  };
})();
