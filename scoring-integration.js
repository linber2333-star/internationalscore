/* ============================================================
 * scoring-integration.js
 *
 * Bridges the existing quiz flow (which stores answers as
 * question-id → option-index) to the new engine (which expects
 * a dispatched stream of actions).
 *
 * Usage from quiz.js:
 *
 *   var state = window.LSIntegration.buildState(answers, QUESTION_BANK);
 *   var result = window.LSEngine.compute(state);
 *
 * The mapping table below defines, for each scoring-critical
 * question, which field in state should be set and how the
 * option index translates to a semantic value.
 *
 * Questions without a mapping here are IGNORED by the engine
 * integration — they'll continue to contribute via the legacy
 * opt.score path in quiz.js.  This lets us migrate incrementally
 * without blocking on 100+ mappings.
 *
 * To add a new mapping: append an entry to QUESTION_MAPPINGS.
 * No other files need to change.
 *
 * Exposes: window.LSIntegration
 * ============================================================ */
(function () {
  'use strict';

  /**
   * Each mapping entry describes how one question translates to
   * one or more engine actions.
   *
   * Fields:
   *   qid       Question id in the bank (e.g. 'QK1')
   *   action    Action creator name on window.LSScoringUtils.actions
   *             (e.g. 'setAgeRange')
   *   values    Array indexed by option index → semantic value
   *             passed to the action creator.  null entries mean
   *             "this option doesn't dispatch anything".
   *   multi     Optional — set to true for multi-select questions.
   *             When true, `values` is still indexed by option
   *             index but the action receives an ARRAY of the
   *             selected values (filtered for nulls).
   */
  var QUESTION_MAPPINGS = [
    // ──────────────────────────────────────────────────────────
    //  DEMOGRAPHICS & PHYSICAL
    // ──────────────────────────────────────────────────────────
    {
      qid: 'QK1', action: 'setAgeRange',
      values: [
        'under_18', '18_25', '26_35', '36_45', '46_55',
        '56_65', '66_75', '76_85', '86_100', 'over_100',
      ],
    },
    {
      qid: 'QK2', action: 'setGender',
      values: ['male', 'female'],
    },
    {
      qid: 'QK3', action: 'setPrimaryStatus',
      values: [
        'student', 'employed', 'entrepreneur', 'unemployed', 'job_seeking',
        'retired', 'critically_ill', 'post_accident', 'restricted_mobility', 'caregiver',
      ],
    },
    // Height bands — separate questions for male and female, but
    // both dispatch to the same setHeightRange action. We use the
    // raw Chinese label string as the value so BMI.estimate() can
    // parse it via its existing regex path.
    {
      qid: 'QK4m', action: 'setHeightRange',
      values: [
        '165cm 以下', '165 - 170cm', '170 - 175cm',
        '175 - 180cm', '180 - 185cm', '185cm 以上',
      ],
    },
    {
      qid: 'QK4f', action: 'setHeightRange',
      values: [
        '155cm 以下', '155 - 160cm', '160 - 165cm',
        '165 - 170cm', '170 - 175cm', '175cm 以上',
      ],
    },
    {
      qid: 'QK5m', action: 'setWeightRange',
      values: [
        '55kg 以下', '55 - 70kg',
        '70 - 85kg', '85 - 100kg',
        '100kg 以上',
      ],
    },
    {
      qid: 'QK5f', action: 'setWeightRange',
      values: [
        '45kg 以下 — 偏瘦', '45 - 55kg — 偏轻 / 正常',
        '55 - 65kg — 正常 / 健康', '65 - 80kg — 偏重',
        '80kg 以上 — 超重',
      ],
    },

    // ──────────────────────────────────────────────────────────
    //  HEALTH
    // ──────────────────────────────────────────────────────────
    {
      qid: 'QKC4', action: 'setVisionPenalty',
      values: [0, -3, -9, -18, -30],
    },
    {
      qid: 'QKC5', action: 'setOverallHealth',
      values: ['excellent', 'good', 'subhealthy', 'chronic', 'severe', 'severe'],
    },
    {
      qid: 'QKC7', action: 'setHousing',
      values: [
        'manor',            // 庄园
        'luxury_residence', // 豪华
        'self_owned',       // 自有
        'family_property',  // 家庭
        'family_property',  // 独立租住
        'family_property',  // 熟人合租
        'shared_strangers', // 陌生人合租
        'single_dorm',      // 单人宿舍
        'multi_dorm',       // 多人宿舍
        'multi_dorm',       // 借住亲友
        'multi_dorm',       // 医院病房
        'tent',             // 帐篷
        'street',           // 露宿
      ],
    },
    {
      qid: 'QKC8c', action: 'setDiningPriority',
      values: ['price', 'taste', 'health_balance', 'health_balance'],
    },
    {
      qid: 'QKT14', action: 'setColorBlindness',
      values: [0, -1, -2, -3, -4],
    },

    // ──────────────────────────────────────────────────────────
    //  WEALTH
    // ──────────────────────────────────────────────────────────
    {
      qid: 'QKC9', action: 'setSavingsBand',
      values: ['abundant', 'healthy', 'moderate', 'paycheck_to_paycheck', 'net_debt'],
    },
    {
      /* Alias for QKC9 when user is unemployed/job-seeking — same option semantics */
      qid: 'QKC9_unemployed', action: 'setSavingsBand',
      values: ['abundant', 'healthy', 'moderate', 'paycheck_to_paycheck', 'net_debt'],
    },
    {
      /* Alias for QKC9 when user is critically ill or in major-accident treatment —
         options describe ability to cover medical expenses, but the scored ordering
         (0 = strongest capacity, 4 = insolvent) maps cleanly to the same bands. */
      qid: 'QKC9_med', action: 'setSavingsBand',
      values: ['abundant', 'healthy', 'moderate', 'paycheck_to_paycheck', 'net_debt'],
    },
    {
      qid: 'QKB7', action: 'setEmergencyFunds',
      values: ['easy_300k', 'family_decent_amount', 'small_loan_only', 'nothing'],
    },

    // ──────────────────────────────────────────────────────────
    //  SOCIAL
    // ──────────────────────────────────────────────────────────
    {
      qid: 'QKB1', action: 'setRelationship',
      values: [
        'never_dated', 'dating', 'previously_dated',
        'married_happy', 'married_neutral', 'married_collapsing',
        'cheated_hidden', 'cheated_caught', 'partner_cheated',
        'divorced', 'remarried', 'widowed',
      ],
    },
    {
      qid: 'QKB2', action: 'setFamilySupport',
      values: ['excellent', 'decent', 'distant', 'toxic', 'deceased_good', 'deceased_neutral'],
    },
    {
      /* Alias for QKB2 when user is 76+ (retrospective re. children/closest kin).
         Variant has 5 options instead of 6; index 4 ("no living close family")
         maps to 'deceased_good' as the closest semantic fit. */
      qid: 'QKB2_elder', action: 'setFamilySupport',
      values: ['excellent', 'decent', 'distant', 'toxic', 'deceased_good'],
    },
    {
      qid: 'QKB4', action: 'setHasChildren',
      values: [true, false],
    },
    {
      qid: 'QKB5', action: 'setChildcareEffort',
      // Option indices in QKB5: 0=heavy, 1=solid, 2=moderate, 3=light, 4=zero, 5=grown
      // Map to 1–5 scale where 5 = maximal investment.
      values: [5, 4, 3, 2, 1, 3],
    },
    {
      qid: 'QKB5d', action: 'setParentingStyle',
      values: ['guiding', 'democratic', 'protective', 'authoritarian', 'permissive', 'controlling'],
    },
    {
      qid: 'QKB6', action: 'setSiblingRelation',
      values: ['very_close', 'friendly', 'estranged', 'hostile', 'only_child'],
    },

    // ──────────────────────────────────────────────────────────
    //  MIND / IDENTITY
    // ──────────────────────────────────────────────────────────
    {
      qid: 'QKC6', action: 'setCriminalRecord',
      values: ['clean', 'minor', 'undetected_serious', 'minor_with_impact', 'major'],
    },
    {
      qid: 'QKD13', action: 'setTcmAttitude',
      values: ['staunch_supporter', 'open_minded', 'skeptical_respectful', 'strongly_opposed'],
    },
    {
      qid: 'QKD15', action: 'setInfoLiteracy',
      // Option order in QKD15:
      //   0 = 善于辨别真伪 → high
      //   1 = 接受多角度 → high
      //   2 = 谨慎逻辑推理 → medium_high
      //   3 = 权威认证 → medium
      //   4 = 眼见为实 → medium
      //   5 = 非官方说法 → low
      //   6 = 从不关心 → none
      values: ['high', 'high', 'medium_high', 'medium', 'medium', 'low', 'none'],
    },
    /* QKAB8 mapping removed — the specific-profession question has
       moved to the bonus section (QKBON_AB8) and is tallied by
       computeBonusScore, not by the engine's skillTier. */
  ];

  // ────────────────────────────────────────────────────────────
  //  Build state from answers
  // ────────────────────────────────────────────────────────────

  /**
   * Walk the answer map and dispatch an action for every mapped
   * question.  Returns the final state snapshot.
   *
   * @param answers      {qid: optionIndex | number[]} — the
   *                     existing quiz.js answer map
   * @param store        (optional) override the default LSStore
   * @returns            the resulting state object
   */
  function buildState(answers, store) {
    store = store || window.LSStore;
    if (!store) throw new Error('[LSIntegration] LSStore not loaded');

    var A = window.LSScoringUtils && window.LSScoringUtils.actions;
    if (!A) throw new Error('[LSIntegration] actions not loaded');

    // Reset state before rebuilding — important so re-running
    // compute() on a new answer set doesn't accumulate old fields.
    store.dispatch(A.reset());

    for (var i = 0; i < QUESTION_MAPPINGS.length; i++) {
      var m = QUESTION_MAPPINGS[i];
      var raw = answers[m.qid];
      if (raw === undefined || raw === null) continue;

      var actionFn = A[m.action];
      if (typeof actionFn !== 'function') {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[LSIntegration] unknown action:', m.action, 'for', m.qid);
        }
        continue;
      }

      if (m.multi) {
        // raw is an array of option indices
        var arr = Array.isArray(raw) ? raw : [];
        var mapped = [];
        for (var j = 0; j < arr.length; j++) {
          var v = m.values[arr[j]];
          if (v !== null && v !== undefined) mapped.push(v);
        }
        store.dispatch(actionFn(mapped));
      } else {
        // raw is a single option index
        if (typeof raw !== 'number' || raw < 0 || raw >= m.values.length) continue;
        var value = m.values[raw];
        if (value === undefined || value === null) continue;
        store.dispatch(actionFn(value));
      }
    }

    return store.getState();
  }

  /**
   * Convenience: build state and immediately compute scores.
   * Returns the engine result object.
   */
  function computeFromAnswers(answers) {
    var state = buildState(answers);
    if (!window.LSEngine) {
      throw new Error('[LSIntegration] LSEngine not loaded');
    }
    return window.LSEngine.compute(state);
  }

  /**
   * Get the list of mapped question ids — useful for the analysis
   * page and for diagnosing which questions contribute to engine
   * scoring vs. which still use the legacy opt.score path.
   */
  function getMappedQuestionIds() {
    return QUESTION_MAPPINGS.map(function (m) { return m.qid; });
  }

  window.LSIntegration = {
    buildState: buildState,
    computeFromAnswers: computeFromAnswers,
    getMappedQuestionIds: getMappedQuestionIds,
    mappings: QUESTION_MAPPINGS,  // exposed for debugging
  };
})();
