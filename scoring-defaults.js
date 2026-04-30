/* ============================================================
 * scoring-defaults.js
 *
 * Pass 1: Default Weight Map for simple questions.
 *
 * HARD MODE ARCHITECTURE:
 * - Positive scores inflated by only 1.5x (nerfed from 3.5x)
 * - Users must accumulate many good habits to climb tiers
 * - Baseline is 40, so reaching C (60) requires +20 points
 *
 * Every scorable question that does NOT have a complex rule in
 * scoring-rules.js gets a simple linear mapping here. This
 * ensures no question ever contributes 0 points silently.
 *
 * Structure:
 *   questionId → optionIndex → { dimension, delta }
 *
 * Load order: scoring-engine.js → scoring-defaults.js → ls-fn-*.js → scoring-rules.js
 * ============================================================ */
(function () {
  'use strict';

  if (!window.LSEngine) {
    console.error('[scoring-defaults] LSEngine not found — load scoring-engine.js first');
    return;
  }

  var E = window.LSEngine;

  /**
   * HARD MODE: Inflation factor calibrated for 90-100 perfect normal score.
   * Positive actions give moderate rewards.
   * Users must accumulate many good habits to reach A tier.
   */
  var INFLATION = 2.0;

  /**
   * Helper: create inflated scores for a dimension.
   * @param {string} dimension - 'health', 'wealth', 'social', or 'mind'
   * @param {number[]} rawScores - array of raw 0-4 scale scores per option
   * @returns {number[]} - inflated scores (rounded to nearest int)
   */
  function inflate(rawScores) {
    return rawScores.map(function(s) {
      return Math.round(s * INFLATION);
    });
  }

  /**
   * Default weight definitions.
   * Format: { qid: { dimension: string, scores: number[] } }
   */
  var DEFAULTS = {

    // ════════════════════════════════════════════════════════════
    //   STUDENT: Academic Stage & Questions
    // ════════════════════════════════════════════════════════════

    // QKA_STAGE — Academic stage (mind) — NO SCORING per spec
    // All options score 0; academic stage does not add or deduct points
    QKA_STAGE: { dimension: 'mind', scores: [0, 0, 0, 0] },

    // ── High School questions ──
    QKA_HS1: { dimension: 'social', scores: inflate([4, 3, 1, 0]) },
    QKA_HS2: { dimension: 'social', scores: inflate([4, 3, 1, 0]) },
    QKA_HS3: { dimension: 'health', scores: inflate([4, 3, 2, 0]) },
    QKA_HS4: { dimension: 'social', scores: inflate([4, 3, 1, 0]) },
    QKA_HS5: { dimension: 'social', scores: inflate([4, 3, 1, 0]) },
    QKA_HS6: { dimension: 'mind', scores: inflate([4, 3, 1, 0]) },
    QKA_HS7: { dimension: 'mind', scores: inflate([4, 3, 1, 0]) },
    QKA_HS8: { dimension: 'social', scores: inflate([4, 3, 1, 0]) },
    QKA_HS9: { dimension: 'health', scores: inflate([4, 3, 1, 0]) },
    QKA_HS10: { dimension: 'social', scores: inflate([4, 3, 2, 0]) },
    QKA_HS11: { dimension: 'mind', scores: inflate([4, 3, 1, 0]) },
    QKA_HS12: { dimension: 'mind', scores: inflate([4, 3, 1, 0]) },

    // ── College/Bachelor questions ──
    QKA_BC1: { dimension: 'health', scores: inflate([4, 3, 1, 0]) },
    QKA_BC2: { dimension: 'mind', scores: inflate([4, 3, 2, 0]) },
    QKA_BC3: { dimension: 'wealth', scores: inflate([4, 3, 1, 0]) },
    QKA_BC4: { dimension: 'mind', scores: inflate([4, 3, 2, 0]) },
    QKA_BC5: { dimension: 'social', scores: inflate([4, 3, 2, 1]) },
    QKA_BC6: { dimension: 'social', scores: inflate([4, 3, 1, 0]) },

    // ── Masters+ questions ──
    QKA_D1: { dimension: 'mind', scores: inflate([4, 3, 1, 0]) },
    QKA_D2: { dimension: 'wealth', scores: inflate([4, 3, 1, 0]) },
    QKA_D3: { dimension: 'mind', scores: inflate([4, 3, 2, 0]) },

    // ════════════════════════════════════════════════════════════
    //   EMPLOYED: Work questions
    // ════════════════════════════════════════════════════════════

    QKAB1: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKAB2: { dimension: 'wealth', scores: inflate([4, 3, 2, 1, 0]) },
    QKAB3: { dimension: 'health', scores: inflate([4, 3, 1, 0]) },
    QKAB4: { dimension: 'social', scores: inflate([4, 3, 2, 1, 0]) },
    QKAB5: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKAB6: { dimension: 'wealth', scores: inflate([4, 3, 2, 1, 0]) },
    QKAB7: { dimension: 'wealth', scores: inflate([4, 3, 2, 1, 0]) },
    // QKAB8 is handled by scoring-rules.js (professionalSkillTier)

    // ════════════════════════════════════════════════════════════
    //   ENTREPRENEUR: Business questions
    // ════════════════════════════════════════════════════════════

    QKAC1: { dimension: 'wealth', scores: inflate([4, 3, 1, 0]) },
    QKAC2: { dimension: 'wealth', scores: inflate([4, 3, 2, 1, 0]) },
    QKAC3: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },

    // ════════════════════════════════════════════════════════════
    //   UNEMPLOYED: Status questions
    // ════════════════════════════════════════════════════════════

    QKAD1: { dimension: 'wealth', scores: inflate([4, 3, 2, 1, 0]) },
    QKAD2: { dimension: 'health', scores: inflate([4, 2, 0]) },
    QKAD3: { dimension: 'social', scores: inflate([4, 3, 3, 2, 1, 0, 0, 0]) },

    // ════════════════════════════════════════════════════════════
    //   RETIRED: Status questions
    // ════════════════════════════════════════════════════════════

    QKAE1: { dimension: 'wealth', scores: inflate([4, 3, 1, 0]) },
    QKAE2: { dimension: 'health', scores: inflate([4, 3, 1, 0]) },

    // ════════════════════════════════════════════════════════════
    //   SERIOUSLY ILL / POST-ACCIDENT
    // ════════════════════════════════════════════════════════════

    QKAF1: { dimension: 'health', scores: inflate([4, 3, 1, 0]) },
    QKAF2: { dimension: 'social', scores: inflate([4, 2, 0]) },
    QKAF3: { dimension: 'health', scores: inflate([4, 3, 1, 0]) },

    // ════════════════════════════════════════════════════════════
    //   RESTRICTED MOVEMENT
    // ════════════════════════════════════════════════════════════

    QKAH1: { dimension: 'health', scores: inflate([3, 1, 0]) },
    QKAH2: { dimension: 'social', scores: inflate([4, 3, 1, 0]) },

    // ════════════════════════════════════════════════════════════
    //   CAREGIVER
    // ════════════════════════════════════════════════════════════

    QKAI1: { dimension: 'health', scores: inflate([4, 2, 1, 0]) },
    QKAI2: { dimension: 'wealth', scores: inflate([4, 3, 2, 0]) },
    QKAI3: { dimension: 'social', scores: inflate([4, 3, 2, 0]) },
    QKAI4: { dimension: 'social', scores: inflate([4, 3, 1, 0]) },

    // ════════════════════════════════════════════════════════════
    //   COMMON: Health & Lifestyle
    // ════════════════════════════════════════════════════════════

    QKC1: { dimension: 'health', scores: inflate([4, 3, 1, 0]) },
    QKC2: { dimension: 'wealth', scores: inflate([4, 3, 2, 1, 0]) },
    // QKC3 is multi-select, handled separately
    // QKC4 (Vision) is handled by scoring-rules.js
    // QKC5 (Overall health) is handled by scoring-rules.js
    // QKC6 (Criminal record) is handled by scoring-rules.js
    // QKC7 (Housing) is handled by scoring-rules.js
    QKC8a: { dimension: 'health', scores: inflate([4, 3, 2, 1, 0]) },
    QKC8b: { dimension: 'health', scores: inflate([4, 3, 2, 1, 0]) },
    // QKC8c (Dining priority) is handled by scoring-rules.js
    // QKC9 (Savings band) is handled by scoring-rules.js
    QKC10: { dimension: 'wealth', scores: inflate([4, 3, 2, 1, 0]) },
    QKC11: { dimension: 'wealth', scores: inflate([4, 3, 2, 1, 0]) },
    QKC12: { dimension: 'wealth', scores: inflate([4, 3, 2, 1, 0]) },

    // ════════════════════════════════════════════════════════════
    //   RELATIONSHIPS
    // ════════════════════════════════════════════════════════════

    // QKB1 (Relationship) is handled by scoring-rules.js
    // QKB2 (Family support) is handled by scoring-rules.js (via resilience)
    QKB3: { dimension: 'social', scores: inflate([4, 3, 1, 0]) },
    // QKB4 (Has children) is handled by scoring-rules.js
    // QKB5 (Childcare effort) is handled by scoring-rules.js
    QKB5b: { dimension: 'social', scores: inflate([4, 3, 1, 0, 3]) },
    QKB5c: { dimension: 'social', scores: inflate([4, 3, 2, 1, 0, 0]) },
    // QKB5d (Parenting style) is handled by scoring-rules.js
    // QKB6 (Siblings) is handled by scoring-rules.js
    // QKB7 (Emergency funds) is handled by scoring-rules.js (via resilience)

    // ════════════════════════════════════════════════════════════
    //   SKILLS & IDENTITY
    // ════════════════════════════════════════════════════════════

    QKD1: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0, 0]) },
    QKD2: { dimension: 'mind', scores: inflate([4, 3, 1, 0, 1]) },
    QKD3: { dimension: 'mind', scores: inflate([4, 2, 2, 2, 1, 1, 0, 0]) },
    QKD4: { dimension: 'mind', scores: inflate([4, 3, 3, 3, 3, 3, 2, 2, 0]) },
    QKD5: { dimension: 'social', scores: inflate([4, 3, 2, 1, 0]) },
    QKD6: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKD7: { dimension: 'mind', scores: inflate([4, 3, 1, 0]) },
    QKD8: { dimension: 'mind', scores: inflate([4, 3, 1, 0]) },
    QKD9: { dimension: 'mind', scores: inflate([4, 3, 1, 0]) },
    QKD10: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKD11: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    // QKD13 (TCM attitude) is handled by scoring-rules.js
    // QKD15 (Info literacy) is handled by scoring-rules.js

    // ════════════════════════════════════════════════════════════
    //   TRAITS
    // ════════════════════════════════════════════════════════════

    QKT1: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKT2: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKT3: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKT4: { dimension: 'social', scores: inflate([4, 3, 2, 1, 0]) },
    QKT5: { dimension: 'social', scores: inflate([4, 3, 2, 1, 0]) },
    QKT6: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKT7: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKT8: { dimension: 'social', scores: inflate([4, 3, 2, 1, 0]) },
    QKT9: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKT10: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKT11: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKT13: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    // QKT14 (Color blindness) is handled by scoring-rules.js
    QKT15: { dimension: 'mind', scores: inflate([4, 3, 2, 1, 0]) },
    QKT16: { dimension: 'social', scores: inflate([4, 3, 2, 1, 0]) },

    // ════════════════════════════════════════════════════════════
    //   AGE-SPECIFIC MODULES (56-75, 76-100)
    // ════════════════════════════════════════════════════════════

    QKS56_1: { dimension: 'health', scores: inflate([4, 3, 1, 0]) },
    QKS56_2: { dimension: 'wealth', scores: inflate([4, 3, 1, 0]) },
    QKS56_3: { dimension: 'social', scores: inflate([4, 3, 1, 0]) },
    QKS76_1: { dimension: 'health', scores: inflate([4, 3, 1, 0]) },
    QKS76_2: { dimension: 'health', scores: inflate([4, 3, 1, 0]) },
    QKS76_3: { dimension: 'mind', scores: inflate([4, 3, 1, 0]) },
  };

  // ════════════════════════════════════════════════════════════
  //   Register default rules with the engine
  // ════════════════════════════════════════════════════════════

  Object.keys(DEFAULTS).forEach(function(qid) {
    var def = DEFAULTS[qid];
    
    E.registerRule({
      id: 'default.' + qid,
      dimension: def.dimension,
      priority: -100, // Run BEFORE complex rules (which default to 0)
      appliesTo: function(state) {
        // Check if this question was answered
        var answer = state[qid];
        if (answer === undefined || answer === null) return false;
        if (typeof answer !== 'number') return false;
        if (answer < 0 || answer >= def.scores.length) return false;
        return true;
      },
      evaluate: function(state) {
        var answer = state[qid];
        var delta = def.scores[answer];
        if (delta === undefined || delta === null) return null;
        return {
          dimension: def.dimension,
          delta: delta,
          ruleId: 'default.' + qid,
          reason: qid + ' 默认权重',
        };
      },
    });
  });

  // Expose for debugging
  window.LSDefaults = {
    DEFAULTS: DEFAULTS,
    INFLATION: INFLATION,
  };

  console.log('[scoring-defaults] Registered ' + Object.keys(DEFAULTS).length + ' default weight rules');
})();
