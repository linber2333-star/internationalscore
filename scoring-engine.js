/* ============================================================
 * scoring-engine.js
 *
 * Vanilla JS reference implementation of the architecture
 * defined in scoring-engine.d.ts.
 *
 * No build step required.  Drops into the existing site as:
 *   <script src="scoring-engine.js"></script>
 *   <script src="scoring-rules.js"></script>
 *
 * Exposes three globals:
 *   window.LSStore        — the global state store
 *   window.LSEngine       — the rule engine instance
 *   window.LSScoringUtils — small helpers (action creators, bands)
 *
 * Type contract: see scoring-engine.d.ts
 * ============================================================ */
(function () {
  'use strict';

  // ════════════════════════════════════════════════════════════
  //   1. REDUCER — pure function (state, action) → newState
  // ════════════════════════════════════════════════════════════

  /** Initial empty state. Every field is undefined until answered. */
  var INITIAL_STATE = Object.freeze({});

  /**
   * Map of action.type → setter key. Lets us collapse most cases
   * into a single line and avoid a 50-line switch.
   */
  var SIMPLE_SETTERS = {
    SET_AGE_RANGE:               'ageRange',
    SET_GENDER:                  'gender',
    SET_HEIGHT:                  'heightCm',
    SET_HEIGHT_RANGE:            'heightRange',
    SET_WEIGHT:                  'weightKg',
    SET_WEIGHT_RANGE:            'weightRange',
    SET_PRIMARY_STATUS:          'primaryStatus',
    SET_VISION_PENALTY:          'visionPenalty',
    SET_COLOR_BLINDNESS_PENALTY: 'colorBlindnessPenalty',
    SET_OVERALL_HEALTH:          'overallHealth',
    SET_ADDICTION_LEVEL:         'addictionLevel',
    SET_ADDICTIONS:              'addictions',
    SET_HOUSING:                 'housing',
    SET_MONTHLY_SAVINGS:         'monthlySavings',
    SET_SAVINGS_BAND:            'savingsBand',
    SET_DINING_PRIORITY:         'diningPriority',
    SET_RELATIONSHIP:            'relationship',
    SET_HAS_CHILDREN:            'hasChildren',
    SET_CHILDCARE_EFFORT:        'childcareEffortLevel',
    SET_PARENTING_STYLE:         'parentingStyle',
    SET_SIBLING_RELATION:        'siblingRelation',
    SET_EDUCATION:               'educationLevel',
    SET_FOREIGN_LANGUAGE:        'foreignLanguageLevel',
    SET_TRAVEL_EXPERIENCE:       'travelExperience',
    SET_PROFESSIONAL_SKILL_TIER: 'professionalSkillTier',
    SET_TCM_ATTITUDE:            'tcmAttitude',
    SET_INFO_LITERACY:           'informationLiteracy',
    SET_CRIMINAL_RECORD:         'criminalRecord',
    SET_EMERGENCY_FUNDS:         'emergencyFunds',
    SET_FAMILY_SUPPORT:          'familySupport',
    SET_PARTNER_SUPPORT:         'partnerSupport',
  };

  /**
   * Derived-field hooks — when one field changes, automatically
   * update derived fields.  Keeps semantic invariants without
   * forcing every dispatch site to remember them.
   */
  function applyDerivedFields(state) {
    var next = Object.assign({}, state);

    // Critically ill / mobility / caregiver flags follow primaryStatus.
    if (next.primaryStatus === 'critically_ill') {
      next.isCriticallyIll = true;
      next.isMobilityRestricted = false;
      next.isCaregiver = false;
    } else if (next.primaryStatus === 'post_accident' || next.primaryStatus === 'restricted_mobility') {
      next.isCriticallyIll = false;
      next.isMobilityRestricted = true;
      next.isCaregiver = false;
    } else if (next.primaryStatus === 'caregiver') {
      next.isCriticallyIll = false;
      next.isMobilityRestricted = false;
      next.isCaregiver = true;
    } else if (next.primaryStatus !== undefined) {
      next.isCriticallyIll = false;
      next.isMobilityRestricted = false;
      next.isCaregiver = false;
    }

    // Approximate years for age band — used by rules that need a number.
    var AGE_CENTERS = {
      under_18: 16, '18_25': 22, '26_35': 30, '36_45': 40, '46_55': 50,
      '56_65': 60, '66_75': 70, '76_85': 80, '86_100': 92, over_100: 105,
    };
    if (next.ageRange && AGE_CENTERS[next.ageRange] !== undefined) {
      next.ageYearsApprox = AGE_CENTERS[next.ageRange];
    }

    // Auto-band raw monthlySavings → savingsBand if user dispatched a number.
    if (typeof next.monthlySavings === 'number' && !next.savingsBand) {
      next.savingsBand = bandFromSavings(next.monthlySavings);
    }

    next.lastUpdatedAt = Date.now();
    return next;
  }

  function bandFromSavings(amount) {
    if (amount < 0)         return 'net_debt';
    if (amount < 500)       return 'paycheck_to_paycheck';
    if (amount < 3000)      return 'low';
    if (amount < 10000)     return 'moderate';
    if (amount < 50000)     return 'healthy';
    return 'abundant';
  }

  /** The reducer. */
  function reducer(state, action) {
    if (!action || !action.type) return state;

    if (action.type === 'RESET') {
      return INITIAL_STATE;
    }

    if (action.type === 'PATCH') {
      return applyDerivedFields(Object.assign({}, state, action.payload || {}));
    }

    var key = SIMPLE_SETTERS[action.type];
    if (key) {
      var patch = {};
      patch[key] = action.payload;
      return applyDerivedFields(Object.assign({}, state, patch));
    }

    // Unknown action — log in dev, return state unchanged.
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[LSStore] unknown action:', action.type);
    }
    return state;
  }

  // ════════════════════════════════════════════════════════════
  //   2. STORE — minimal observable
  // ════════════════════════════════════════════════════════════

  function createStore(initialState) {
    var state = initialState || INITIAL_STATE;
    var listeners = [];

    function getState() { return state; }

    function dispatch(action) {
      var prev = state;
      state = reducer(state, action);
      if (state !== prev) {
        for (var i = 0; i < listeners.length; i++) {
          try { listeners[i](state); } catch (e) { /* swallow */ }
        }
      }
    }

    function subscribe(listener) {
      listeners.push(listener);
      return function unsubscribe() {
        var idx = listeners.indexOf(listener);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    }

    return { getState: getState, dispatch: dispatch, subscribe: subscribe };
  }

  // ════════════════════════════════════════════════════════════
  //   3. RULE ENGINE
  // ════════════════════════════════════════════════════════════

  /**
   * 150-Point Scale Architecture:
   * - Each dimension (health, wealth, social, mind) starts at baseline 40
   * - Rules add/subtract deltas from this baseline
   * - TWO-PHASE CAPPING SYSTEM:
   *   - After Pass 1 (default weights, priority < 0): SOFT CAP at 100
   *     Normal lifestyle choices cannot exceed 100.
   *   - After Pass 2 (SSR/bonus rules, priority >= 0): HARD CAP at 150
   *     Only exceptional traits can push past 100.
   *
   * HARD MODE: Baseline is 48. Users must EARN their way to a passing
   * grade. A score of 60 (C grade) requires +12 points above baseline.
   * Reaching 90 (A grade) requires +42 points of excellent habits.
   * Breaking 100 requires SSR-tier life circumstances.
   */
  var DIMENSION_BASELINE = 48;
  var DIMENSION_MIN = 0;
  var DIMENSION_SOFT_CAP = 100;  // Normie ceiling - normal habits cap here
  var DIMENSION_HARD_CAP = 150;  // SSR ceiling - only exceptional traits can reach

  function createEngine() {
    var rules = [];
    var modifiers = [];
    var weights = { health: 0.25, wealth: 0.25, social: 0.25, mind: 0.25 };

    function registerRule(rule) {
      if (!rule || !rule.id) throw new Error('rule must have an id');
      rules.push(rule);
    }

    function registerModifier(mod) {
      if (!mod || !mod.id) throw new Error('modifier must have an id');
      modifiers.push(mod);
    }

    function setWeights(w) {
      // Normalize so they sum to 1
      var total = (w.health || 0) + (w.wealth || 0) + (w.social || 0) + (w.mind || 0);
      if (total <= 0) return;
      weights = {
        health: (w.health || 0) / total,
        wealth: (w.wealth || 0) / total,
        social: (w.social || 0) / total,
        mind:   (w.mind   || 0) / total,
      };
    }

    function compute(state) {
      // ════════════════════════════════════════════════════════════
      // PHASE 1: Filter and sort rules by priority
      // ════════════════════════════════════════════════════════════
      var active = [];
      for (var i = 0; i < rules.length; i++) {
        try {
          if (rules[i].appliesTo(state)) active.push(rules[i]);
        } catch (e) { /* rule predicates must be defensive */ }
      }
      active.sort(function (a, b) {
        return (a.priority || 0) - (b.priority || 0);
      });

      // Split rules into Pass 1 (defaults, priority < 0) and Pass 2 (SSR/bonus, priority >= 0)
      var pass1Rules = [];
      var pass2Rules = [];
      for (var r = 0; r < active.length; r++) {
        if ((active[r].priority || 0) < 0) {
          pass1Rules.push(active[r]);
        } else {
          pass2Rules.push(active[r]);
        }
      }

      var contributions = [];
      var ctx = {
        prior: contributions,
        prevById: function (id) {
          for (var j = 0; j < contributions.length; j++) {
            if (contributions[j].ruleId === id) return contributions[j];
          }
          return null;
        },
      };

      // ════════════════════════════════════════════════════════════
      // PHASE 2: PASS 1 — Default weights (priority < 0)
      // Normal lifestyle choices. SOFT CAP at 100.
      // ════════════════════════════════════════════════════════════
      var dimSums = {
        health: DIMENSION_BASELINE,
        wealth: DIMENSION_BASELINE,
        social: DIMENSION_BASELINE,
        mind:   DIMENSION_BASELINE
      };

      for (var k = 0; k < pass1Rules.length; k++) {
        try {
          var contrib = pass1Rules[k].evaluate(state, ctx);
          if (contrib && typeof contrib.delta === 'number') {
            contributions.push(contrib);
            if (dimSums[contrib.dimension] !== undefined) {
              dimSums[contrib.dimension] += contrib.delta;
            }
          }
        } catch (e) {
          if (typeof console !== 'undefined' && console.error) {
            console.error('[LSEngine] Pass 1 rule ' + pass1Rules[k].id + ' threw:', e);
          }
        }
      }

      // ══ SOFT CAP: Clamp to [0, 100] after Pass 1 ══
      // No matter how perfect your normal lifestyle, you cannot exceed 100.
      dimSums.health = Math.max(DIMENSION_MIN, Math.min(DIMENSION_SOFT_CAP, dimSums.health));
      dimSums.wealth = Math.max(DIMENSION_MIN, Math.min(DIMENSION_SOFT_CAP, dimSums.wealth));
      dimSums.social = Math.max(DIMENSION_MIN, Math.min(DIMENSION_SOFT_CAP, dimSums.social));
      dimSums.mind   = Math.max(DIMENSION_MIN, Math.min(DIMENSION_SOFT_CAP, dimSums.mind));

      // ════════════════════════════════════════════════════════════
      // PHASE 3: PASS 2 — SSR / Bonus rules (priority >= 0)
      // Exceptional traits can push past 100, up to HARD CAP of 150.
      // ════════════════════════════════════════════════════════════
      for (var p = 0; p < pass2Rules.length; p++) {
        try {
          var contrib2 = pass2Rules[p].evaluate(state, ctx);
          if (contrib2 && typeof contrib2.delta === 'number') {
            contributions.push(contrib2);
            if (dimSums[contrib2.dimension] !== undefined) {
              dimSums[contrib2.dimension] += contrib2.delta;
            }
          }
        } catch (e) {
          if (typeof console !== 'undefined' && console.error) {
            console.error('[LSEngine] Pass 2 rule ' + pass2Rules[p].id + ' threw:', e);
          }
        }
      }

      // ══ HARD CAP: Clamp to [0, 150] after Pass 2 ══
      // Only SSR traits can reach beyond 100, capped at 150.
      dimSums.health = Math.max(DIMENSION_MIN, Math.min(DIMENSION_HARD_CAP, dimSums.health));
      dimSums.wealth = Math.max(DIMENSION_MIN, Math.min(DIMENSION_HARD_CAP, dimSums.wealth));
      dimSums.social = Math.max(DIMENSION_MIN, Math.min(DIMENSION_HARD_CAP, dimSums.social));
      dimSums.mind   = Math.max(DIMENSION_MIN, Math.min(DIMENSION_HARD_CAP, dimSums.mind));

      // ════════════════════════════════════════════════════════════
      // PHASE 4: Composite via weighted sum
      // ════════════════════════════════════════════════════════════
      var composite =
        dimSums.health * weights.health +
        dimSums.wealth * weights.wealth +
        dimSums.social * weights.social +
        dimSums.mind   * weights.mind;

      var scores = {
        health:    Math.round(dimSums.health),
        wealth:    Math.round(dimSums.wealth),
        social:    Math.round(dimSums.social),
        mind:      Math.round(dimSums.mind),
        composite: composite, // unrounded; modifiers may scale it
      };

      // ════════════════════════════════════════════════════════════
      // PHASE 5: Final score modifiers (longevity bonus, illness multiplier, etc.)
      // ════════════════════════════════════════════════════════════
      var modsRan = [];
      var sortedMods = modifiers.slice().sort(function (a, b) {
        return (a.priority || 0) - (b.priority || 0);
      });
      for (var n = 0; n < sortedMods.length; n++) {
        try {
          if (sortedMods[n].appliesTo(state, scores)) {
            scores = sortedMods[n].apply(state, scores);
            modsRan.push(sortedMods[n].id);
          }
        } catch (e) {
          if (typeof console !== 'undefined' && console.error) {
            console.error('[LSEngine] modifier ' + sortedMods[n].id + ' threw:', e);
          }
        }
      }

      scores.composite = Math.round(scores.composite);

      return {
        scores: scores,
        contributions: contributions,
        modifiersApplied: modsRan,
        stateSnapshot: state,
      };
    }

    return {
      registerRule: registerRule,
      registerModifier: registerModifier,
      setWeights: setWeights,
      compute: compute,
      // Inspection helpers — useful for debugging in DevTools
      _rules: rules,
      _modifiers: modifiers,
    };
  }

  // ════════════════════════════════════════════════════════════
  //   4. ACTION CREATORS — typed-style helpers
  // ════════════════════════════════════════════════════════════

  var actions = {
    setAgeRange:        function (v) { return { type: 'SET_AGE_RANGE',               payload: v }; },
    setGender:          function (v) { return { type: 'SET_GENDER',                  payload: v }; },
    setHeight:          function (v) { return { type: 'SET_HEIGHT',                  payload: v }; },
    setWeight:          function (v) { return { type: 'SET_WEIGHT',                  payload: v }; },
    setPrimaryStatus:   function (v) { return { type: 'SET_PRIMARY_STATUS',          payload: v }; },
    setVisionPenalty:   function (v) { return { type: 'SET_VISION_PENALTY',          payload: v }; },
    setColorBlindness:  function (v) { return { type: 'SET_COLOR_BLINDNESS_PENALTY', payload: v }; },
    setOverallHealth:   function (v) { return { type: 'SET_OVERALL_HEALTH',          payload: v }; },
    setAddiction:       function (v) { return { type: 'SET_ADDICTION_LEVEL',         payload: v }; },
    setHousing:         function (v) { return { type: 'SET_HOUSING',                 payload: v }; },
    setMonthlySavings:  function (v) { return { type: 'SET_MONTHLY_SAVINGS',         payload: v }; },
    setSavingsBand:     function (v) { return { type: 'SET_SAVINGS_BAND',            payload: v }; },
    setDiningPriority:  function (v) { return { type: 'SET_DINING_PRIORITY',         payload: v }; },
    setRelationship:    function (v) { return { type: 'SET_RELATIONSHIP',            payload: v }; },
    setHasChildren:     function (v) { return { type: 'SET_HAS_CHILDREN',            payload: v }; },
    setChildcareEffort: function (v) { return { type: 'SET_CHILDCARE_EFFORT',        payload: v }; },
    setParentingStyle:  function (v) { return { type: 'SET_PARENTING_STYLE',         payload: v }; },
    setSiblingRelation: function (v) { return { type: 'SET_SIBLING_RELATION',        payload: v }; },
    setEducation:       function (v) { return { type: 'SET_EDUCATION',               payload: v }; },
    setForeignLanguage: function (v) { return { type: 'SET_FOREIGN_LANGUAGE',        payload: v }; },
    setTravel:          function (v) { return { type: 'SET_TRAVEL_EXPERIENCE',       payload: v }; },
    setSkillTier:       function (v) { return { type: 'SET_PROFESSIONAL_SKILL_TIER', payload: v }; },
    setTcmAttitude:     function (v) { return { type: 'SET_TCM_ATTITUDE',            payload: v }; },
    setInfoLiteracy:    function (v) { return { type: 'SET_INFO_LITERACY',           payload: v }; },
    setCriminalRecord:  function (v) { return { type: 'SET_CRIMINAL_RECORD',         payload: v }; },
    setHeightRange:     function (v) { return { type: 'SET_HEIGHT_RANGE',            payload: v }; },
    setWeightRange:     function (v) { return { type: 'SET_WEIGHT_RANGE',            payload: v }; },
    setAddictions:      function (v) { return { type: 'SET_ADDICTIONS',              payload: v }; },
    setEmergencyFunds:  function (v) { return { type: 'SET_EMERGENCY_FUNDS',         payload: v }; },
    setFamilySupport:   function (v) { return { type: 'SET_FAMILY_SUPPORT',          payload: v }; },
    setPartnerSupport:  function (v) { return { type: 'SET_PARTNER_SUPPORT',         payload: v }; },
    patch:              function (p) { return { type: 'PATCH',  payload: p }; },
    reset:              function ()  { return { type: 'RESET' }; },
  };

  // ════════════════════════════════════════════════════════════
  //   5. EXPORTS
  // ════════════════════════════════════════════════════════════

  window.LSStore  = createStore();
  window.LSEngine = createEngine();
  window.LSScoringUtils = {
    actions:          actions,
    bandFromSavings:  bandFromSavings,
    createStore:      createStore,
    createEngine:     createEngine,
  };
})();
