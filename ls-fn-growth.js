/* ============================================================
 * ls-fn-growth.js
 *
 * Vanilla JS port of calculateGrowthMultiplier.ts.
 * Attaches to window.LSFn.growth.
 *
 * Models the compound effect of two cognitive habits on
 * long-term skill acquisition and career trajectory:
 *
 *   1. Consistency / persistence  (from QKD7)
 *   2. Information quality         (from QKD15)
 *
 * Returns a multiplier in [0.70, 1.50] designed to scale any
 * future skill-acquisition or career-promotion points in the
 * Rule Engine.
 *
 * NOTE: This function is currently not used by scoring-rules.js
 * but is available for future growth-based scoring rules.
 *
 * No dependencies.  No I/O.  Same input → same output.
 * ============================================================ */
(function () {
  'use strict';

  // ════════════════════════════════════════════════════════════
  //   Configuration
  // ════════════════════════════════════════════════════════════

  var CONSISTENCY_WEIGHT  = 0.60;
  var INFO_QUALITY_WEIGHT = 0.40;

  var MIN_MULTIPLIER = 0.70;
  var MAX_MULTIPLIER = 1.50;

  /**
   * Consistency scores — mapped from QKD7 options.
   *
   * QKD7 opt 0 → iron_discipline          (钢铁般的自律)
   * QKD7 opt 1 → consistent_with_feedback (通常可以，正向反馈)
   * QKD7 opt 2 → motivation_dependent     (依靠动力，消退很快)
   * QKD7 opt 3 → abandons_quickly         (每个新计划几周内放弃)
   */
  var CONSISTENCY_SCORES = {
    iron_discipline:          1.00,
    consistent_with_feedback: 0.70,
    motivation_dependent:     0.30,
    abandons_quickly:         0.00,
  };

  /**
   * Information quality scores — mapped from QKD15 options.
   *
   * QKD15 opt 0 → high_filtering       (善于辨别真伪)
   * QKD15 opt 1 → multi_perspective    (接受多角度)
   * QKD15 opt 2 → cautious_logical     (谨慎逻辑推理)
   * QKD15 opt 3 → authority_dependent  (权威认证)
   * QKD15 opt 4 → seeing_is_believing  (眼见为实)
   * QKD15 opt 5 → contrarian_bias      (非官方说法)
   * QKD15 opt 6 → disengaged           (从不关心)
   */
  var INFO_QUALITY_SCORES = {
    high_filtering:       1.00,
    multi_perspective:    0.85,
    cautious_logical:     0.65,
    authority_dependent:  0.45,
    seeing_is_believing:  0.20,
    contrarian_bias:      0.10,
    disengaged:           0.00,
  };

  // ════════════════════════════════════════════════════════════
  //   Helpers
  // ════════════════════════════════════════════════════════════

  function scaleToMultiplier(composite) {
    var clamped = Math.max(0, Math.min(1, composite));
    return MIN_MULTIPLIER + (MAX_MULTIPLIER - MIN_MULTIPLIER) * clamped;
  }

  function tierFromComposite(composite) {
    if (composite >= 0.80) return 'exceptional';
    if (composite >= 0.55) return 'strong';
    if (composite >= 0.30) return 'moderate';
    return 'limited';
  }

  // ════════════════════════════════════════════════════════════
  //   Public API
  // ════════════════════════════════════════════════════════════

  /**
   * Calculate the growth multiplier from consistency level and
   * information quality.
   *
   * @param {string|undefined|null} consistencyLevel
   *   One of: 'iron_discipline', 'consistent_with_feedback',
   *           'motivation_dependent', 'abandons_quickly'
   *
   * @param {string|undefined|null} informationQuality
   *   One of: 'high_filtering', 'multi_perspective',
   *           'cautious_logical', 'authority_dependent',
   *           'seeing_is_believing', 'contrarian_bias',
   *           'disengaged'
   *
   * @returns {{
   *   multiplier: number,
   *   compositeScore: number,
   *   consistencyScore: number,
   *   infoQualityScore: number,
   *   tier: string
   * }}
   *
   * Behavior summary:
   *
   *   consistency              info quality           mult   tier
   *   ──────────────────────   ────────────────────   ────   ──────────
   *   iron_discipline          high_filtering         1.50   exceptional
   *   iron_discipline          seeing_is_believing    0.96   moderate
   *   consistent_with_feedback multi_perspective      1.23   strong
   *   consistent_with_feedback authority_dependent    1.05   moderate
   *   motivation_dependent     high_filtering         1.02   moderate
   *   motivation_dependent     seeing_is_believing    0.78   limited
   *   abandons_quickly         high_filtering         0.86   limited
   *   abandons_quickly         disengaged             0.70   limited
   *
   * Edge cases (missing/unrecognized input):
   *   Both missing → { multiplier: 1.0, tier: 'moderate' }
   *   One missing  → missing dimension treated as 0.5 (neutral)
   */
  function calculateGrowthMultiplier(consistencyLevel, informationQuality) {
    // Look up individual scores; undefined if unrecognized
    var cScore = (consistencyLevel && CONSISTENCY_SCORES[consistencyLevel] !== undefined)
      ? CONSISTENCY_SCORES[consistencyLevel]
      : undefined;

    var iScore = (informationQuality && INFO_QUALITY_SCORES[informationQuality] !== undefined)
      ? INFO_QUALITY_SCORES[informationQuality]
      : undefined;

    // Both missing → perfectly neutral
    if (cScore === undefined && iScore === undefined) {
      return {
        multiplier: 1.0,
        compositeScore: 0.5,
        consistencyScore: 0.5,
        infoQualityScore: 0.5,
        tier: 'moderate',
      };
    }

    // One missing → use 0.5 midpoint so the present one still
    // has influence without the missing one dragging to extremes
    var c = cScore !== undefined ? cScore : 0.5;
    var i = iScore !== undefined ? iScore : 0.5;

    // Weighted composite
    var composite = c * CONSISTENCY_WEIGHT + i * INFO_QUALITY_WEIGHT;

    // Map to multiplier range and round to 2 decimal places
    var multiplier = Math.round(scaleToMultiplier(composite) * 100) / 100;

    return {
      multiplier: multiplier,
      compositeScore: Math.round(composite * 1000) / 1000,
      consistencyScore: c,
      infoQualityScore: i,
      tier: tierFromComposite(composite),
    };
  }

  /**
   * Convenience: returns just the multiplier number.
   */
  function getGrowthMultiplier(consistencyLevel, informationQuality) {
    return calculateGrowthMultiplier(consistencyLevel, informationQuality).multiplier;
  }

  // ════════════════════════════════════════════════════════════
  //   Export
  // ════════════════════════════════════════════════════════════

  window.LSFn = window.LSFn || {};
  window.LSFn.growth = {
    calculate: calculateGrowthMultiplier,
    getMultiplier: getGrowthMultiplier,
  };
})();
