/* ============================================================
 * scoring-rules.js
 *
 * Concrete rule definitions for the LifeScore engine.
 *
 * HARD MODE ARCHITECTURE:
 * - Each dimension starts at baseline 40 (not 60)
 * - Positive scores inflated by only 1.5x (nerfed from 3.5x)
 * - Negative penalties remain HARSH (not nerfed)
 * - Target: ~75-85 points for a "perfect normal" user (B grade)
 * - S/SS/SSS tiers require exceptional life circumstances
 *
 * This file is the ONLY place scoring weights live.  To re-tune
 * the scoring system, edit this file — never edit the engine
 * itself, never edit the question bank, never touch quiz.js.
 *
 * Each rule is a tiny object with three things:
 *   id          — stable identifier
 *   appliesTo() — predicate, return false to skip
 *   evaluate()  — pure scoring function, returns RuleContribution
 *
 * Run order is determined by the optional `priority` field
 * (default 0; higher runs later).
 *
 * Some rules delegate to pure helper functions on window.LSFn.*
 * so the math can be tested independently of the engine.  See
 * ls-fn-wealth.js, ls-fn-bmi.js, ls-fn-addiction.js,
 * ls-fn-resilience.js.
 * ============================================================ */
(function () {
  'use strict';

  if (!window.LSEngine) {
    console.error('[scoring-rules] LSEngine not found — load scoring-engine.js first');
    return;
  }
  if (!window.LSFn) {
    console.error('[scoring-rules] LSFn not found — load ls-fn-*.js before scoring-rules.js');
    return;
  }

  var E = window.LSEngine;
  var Fn = window.LSFn;

  /**
   * HARD MODE: Inflation factor calibrated for 90-100 perfect normal score.
   * Positive actions give moderate rewards. Negative penalties stay harsh.
   */
  var INFLATION = 2.0;

  /**
   * Standard rule factory — defaults to priority -50 (Pass 1, soft-capped at 100).
   * These are "normal" life circumstance rules.
   */
  function rule(id, dimension, opts) {
    return {
      id: id,
      dimension: dimension,
      priority: opts.priority !== undefined ? opts.priority : -50,  // Pass 1 by default
      appliesTo: opts.appliesTo || function () { return true; },
      evaluate: function (state, ctx) {
        var delta = opts.score(state, ctx);
        if (delta === null || delta === undefined) return null;
        return {
          dimension: dimension,
          delta: delta,
          ruleId: id,
          reason: typeof opts.reason === 'function' ? opts.reason(state) : (opts.reason || id),
        };
      },
    };
  }

  /**
   * SSR rule factory — priority 10+ (Pass 2, can break soft cap up to 150).
   * These are exceptional/rare life circumstances.
   */
  function ssrRule(id, dimension, opts) {
    return {
      id: id,
      dimension: dimension,
      priority: opts.priority !== undefined ? opts.priority : 10,  // Pass 2 by default
      appliesTo: opts.appliesTo || function () { return true; },
      evaluate: function (state, ctx) {
        var delta = opts.score(state, ctx);
        if (delta === null || delta === undefined) return null;
        return {
          dimension: dimension,
          delta: delta,
          ruleId: id,
          reason: typeof opts.reason === 'function' ? opts.reason(state) : (opts.reason || id),
          isSSR: true,  // Mark as SSR contribution
        };
      },
    };
  }

  // ════════════════════════════════════════════════════════════
  //   AGE RAW SCORE (cross-dimension, applied to health)
  //   ≤18 → 5, 18-25 → 5, 26-35 → 4, 36-45 → 3, 46-55 → 2,
  //   56-65 → 1, 66-75 → 0, 76-85 → 3, 86-100 → 4, 101+ → 10
  // ════════════════════════════════════════════════════════════

  E.registerRule(rule('age.raw_score', 'health', {
    appliesTo: function (s) { return !!s.ageRange; },
    score: function (s) {
      var map = {
        under_18: 5, '18_25': 5, '26_35': 4, '36_45': 3, '46_55': 2,
        '56_65': 1, '66_75': 0, '76_85': 3, '86_100': 4, over_100: 10,
      };
      return map[s.ageRange] !== undefined ? map[s.ageRange] : 0;
    },
    reason: '年龄原始分',
  }));

  // ════════════════════════════════════════════════════════════
  //   HEALTH dimension rules
  // ════════════════════════════════════════════════════════════

  E.registerRule(rule('health.bmi', 'health', {
    appliesTo: function (s) { return !!s.heightRange && !!s.weightRange; },
    score: function (s) {
      var mult = Fn.bmi.estimate(s.heightRange, s.weightRange, s.gender);
      // HARD MODE: BASELINE = 10 * 2.0 = 20
      var BASELINE = 20;
      return Math.round(BASELINE * mult - BASELINE);
    },
    reason: 'BMI 健康调节',
  }));

  E.registerRule(rule('health.vision', 'health', {
    appliesTo: function (s) { return typeof s.visionPenalty === 'number'; },
    score: function (s) { 
      // Vision penalty is already negative, keep as-is
      return s.visionPenalty; 
    },
    reason: '视力惩罚',
  }));

  E.registerRule(rule('health.color_blindness', 'health', {
    appliesTo: function (s) { return typeof s.colorBlindnessPenalty === 'number'; },
    score: function (s) { 
      // Color blindness penalty is already negative, keep as-is
      return s.colorBlindnessPenalty; 
    },
    reason: '色觉惩罚',
  }));

  E.registerRule(rule('health.overall', 'health', {
    appliesTo: function (s) { return !!s.overallHealth; },
    score: function (s) {
      // Original: excellent=12, good=9, subhealthy=5, chronic=2, severe=0
      // HARD MODE (2.0x): excellent=24, good=18, subhealthy=10, chronic=4, severe=0
      var map = { excellent: 24, good: 18, subhealthy: 10, chronic: 4, severe: 0 };
      return map[s.overallHealth] || 0;
    },
    reason: '整体健康状况',
  }));

  E.registerRule(rule('health.dining', 'health', {
    appliesTo: function (s) { return !!s.diningPriority; },
    score: function (s) {
      // Original: health_balance=6, taste=3, price=0
      // HARD MODE (2.0x): health_balance=12, taste=6, price=0
      var map = { health_balance: 12, taste: 6, price: 0, unspecified: 0 };
      return map[s.diningPriority];
    },
    reason: '外出就餐核心因素',
  }));

  // ════════════════════════════════════════════════════════════
  //   WEALTH dimension rules
  // ════════════════════════════════════════════════════════════

  E.registerRule(rule('wealth.housing', 'wealth', {
    appliesTo: function (s) { return !!s.housing; },
    score: function (s) {
      // Original: manor=16, luxury=14, self_owned=12, family=10, shared=8, single_dorm=6, multi=4, tent=2, street=0
      // HARD MODE (2.0x): manor=32, luxury=28, self_owned=24, family=20, shared=16, single_dorm=12, multi=8, tent=4, street=0
      var map = {
        manor: 32, luxury_residence: 28, self_owned: 24,
        family_property: 20, shared_strangers: 16,
        single_dorm: 12, multi_dorm: 8, tent: 4, street: 0,
        unspecified: 0,
      };
      return map[s.housing];
    },
    reason: '居住环境层级',
  }));

  E.registerRule(rule('wealth.dynamic_baseline', 'wealth', {
    appliesTo: function (s) { return !!s.ageRange && !!s.savingsBand; },
    score: function (s) {
      // ls-fn-wealth returns [-10, +14] — HARD MODE (2.0x) inflates to [-20, +28]
      var raw = Fn.wealth.calculate(s.ageRange, s.savingsBand);
      return Math.round(raw * INFLATION);
    },
    reason: '动态财富基线',
  }));

  E.registerRule(rule('wealth.resilience_buff', 'wealth', {
    priority: -40,  // Still Pass 1, but after other wealth rules
    appliesTo: function (s) { return !!s.emergencyFunds; },
    score: function (s) {
      var r = Fn.resilience.calculate(s.emergencyFunds, s.familySupport, s.partnerSupport);
      // Original buff: [-3, +15] — HARD MODE (2.0x): positive inflated to [-3, +30], negative stays harsh
      var buff = r.financialResilienceBuff;
      if (buff > 0) {
        return Math.round(buff * INFLATION);
      }
      // Keep negative as-is (already punitive)
      return buff;
    },
    reason: '社交圈应急资金缓冲',
  }));

  // ════════════════════════════════════════════════════════════
  //   SOCIAL dimension rules
  // ════════════════════════════════════════════════════════════

  E.registerRule(rule('social.relationship', 'social', {
    appliesTo: function (s) { return !!s.relationship; },
    score: function (s) {
      // Original: dating/married_happy=10, neutral=7, previously=5, collapsing/cheated/divorced=3, caught/widowed=1, never=0
      // HARD MODE (2.0x): 20, 14, 10, 6, 2, 0
      var map = {
        dating: 20, married_happy: 20,
        married_neutral: 14,
        previously_dated: 10,
        married_collapsing: 6, cheated_hidden: 6, partner_cheated: 6,
          divorced: 6, remarried: 6,
        cheated_caught: 2, widowed: 2,
        never_dated: 0, unspecified: 0,
      };
      return map[s.relationship];
    },
    reason: '感情与婚姻状况',
  }));

  E.registerRule(rule('social.siblings', 'social', {
    appliesTo: function (s) { return !!s.siblingRelation; },
    score: function (s) {
      // Original: very_close=6, friendly=4, estranged=2, only_child=2, hostile=0
      // HARD MODE (2.0x): 12, 8, 4, 4, 0
      var map = {
        very_close: 12, friendly: 8,
        estranged: 4, only_child: 4,
        hostile: 0, unspecified: 0,
      };
      return map[s.siblingRelation];
    },
    reason: '兄弟姐妹关系',
  }));

  E.registerRule(rule('social.childcare', 'social', {
    appliesTo: function (s) { return s.hasChildren === true && s.childcareEffortLevel; },
    score: function (s) {
      // Original: 5→6, 4→6, 3→4, 2→2, 1→0
      // HARD MODE (2.0x): 5→12, 4→12, 3→8, 2→4, 1→0
      var map = { 5: 12, 4: 12, 3: 8, 2: 4, 1: 0 };
      return map[s.childcareEffortLevel] || 0;
    },
    reason: '育儿投入',
  }));

  E.registerRule(rule('social.parenting_style', 'social', {
    appliesTo: function (s) { return s.hasChildren === true && !!s.parentingStyle; },
    score: function (s) {
      // Original: guiding/democratic=6, protective/authoritarian/permissive=3, controlling=0
      // HARD MODE (2.0x): 12, 6, 0
      var map = {
        guiding: 12, democratic: 12,
        protective: 6, authoritarian: 6, permissive: 6,
        controlling: 0,
      };
      return map[s.parentingStyle];
    },
    reason: '育儿行为逻辑',
  }));

  E.registerRule(rule('social.children_x_savings', 'social', {
    priority: -40,  // Pass 1
    appliesTo: function (s) {
      return s.hasChildren === true && !!s.savingsBand;
    },
    score: function (s) {
      var highSavings = s.savingsBand === 'healthy' || s.savingsBand === 'abundant';
      var lowSavings  = s.savingsBand === 'paycheck_to_paycheck' || s.savingsBand === 'net_debt';
      // Original: high=+4, low=-3
      // HARD MODE (2.0x positive): high=+8, low=-3 (penalty stays harsh)
      if (highSavings) return 8;
      if (lowSavings)  return -3;
      return 0;
    },
    reason: '子女与储蓄交互',
  }));

  // ════════════════════════════════════════════════════════════
  //   MIND dimension rules
  // ════════════════════════════════════════════════════════════

  E.registerRule(rule('mind.addictions', 'mind', {
    priority: -45,  // Pass 1
    appliesTo: function (s) { return Array.isArray(s.addictions) && s.addictions.length > 0; },
    score: function (s) {
      var r = Fn.addiction.calculate(s.addictions);
      // HARD MODE: BASELINE = 10 * 2.0 = 20
      // Penalties remain harsh (multiplier < 1 means negative delta)
      var BASELINE = 20;
      return Math.round(BASELINE * r.multiplier - BASELINE);
    },
    reason: '行为成瘾',
  }));

  E.registerRule(rule('mind.education', 'mind', {
    appliesTo: function (s) { return !!s.educationLevel; },
    score: function (s) {
      // Original: master=8, bachelor=6, vocational=4, highschool=2
      // HARD MODE (2.0x): master=16, bachelor=12, vocational=8, highschool=4
      var map = {
        master_above: 16, bachelor: 12, vocational: 8, highschool_below: 4,
      };
      return map[s.educationLevel];
    },
    reason: '学历层级',
  }));

  E.registerRule(rule('mind.foreign_language', 'mind', {
    appliesTo: function (s) { return typeof s.foreignLanguageLevel === 'number' && s.primaryStatus !== 'student'; },
    score: function (s) {
      // Original: [0, 1, 3, 5, 7, 8]
      // HARD MODE (2.0x): [0, 2, 6, 10, 14, 16]
      return [0, 2, 6, 10, 14, 16][s.foreignLanguageLevel] || 0;
    },
    reason: '外语能力',
  }));

  E.registerRule(rule('mind.travel', 'mind', {
    appliesTo: function (s) { return !!s.travelExperience; },
    score: function (s) {
      // Original: global=6, extensive=4, moderate=2, limited=0, none=0
      // HARD MODE (2.0x): global=12, extensive=8, moderate=4, limited=0, none=0
      var map = { global: 12, extensive: 8, moderate: 4, limited: 0, none: 0 };
      return map[s.travelExperience];
    },
    reason: '旅行经历',
  }));

  E.registerRule(rule('mind.profession', 'mind', {
    appliesTo: function (s) { return typeof s.professionalSkillTier === 'number'; },
    score: function (s) {
      // Original: 1→8, 2→5, 3→3, 4→1, 0→0
      // HARD MODE (2.0x): 1→16, 2→10, 3→6, 4→2, 0→0
      var map = { 1: 16, 2: 10, 3: 6, 4: 2, 0: 0 };
      return map[s.professionalSkillTier];
    },
    reason: '职业技能层级',
  }));

  E.registerRule(rule('mind.tcm', 'mind', {
    appliesTo: function (s) { return !!s.tcmAttitude; },
    score: function (s) {
      // Original: skeptical/opposed/open=4, staunch=0
      // HARD MODE (2.0x): 8, 0
      var map = {
        skeptical_respectful: 8, strongly_opposed: 8, open_minded: 8,
        staunch_supporter: 0, unspecified: 0,
      };
      return map[s.tcmAttitude];
    },
    reason: '综合认知评估',
  }));

  E.registerRule(rule('mind.info_literacy', 'mind', {
    appliesTo: function (s) { return !!s.informationLiteracy; },
    score: function (s) {
      // Original: high=6, medium_high=4, medium=2, low=1, none=0
      // HARD MODE (2.0x): high=12, medium_high=8, medium=4, low=2, none=0
      var map = { high: 12, medium_high: 8, medium: 4, low: 2, none: 0 };
      return map[s.informationLiteracy];
    },
    reason: '信息获取习惯',
  }));

  E.registerRule(rule('mind.criminal_record', 'mind', {
    appliesTo: function (s) { return !!s.criminalRecord; },
    score: function (s) {
      // Original: clean=4, minor=2, undetected=2, minor_impact=0, major=-3
      // HARD MODE (2.0x positive only): clean=8, minor=4, undetected=4, minor_impact=0, major=-3 (penalty stays harsh)
      var map = {
        clean: 8, minor: 4, undetected_serious: 4,
        minor_with_impact: 0, major: -3,
      };
      return map[s.criminalRecord];
    },
    reason: '社会信用评估',
  }));

  // ════════════════════════════════════════════════════════════
  //   SSR-TIER RULES (Pass 2 — Can break the 100 soft cap)
  //   These represent exceptional life circumstances that push
  //   a dimension beyond what normal habits can achieve.
  // ════════════════════════════════════════════════════════════

  // ── WEALTH SSR: Generational Wealth ──
  E.registerRule(ssrRule('ssr.generational_wealth', 'wealth', {
    appliesTo: function (s) { return s.hasGenerationalWealth === true; },
    score: function (s) {
      // +30 to wealth dimension, can push past 100
      return 30;
    },
    reason: 'SSR: 家族财富传承',
  }));

  // ── WEALTH SSR: Business Empire ──
  E.registerRule(ssrRule('ssr.business_empire', 'wealth', {
    appliesTo: function (s) { return s.businessScale === 'empire'; },
    score: function (s) {
      // +25 for running a business empire
      return 25;
    },
    reason: 'SSR: 商业帝国',
  }));

  // ── SOCIAL SSR: Public Figure / Celebrity ──
  E.registerRule(ssrRule('ssr.public_figure', 'social', {
    appliesTo: function (s) { return s.isPublicFigure === true; },
    score: function (s) {
      // +20 to social dimension
      return 20;
    },
    reason: 'SSR: 公众人物影响力',
  }));

  // ── SOCIAL SSR: Exceptional Network ──
  E.registerRule(ssrRule('ssr.exceptional_network', 'social', {
    appliesTo: function (s) { return s.networkTier === 'exceptional'; },
    score: function (s) {
      // +15 for truly exceptional social connections
      return 15;
    },
    reason: 'SSR: 顶级社交网络',
  }));

  // ── HEALTH SSR: Elite Athlete / Extreme Endurance ──
  E.registerRule(ssrRule('ssr.elite_athlete', 'health', {
    appliesTo: function (s) { return s.athleticTier === 'elite' || s.hasExtremeEndurance === true; },
    score: function (s) {
      // +25 for elite athletic performance
      return 25;
    },
    reason: 'SSR: 精英运动员体魄',
  }));

  // ── HEALTH SSR: Perfect Genetics ──
  E.registerRule(ssrRule('ssr.perfect_genetics', 'health', {
    appliesTo: function (s) { return s.geneticHealth === 'exceptional'; },
    score: function (s) {
      // +15 for exceptional genetic health
      return 15;
    },
    reason: 'SSR: 优越基因',
  }));

  // ── MIND SSR: World-Class Expert ──
  E.registerRule(ssrRule('ssr.world_expert', 'mind', {
    appliesTo: function (s) { return s.expertiseLevel === 'world_class'; },
    score: function (s) {
      // +30 for world-class expertise in a field
      return 30;
    },
    reason: 'SSR: 世界级专家',
  }));

  // ── MIND SSR: Polymath / Renaissance Person ──
  E.registerRule(ssrRule('ssr.polymath', 'mind', {
    appliesTo: function (s) { return s.isPolymath === true; },
    score: function (s) {
      // +20 for mastery across multiple domains
      return 20;
    },
    reason: 'SSR: 博学多才',
  }));

  // ── MIND SSR: Published Author / Thought Leader ──
  E.registerRule(ssrRule('ssr.thought_leader', 'mind', {
    appliesTo: function (s) { return s.isThoughtLeader === true; },
    score: function (s) {
      // +15 for significant intellectual contribution
      return 15;
    },
    reason: 'SSR: 思想领袖',
  }));

  // ════════════════════════════════════════════════════════════
  //   FINAL SCORE MODIFIERS
  // ════════════════════════════════════════════════════════════

  E.registerModifier({
    id: 'longevity_bonus',
    priority: 10,
    appliesTo: function (state) {
      return state.ageRange === '86_100' || state.ageRange === 'over_100';
    },
    apply: function (state, scores) {
      var next = Object.assign({}, scores);
      // Longevity bonus already appropriate for 150-scale
      next.composite = scores.composite + 20;
      return next;
    },
  });

  E.registerModifier({
    id: 'addiction_wealth_cap',
    priority: 50,
    appliesTo: function (state) {
      var r = Fn.addiction.calculate(state.addictions);
      return r.isSeverelyHijacked;
    },
    apply: function (state, scores) {
      var r = Fn.addiction.calculate(state.addictions);
      var next = Object.assign({}, scores);
      next.wealth = Math.round(scores.wealth * r.wealthCapFraction);
      return next;
    },
  });

  E.registerModifier({
    id: 'illness_multiplier',
    priority: 100,
    appliesTo: function (state) {
      return state.isCriticallyIll === true ||
             state.isMobilityRestricted === true ||
             state.isCaregiver === true;
    },
    apply: function (state, scores) {
      var next = Object.assign({}, scores);
      // Seriously ill OR post-accident → 20% discount
      if (state.primaryStatus === 'critically_ill' || state.primaryStatus === 'post_accident') {
        next.composite = scores.composite * 0.80;
      }
      // Restricted mobility → 10% discount
      else if (state.primaryStatus === 'restricted_mobility') {
        next.composite = scores.composite * 0.90;
      }
      // Full-time caregiver → 5% discount
      else if (state.primaryStatus === 'caregiver') {
        next.composite = scores.composite * 0.95;
      }
      return next;
    },
  });

  E.registerModifier({
    id: 'composite_floor',
    priority: 1000,
    appliesTo: function () { return true; },
    apply: function (state, scores) {
      var next = Object.assign({}, scores);
      next.composite = Math.max(0, scores.composite);
      return next;
    },
  });

  // ════════════════════════════════════════════════════════════
  //   DIMENSION WEIGHTS
  // ════════════════════════════════════════════════════════════
  E.setWeights({
    health: 0.20,
    wealth: 0.40,
    social: 0.15,
    mind:   0.25,
  });
})();
