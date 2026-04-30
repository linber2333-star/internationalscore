/* ============================================================
 * rulesConfig.ts — Batch 1: QK1 → QKC5, Batch 2: QKC7 → QKC11 + QKT2
 *
 * Converts each questionnaire question into a ScoringRule using
 * the types from scoring-engine.d.ts and RuleEngine.ts.
 *
 * Conventions:
 *   - Rule id = question id, lowercase (e.g. 'qk1.age')
 *   - condition checks that the relevant answer index exists
 *   - action writes to _dimensionField on state
 *   - Helper functions (estimateBMI, etc.) used where applicable
 *   - Simple addition for absolute-value questions
 *
 * Answer values use option INDEX (0-based integer) as stored in
 * the quiz answer map, matching the option arrays in
 * quick_questions.js.
 * ============================================================ */

import type { ScoringRule, UserProfileState } from './RuleEngine';

// ── Helper function signatures (runtime on window.LSFn.*) ──

declare const estimateBMI: (
  heightRange: string | undefined | null,
  weightRange: string | undefined | null,
  gender: string | undefined | null,
) => number;

// ════════════════════════════════════════════════════════════
//   Batch 1 rules: QK1 → QKC5
// ════════════════════════════════════════════════════════════

export const rulesConfigBatch1: ScoringRule[] = [

  // ──────────────────────────────────────────────────────────
  //  QK1 — Age range
  //  Dimension: health (age raw score)
  //  opt 0: ≤18 → 5    opt 1: 18-25 → 5    opt 2: 26-35 → 4
  //  opt 3: 36-45 → 3  opt 4: 46-55 → 2    opt 5: 56-65 → 1
  //  opt 6: 66-75 → 0  opt 7: 76-85 → 3    opt 8: 85-100 → 4
  //  opt 9: 101+ → 10
  // ──────────────────────────────────────────────────────────
  {
    id: 'qk1.age',
    condition: (state) => state.ageRange !== undefined,
    action: (state) => {
      const map: Record<string, number> = {
        under_18: 5, '18_25': 5, '26_35': 4, '36_45': 3,
        '46_55': 2, '56_65': 1, '66_75': 0, '76_85': 3,
        '86_100': 4, over_100: 10,
      };
      state._healthScore = (state._healthScore as number ?? 0)
        + (map[state.ageRange!] ?? 0);
    },
  },

  // ──────────────────────────────────────────────────────────
  //  QK2 — Gender
  //  Not scored (scorable: false). Sets state.gender for
  //  downstream rules (BMI, height/weight branching).
  //  No ScoringRule needed — handled by the dispatcher.
  // ──────────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────────
  //  QK3 — Primary status
  //  Not scored directly (scorable: false). Sets flags:
  //  isCriticallyIll, isMobilityRestricted — used by modifiers.
  //  Branching logic only; no ScoringRule needed.
  // ──────────────────────────────────────────────────────────

  // ──────────────────────────────────────────────────────────
  //  QK4m/QK4f + QK5m/QK5f — Height & Weight → BMI
  //  Dimension: health
  //  Uses estimateBMI() helper: multiplier in [0.5, 1.0]
  //  applied against a 10-point baseline.
  // ──────────────────────────────────────────────────────────
  {
    id: 'qk4_5.bmi',
    condition: (state) =>
      state.heightRange !== undefined &&
      state.weightRange !== undefined,
    action: (state) => {
      const BASELINE = 10;
      const mult = estimateBMI(
        state.heightRange!,
        state.weightRange!,
        state.gender ?? null,
      );
      state._healthBmi = Math.round(BASELINE * mult - BASELINE);
    },
  },

  // ──────────────────────────────────────────────────────────
  //  QKC1 — Appearance anxiety
  //  Dimension: health (mental health proxy)
  //  Shown only for age < 56 (QK1 < 5)
  //  opt 0: 完全自信 → 4    opt 1: 偶尔在意 → 3
  //  opt 2: 经常焦虑 → 1    opt 3: 极度不安全感 → 0
  // ──────────────────────────────────────────────────────────
  {
    id: 'qkc1.appearance',
    condition: (state) => (state as any).QKC1 !== undefined,
    action: (state) => {
      const scores = [6, 4, 2, 0];
      const idx = (state as any).QKC1 as number;
      state._healthScore = (state._healthScore as number ?? 0)
        + (scores[idx] ?? 0);
    },
  },

  // ──────────────────────────────────────────────────────────
  //  QKC2 — Monthly income level
  //  Dimension: wealth
  //  Shown for employed / entrepreneur / retired
  //  opt 0: 极高 → 4   opt 1: 高 → 3   opt 2: 中等 → 2
  //  opt 3: 低 → 1     opt 4: 极低 → 0
  // ──────────────────────────────────────────────────────────
  {
    id: 'qkc2.income',
    condition: (state) => (state as any).QKC2 !== undefined,
    action: (state) => {
      const scores = [4, 3, 2, 1, 0];
      const idx = (state as any).QKC2 as number;
      const pts = scores[idx] ?? 0;
      // Scale to wealth dimension: income is a major wealth signal
      state._wealthScore = (state._wealthScore as number ?? 0)
        + pts * 2;  // 0–20 range
    },
  },

  // ──────────────────────────────────────────────────────────
  //  QKC3 — Bad habits (multi-select, multi_negative scoring)
  //  Dimension: health
  //  opt 0: 以上均无 (exclusive) → base 4
  //  opt 1-4: each negative habit → -1 penalty from base 4
  //  Final = max(0, 4 - count_of_negative_selections)
  // ──────────────────────────────────────────────────────────
  {
    id: 'qkc3.bad_habits',
    condition: (state) => (state as any).QKC3 !== undefined,
    action: (state) => {
      const selected = (state as any).QKC3;
      let pts: number;

      if (Array.isArray(selected)) {
        // Multi-select: check for exclusive "none" option (index 0)
        if (selected.includes(0)) {
          pts = 4;
        } else {
          // Count negative habits, subtract from max
          pts = Math.max(0, 4 - selected.length);
        }
      } else {
        // Single-select fallback (shouldn't happen but defensive)
        pts = selected === 0 ? 4 : 0;
      }

      // Bad habits are a health penalty (scaled ×2 for impact)
      state._healthScore = (state._healthScore as number ?? 0)
        + pts * 2;  // 0–12 range
    },
  },

  // ──────────────────────────────────────────────────────────
  //  QKC4 — Vision (non-linear accelerating penalty)
  //  Dimension: health
  //  Uses power curve: penalty = 2.5 × x^1.8
  //  opt 0: 视力完好 → 0      opt 1: 轻度近视 → -3
  //  opt 2: 重度近视 → -9     opt 3: 视力受损 → -18
  //  opt 4: 法定失明 → -30
  // ──────────────────────────────────────────────────────────
  {
    id: 'qkc4.vision',
    condition: (state) =>
      state.visionPenalty !== undefined ||
      (state as any).QKC4 !== undefined,
    action: (state) => {
      // If visionPenalty already set by engine dispatcher, use it
      if (state.visionPenalty !== undefined) {
        state._healthVision = state.visionPenalty;
        return;
      }
      // Non-linear penalty: base=2.5, gamma=1.8
      const idx = (state as any).QKC4 as number;
      if (idx === 0 || idx === undefined) {
        state._healthVision = 0;
      } else {
        state._healthVision = -Math.round(2.5 * Math.pow(idx, 1.8));
      }
    },
  },

  // ──────────────────────────────────────────────────────────
  //  QKC5 — Overall health status
  //  Dimension: health (major baseline contribution)
  //  opt 0: 极度健壮 → 12 (excellent)
  //  opt 1: 总体健康 → 9  (good)
  //  opt 2: 亚健康 → 5    (subhealthy)
  //  opt 3: 确诊慢性病 → 2 (chronic)
  //  opt 4: 重大事故治疗中 → 0 (severe)
  //  opt 5: 危重疾病 → 0  (severe)
  //  Also sets overallHealth on state for the illness modifier.
  // ──────────────────────────────────────────────────────────
  {
    id: 'qkc5.overall_health',
    condition: (state) =>
      state.overallHealth !== undefined ||
      (state as any).QKC5 !== undefined,
    action: (state) => {
      // If overallHealth already mapped by engine dispatcher
      if (state.overallHealth !== undefined) {
        const map: Record<string, number> = {
          excellent: 20, good: 14, subhealthy: 8, chronic: 2, severe: 0,
        };
        state._healthOverall = map[state.overallHealth] ?? 0;
        return;
      }
      // Fallback: raw answer index
      const scores = [12, 9, 5, 2, 0, 0];
      const idx = (state as any).QKC5 as number;
      state._healthOverall = scores[idx] ?? 0;

      // Also set derived flags for downstream modifiers
      if (idx === 4 || idx === 5) {
        state.overallHealth = 'severe';
      } else if (idx === 3) {
        state.overallHealth = 'chronic';
      } else if (idx === 2) {
        state.overallHealth = 'subhealthy';
      } else if (idx === 1) {
        state.overallHealth = 'good';
      } else {
        state.overallHealth = 'excellent';
      }
    },
  },
];

// ════════════════════════════════════════════════════════════
//   Batch 2 rules: QKC7 → QKC11, QKT2
//   Living Environment, Diet, Financial Reserves, Allergies
// ════════════════════════════════════════════════════════════

export const rulesConfigBatch2: ScoringRule[] = [

  // ──────────────────────────────────────────────────────────
  //  QKC7 — Living environment
  //  Dimension: wealth (housing is a wealth/resource signal)
  //  13 options mapped via engine to HousingTier.
  //  Scores: 庄园→16, 豪华→14, 自有→12, 家庭→10,
  //  独立租住→8, 熟人合租→8, 陌生人合租→6, 单人宿舍→6,
  //  多人宿舍→4, 借住亲友→4, 帐篷→1, 医院→1, 露宿→0
  // ──────────────────────────────────────────────────────────
  {
    id: 'qkc7.housing',
    condition: (state) =>
      state.housing !== undefined ||
      (state as any).QKC7 !== undefined,
    action: (state) => {
      if (state.housing !== undefined) {
        const map: Record<string, number> = {
          manor: 24, luxury_residence: 20, self_owned: 16,
          family_property: 12, shared_strangers: 8,
          single_dorm: 6, multi_dorm: 4, tent: 1, street: 0,
        };
        state._wealthHousing = map[state.housing] ?? 0;
        return;
      }
      const scores = [24, 20, 16, 12, 10, 10, 8, 8, 6, 6, 2, 2, 0];
      const idx = (state as any).QKC7 as number;
      state._wealthHousing = scores[idx] ?? 0;
    },
  },

  // ──────────────────────────────────────────────────────────
  //  QKC8 — City tier
  //  Dimension: social (city resources → opportunity access)
  //  opt 0: 偏远乡村→0  opt 1: 现代化村镇→1  opt 2: 小城镇→2
  //  opt 3: 大型县城→2  opt 4: 省会→3  opt 5: 一线城市→4
  // ──────────────────────────────────────────────────────────
  {
    id: 'qkc8.city_tier',
    condition: (state) => (state as any).QKC8 !== undefined,
    action: (state) => {
      const scores = [0, 1, 2, 2, 3, 4];
      const idx = (state as any).QKC8 as number;
      state._socialScore = (state._socialScore as number ?? 0)
        + (scores[idx] ?? 0) * 2;
    },
  },

  // ──────────────────────────────────────────────────────────
  //  QKC8b — Diet & nutrition structure
  //  Dimension: health
  //  opt 0: 非常关注→4  opt 1: 比较关注→3
  //  opt 2: 偶尔关注→1  opt 3: 完全不关注→0
  //  Special: '完全不关注' (idx 3) → extra -2 health deduction
  // ──────────────────────────────────────────────────────────
  {
    id: 'qkc8b.diet_nutrition',
    condition: (state) => (state as any).QKC8b !== undefined,
    action: (state) => {
      const idx = (state as any).QKC8b as number;
      const scores = [4, 3, 1, 0];
      let pts = scores[idx] ?? 0;

      // Penalty: 完全不关注 → additional -2 health deduction
      if (idx === 3) {
        pts -= 2;
      }

      state._healthDining = (state._healthDining as number ?? 0) + pts;
    },
  },

  // ──────────────────────────────────────────────────────────
  //  QKC8c — Eating out core factors
  //  Dimension: health
  //  opt 0: 价格→1   opt 1: 口味→1
  //  opt 2: 健康→2   opt 3: 均衡→3
  //  Also sets state.diningPriority for engine rules.
  // ──────────────────────────────────────────────────────────
  {
    id: 'qkc8c.dining_priority',
    condition: (state) =>
      state.diningPriority !== undefined ||
      (state as any).QKC8c !== undefined,
    action: (state) => {
      if (state.diningPriority !== undefined) {
        const map: Record<string, number> = {
          health_balance: 6, taste: 3, price: 0,
        };
        state._healthDining = (state._healthDining as number ?? 0)
          + (map[state.diningPriority] ?? 0);
        return;
      }
      const scores = [1, 1, 2, 3];
      const idx = (state as any).QKC8c as number;
      state._healthDining = (state._healthDining as number ?? 0)
        + (scores[idx] ?? 0) * 2;

      const priorities: Array<'price' | 'taste' | 'health_balance'> =
        ['price', 'taste', 'health_balance', 'health_balance'];
      state.diningPriority = priorities[idx] ?? 'price';
    },
  },

  // ──────────────────────────────────────────────────────────
  //  QKC9 — Savings / financial reserves
  //  Dimension: wealth (Financial Shield)
  //  Normal: opt 0: 储备非常充足→4  opt 1: 储备健康→3
  //          opt 2: 有基础储备→2    opt 3: 月光→1  opt 4: 净负债→0
  //  Medical: same 5-tier structure, different wording.
  //
  //  Top tier sets hasFinancialShield = true.
  //  Maps to savingsBand for engine's calculateWealthScore.
  // ──────────────────────────────────────────────────────────
  {
    id: 'qkc9.savings',
    condition: (state) =>
      state.savingsBand !== undefined ||
      (state as any).QKC9 !== undefined,
    action: (state) => {
      let pts: number;

      if (state.savingsBand !== undefined) {
        const map: Record<string, number> = {
          abundant: 4, healthy: 3, moderate: 2,
          paycheck_to_paycheck: 1, net_debt: 0,
        };
        pts = map[state.savingsBand] ?? 0;
      } else {
        const idx = (state as any).QKC9 as number;
        const scores = [4, 3, 2, 1, 0];
        pts = scores[idx] ?? 0;

        const bands: Array<'abundant' | 'healthy' | 'moderate' | 'paycheck_to_paycheck' | 'net_debt'> =
          ['abundant', 'healthy', 'moderate', 'paycheck_to_paycheck', 'net_debt'];
        state.savingsBand = bands[idx] ?? 'paycheck_to_paycheck';
      }

      // Wealth contribution (×3 for major impact)
      state._wealthScore = (state._wealthScore as number ?? 0) + pts * 2;

      // Financial Shield: top tier reserves
      if (pts === 4) {
        (state as any).hasFinancialShield = true;
      }
    },
  },

  // ──────────────────────────────────────────────────────────
  //  QKC11 — Insurance coverage
  //  Dimension: wealth (Financial Shield)
  //  opt 0: 顶级商业保险→4  opt 1: 全面覆盖→4
  //  opt 2: 基础商业险→3    opt 3: 仅基本医保→1
  //  opt 4: 完全没有保险→0
  //
  //  Top-tier (opt 0) sets hasFinancialShield + extra buff.
  // ──────────────────────────────────────────────────────────
  {
    id: 'qkc11.insurance',
    condition: (state) => (state as any).QKC11 !== undefined,
    action: (state) => {
      const idx = (state as any).QKC11 as number;
      const scores = [4, 4, 3, 1, 0];
      const pts = scores[idx] ?? 0;

      // Insurance contributes to wealth as safety net (×2)
      state._wealthScore = (state._wealthScore as number ?? 0) + pts * 2;

      // Financial Shield: top-tier commercial insurance
      if (idx === 0) {
        (state as any).hasFinancialShield = true;
        // Extra resilience buff: protects against future health→wealth penalties
        state._wealthResilience = (state._wealthResilience as number ?? 0) + 4;
      }

      state.hasInsurance = pts >= 3;
    },
  },

  // ──────────────────────────────────────────────────────────
  //  QKT2 — Allergies
  //  Dimension: health
  //  opt 0: 没有任何过敏→4     opt 1: 轻微过敏→3
  //  opt 2: 中度过敏→2          opt 3: 严重过敏（危及生命）→0
  //  Severe allergy also flags hasChronicCondition.
  // ──────────────────────────────────────────────────────────
  {
    id: 'qkt2.allergies',
    condition: (state) => (state as any).QKT2 !== undefined,
    action: (state) => {
      const idx = (state as any).QKT2 as number;
      const scores = [4, 3, 2, 0];
      state._healthScore = (state._healthScore as number ?? 0)
        + (scores[idx] ?? 0);

      if (idx === 3) {
        state.hasChronicCondition = true;
      }
    },
  },
];

// ════════════════════════════════════════════════════════════
//   Batch 3 rules: QKA_HS1 → QKAB8
//   Education (Student) & Career (Employed)
// ════════════════════════════════════════════════════════════

export const rulesConfigBatch3: ScoringRule[] = [

  // ╔══════════════════════════════════════════════════════════╗
  //  STUDENT — High School (QKA_HS series)
  //  showIf: QK3 === 0 && QKA_STAGE === 0
  // ╚══════════════════════════════════════════════════════════╝

  // ── QKA_HS1 — Learning engagement ──
  // Dim: mind + social (learning joy → cognitive growth)
  // opt 0: 充满热情→4  opt 1: 适应良好→3  opt 2: 枯燥机械→1  opt 3: 极度痛苦→0
  // Special: 极度痛苦 (idx 3) deducts from mind (-3)
  {
    id: 'qka_hs1.learning_engagement',
    condition: (s) => (s as any).QKA_HS1 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      const idx = (s as any).QKA_HS1 as number;
      const pts = scores[idx] ?? 0;
      s._socialScore = (s._socialScore as number ?? 0) + pts;
      // Extreme suffering → mind penalty
      if (idx === 3) {
        s._mindScore = (s._mindScore as number ?? 0) - 3;
      }
    },
  },

  // ── QKA_HS2 — Bullying ──
  // Dim: social + mind (bullying is devastating to both)
  // opt 0: 完全没有→4  opt 1: 偶有小摩擦→3
  // opt 2: 长期情感霸凌→1  opt 3: 身体暴力/严重霸凌→0
  // Special: active bullying (idx 2,3) deducts from BOTH mind and social
  {
    id: 'qka_hs2.bullying',
    condition: (s) => (s as any).QKA_HS2 !== undefined,
    action: (s) => {
      const idx = (s as any).QKA_HS2 as number;
      const socialScores = [4, 3, 1, 0];
      s._socialScore = (s._socialScore as number ?? 0) + (socialScores[idx] ?? 0);

      // Bullying cross-dimension penalty → mind damage
      if (idx === 2) {
        s._mindScore = (s._mindScore as number ?? 0) - 4;
      } else if (idx === 3) {
        s._mindScore = (s._mindScore as number ?? 0) - 6;
        // Physical violence also hurts health
        s._healthScore = (s._healthScore as number ?? 0) - 3;
      }
    },
  },

  // ── QKA_HS3 — Exercise frequency ──
  // Dim: health
  {
    id: 'qka_hs3.exercise',
    condition: (s) => (s as any).QKA_HS3 !== undefined,
    action: (s) => {
      const scores = [4, 3, 2, 0];
      const idx = (s as any).QKA_HS3 as number;
      s._healthScore = (s._healthScore as number ?? 0) + (scores[idx] ?? 0);
    },
  },

  // ── QKA_HS4 — School strictness ──
  // Dim: mind (oppressive environment → cognitive suppression)
  {
    id: 'qka_hs4.school_strictness',
    condition: (s) => (s as any).QKA_HS4 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      const idx = (s as any).QKA_HS4 as number;
      s._mindScore = (s._mindScore as number ?? 0) + (scores[idx] ?? 0);
    },
  },

  // ── QKA_HS5 — Popularity among peers ──
  // Dim: social
  {
    id: 'qka_hs5.popularity',
    condition: (s) => (s as any).QKA_HS5 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      const idx = (s as any).QKA_HS5 as number;
      s._socialScore = (s._socialScore as number ?? 0) + (scores[idx] ?? 0);
    },
  },

  // ── QKA_HS11 — Academic burnout ──
  // Dim: mind (burnout is cognitive erosion)
  // opt 0: 很少→4  opt 1: 偶尔→3  opt 2: 经常→1  opt 3: 持续/已放弃→0
  // Special: complete dropout (idx 3) → severe mind + social penalty
  {
    id: 'qka_hs11.academic_burnout',
    condition: (s) => (s as any).QKA_HS11 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      const idx = (s as any).QKA_HS11 as number;
      s._mindScore = (s._mindScore as number ?? 0) + (scores[idx] ?? 0);
      if (idx === 3) {
        s._socialScore = (s._socialScore as number ?? 0) - 3;
      }
    },
  },

  // ── QKA_HS12 — Future clarity ──
  // Dim: mind
  {
    id: 'qka_hs12.future_clarity',
    condition: (s) => (s as any).QKA_HS12 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      const idx = (s as any).QKA_HS12 as number;
      s._mindScore = (s._mindScore as number ?? 0) + (scores[idx] ?? 0);
    },
  },

  // ╔══════════════════════════════════════════════════════════╗
  //  STUDENT — College / Bachelor / Masters+ (QKA_BC series)
  //  showIf: QK3 === 0 && QKA_STAGE >= 1
  // ╚══════════════════════════════════════════════════════════╝

  // ── QKA_BC1 — Depression ──
  // Dim: mind + health (clinical depression is both)
  // Special: clinical depression (idx 3) → mind -5, health -3
  {
    id: 'qka_bc1.depression',
    condition: (s) => (s as any).QKA_BC1 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      const idx = (s as any).QKA_BC1 as number;
      s._mindScore = (s._mindScore as number ?? 0) + (scores[idx] ?? 0);
      if (idx === 3) {
        s._mindScore = (s._mindScore as number ?? 0) - 5;
        s._healthScore = (s._healthScore as number ?? 0) - 3;
      }
    },
  },

  // ── QKA_BC2 — Study status ──
  // Dim: social (academic standing → future opportunity)
  // Special: failing (idx 3) → mind penalty
  {
    id: 'qka_bc2.study_status',
    condition: (s) => (s as any).QKA_BC2 !== undefined,
    action: (s) => {
      const scores = [4, 3, 2, 0];
      const idx = (s as any).QKA_BC2 as number;
      s._socialScore = (s._socialScore as number ?? 0) + (scores[idx] ?? 0);
      if (idx === 3) {
        s._mindScore = (s._mindScore as number ?? 0) - 3;
      }
    },
  },

  // ── QKA_BC3 — Job relevance ──
  // Dim: wealth (degree→job pipeline is a wealth signal)
  {
    id: 'qka_bc3.job_relevance',
    condition: (s) => (s as any).QKA_BC3 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      const idx = (s as any).QKA_BC3 as number;
      s._wealthScore = (s._wealthScore as number ?? 0) + (scores[idx] ?? 0) * 3;
    },
  },

  // ── QKA_BC4 — Scholarship ──
  // Dim: social (academic distinction)
  {
    id: 'qka_bc4.scholarship',
    condition: (s) => (s as any).QKA_BC4 !== undefined,
    action: (s) => {
      const scores = [4, 3, 2, 0];
      const idx = (s as any).QKA_BC4 as number;
      s._socialScore = (s._socialScore as number ?? 0) + (scores[idx] ?? 0);
    },
  },

  // ── QKA_BC5 — Leadership role ──
  // Dim: social
  {
    id: 'qka_bc5.leadership',
    condition: (s) => (s as any).QKA_BC5 !== undefined,
    action: (s) => {
      const scores = [4, 3, 2, 1];
      const idx = (s as any).QKA_BC5 as number;
      s._socialScore = (s._socialScore as number ?? 0) + (scores[idx] ?? 0);
    },
  },

  // ── QKA_BC7 — Foreign language proficiency ──
  // Dim: mind
  {
    id: 'qka_bc7.foreign_language',
    condition: (s) => (s as any).QKA_BC7 !== undefined,
    action: (s) => {
      const scores = [4, 3, 2, 0];
      const idx = (s as any).QKA_BC7 as number;
      s._mindScore = (s._mindScore as number ?? 0) + (scores[idx] ?? 0);
    },
  },

  // ╔══════════════════════════════════════════════════════════╗
  //  EMPLOYED — Working Professionals (QKAB series)
  //  showIf: QK3 === 1
  // ╚══════════════════════════════════════════════════════════╝

  // ── QKAB1 — Work shifts / hours ──
  // Dim: social + health (cross-dimension)
  // opt 0: 8-10h双休→4   opt 1: 8-10h单休→3
  // opt 2: 休息极少见→1   opt 3: 几乎不间断→0
  // opt 4: 极度轻松→4
  //
  // Special: opt 2 ('C') → health -3; opt 3 ('D') → health -6
  {
    id: 'qkab1.work_hours',
    condition: (s) => (s as any).QKAB1 !== undefined,
    action: (s) => {
      const idx = (s as any).QKAB1 as number;
      const socialScores = [4, 3, 1, 0, 4];
      s._socialScore = (s._socialScore as number ?? 0) + (socialScores[idx] ?? 0);

      // Health penalty for extreme overwork
      if (idx === 2) {
        // 休息对我来说极为少见 → significant health deduction
        s._healthScore = (s._healthScore as number ?? 0) - 3;
      } else if (idx === 3) {
        // 几乎不间断地工作 → severe health deduction
        s._healthScore = (s._healthScore as number ?? 0) - 6;
      }
    },
  },

  // ── QKAB2 — Job-skill match ──
  // Dim: mind (skill utilization → cognitive engagement)
  {
    id: 'qkab2.skill_match',
    condition: (s) => (s as any).QKAB2 !== undefined,
    action: (s) => {
      const scores = [4, 2, 0];
      const idx = (s as any).QKAB2 as number;
      s._mindScore = (s._mindScore as number ?? 0) + (scores[idx] ?? 0);
    },
  },

  // ── QKAB4 — Daily income balance ──
  // Dim: wealth
  {
    id: 'qkab4.income_balance',
    condition: (s) => (s as any).QKAB4 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      const idx = (s as any).QKAB4 as number;
      s._wealthScore = (s._wealthScore as number ?? 0) + (scores[idx] ?? 0) * 4;
    },
  },

  // ── QKAB5 — Exercise and nutrition ──
  // Dim: health
  // Special: 严重依赖外卖快餐 (idx 2) → extra health penalty
  {
    id: 'qkab5.exercise_nutrition',
    condition: (s) => (s as any).QKAB5 !== undefined,
    action: (s) => {
      const scores = [4, 2, 1, 0];
      const idx = (s as any).QKAB5 as number;
      s._healthScore = (s._healthScore as number ?? 0) + (scores[idx] ?? 0);
      // 严重依赖外卖快餐 → extra deduction
      if (idx === 2) {
        s._healthDining = (s._healthDining as number ?? 0) - 2;
      }
    },
  },

  // ── QKAB6 — Promotion / growth opportunity ──
  // Dim: wealth + mind
  {
    id: 'qkab6.promotion',
    condition: (s) => (s as any).QKAB6 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      const idx = (s as any).QKAB6 as number;
      const pts = scores[idx] ?? 0;
      s._wealthScore = (s._wealthScore as number ?? 0) + pts;
      s._mindScore = (s._mindScore as number ?? 0) + pts;
    },
  },

  // ── QKAB7 — Job market resilience ──
  // Dim: wealth + mind
  // opt 0: 毫无压力→4   opt 1: 1-3个月过渡→3
  // opt 2: 非常焦虑→1   opt 3: 致命打击→0
  //
  // Special: 致命打击 (idx 3) → wealth -5, mind -4
  {
    id: 'qkab7.job_resilience',
    condition: (s) => (s as any).QKAB7 !== undefined,
    action: (s) => {
      const idx = (s as any).QKAB7 as number;
      const scores = [4, 3, 1, 0];
      const pts = scores[idx] ?? 0;
      s._wealthScore = (s._wealthScore as number ?? 0) + pts;

      // 致命打击 → severe wealth AND mind deduction
      if (idx === 3) {
        s._wealthScore = (s._wealthScore as number ?? 0) - 5;
        s._mindScore = (s._mindScore as number ?? 0) - 4;
      }
    },
  },

  // ── QKAB8 — Career type ──
  // Dim: social (professional prestige / tier)
  // 23 options grouped into 4 tiers via scoring-integration.js:
  //   Tier 1 (opt 0): 航天 → professionalSkillTier 1 → score 4
  //   Tier 2 (opt 1-9): 公务员/法官/研发/医生/教授/科研/高层/飞行员/教练 → 4
  //   Tier 3 (opt 10-12): 警官/高级经理/MBA → 3
  //   Tier 4 (opt 13-21): 演员/歌手/运动员/戏曲/美术/影视/自媒体/政府职员 → 2-3
  //   None (opt 22): 不属于以上 → 0
  {
    id: 'qkab8.career_type',
    condition: (s) =>
      s.professionalSkillTier !== undefined ||
      (s as any).QKAB8 !== undefined,
    action: (s) => {
      if (s.professionalSkillTier !== undefined) {
        const map: Record<number, number> = { 1: 8, 2: 6, 3: 4, 4: 3, 0: 0 };
        s._socialScore = (s._socialScore as number ?? 0)
          + (map[s.professionalSkillTier] ?? 0);
        return;
      }
      // Raw index fallback: tier lookup from the 23-option list
      const idx = (s as any).QKAB8 as number;
      let pts: number;
      if (idx === 0) pts = 8;                         // 航天
      else if (idx >= 1 && idx <= 9) pts = 6;         // Tier 2
      else if (idx >= 10 && idx <= 12) pts = 4;       // Tier 3
      else if (idx >= 13 && idx <= 21) pts = 3;       // Tier 4
      else pts = 0;                                    // none
      s._socialScore = (s._socialScore as number ?? 0) + pts;
    },
  },
];

// ════════════════════════════════════════════════════════════
//   Batch 4 rules: Relationships, Identity & Mental State
//   QKB1–QKB7, QKB5d, QKB6, QKD1–QKD15, QKT1–QKT14,
//   QKC6, QKAC1–QKAC4, QKAI3–QKAI4
//
//   CRITICAL integrations:
//     • QKB7 + QKAI3/4 → calculateResilienceModifier
//     • QKD7 + QKD15   → calculateGrowthMultiplier
//     • QKB2 + QKB6    → toxic/hostile → severe Mind drain
// ════════════════════════════════════════════════════════════

// ── Helper function signatures (runtime on window.LSFn.*) ──

declare const calculateResilienceModifier: (
  emergencyFunds: string | undefined | null,
  familySupport: string | undefined | null,
  partnerSupport: string | undefined | null,
) => { financialResilienceBuff: number; stressRecoveryRate: number };

declare const calculateGrowthMultiplier: (
  consistencyLevel: string | undefined | null,
  informationQuality: string | undefined | null,
) => { multiplier: number; compositeScore: number; tier: string };

export const rulesConfigBatch4: ScoringRule[] = [

  // ╔══════════════════════════════════════════════════════════╗
  //  RELATIONSHIPS (QKB series)
  // ╚══════════════════════════════════════════════════════════╝

  // ── QKB1 — Relationship / marriage status ──
  // Dim: social
  // OPTION ORDER (12 options, index 0-11):
  //   0: never_dated         → 0
  //   1: dating              → 12
  //   2: previously_dated    → 6
  //   3: married_happy       → 12
  //   4: married_neutral     → 8
  //   5: married_collapsing  → 3
  //   6: cheated_hidden      → 3
  //   7: cheated_caught      → 1
  //   8: partner_cheated     → 3
  //   9: divorced            → 3
  //  10: remarried           → 3
  //  11: widowed             → 1
  {
    id: 'qkb1.relationship',
    condition: (s) => s.relationship !== undefined || (s as any).QKB1 !== undefined,
    action: (s) => {
      if (s.relationship !== undefined) {
        const map: Record<string, number> = {
          dating: 12, married_happy: 12, married_neutral: 8,
          previously_dated: 6, married_collapsing: 3,
          cheated_hidden: 3, partner_cheated: 3, divorced: 3, remarried: 3,
          cheated_caught: 1, widowed: 1, never_dated: 0,
        };
        s._socialRelationship = map[s.relationship] ?? 0;
        return;
      }
      // Fallback: raw index path — values match the engine map above directly
      const scores = [0, 12, 6, 12, 8, 3, 3, 1, 3, 3, 3, 1];
      const idx = (s as any).QKB1 as number;
      s._socialRelationship = scores[idx] ?? 0;
    },
  },

  // ── QKB2 — Family relationship ──
  // Dim: social + mind (toxic family → severe mind drain)
  {
    id: 'qkb2.family',
    condition: (s) => s.familySupport !== undefined || (s as any).QKB2 !== undefined,
    action: (s) => {
      let pts: number;
      let isToxic = false;

      if (s.familySupport !== undefined) {
        const map: Record<string, number> = {
          excellent: 4, decent: 3, distant: 1, toxic: 0,
          deceased_good: 3, deceased_neutral: 2,
        };
        pts = map[s.familySupport] ?? 0;
        isToxic = s.familySupport === 'toxic';
      } else {
        const scores = [4, 3, 1, 0, 3, 2];
        const idx = (s as any).QKB2 as number;
        pts = scores[idx] ?? 0;
        isToxic = idx === 3;
      }

      s._socialScore = (s._socialScore as number ?? 0) + pts * 2;

      // CRITICAL: toxic family → severe Mind drain
      if (isToxic) {
        s._mindScore = (s._mindScore as number ?? 0) - 6;
      }
    },
  },

  // ── QKB5 — Childcare effort ──
  // Dim: social
  {
    id: 'qkb5.childcare',
    condition: (s) => (s as any).QKB5 !== undefined,
    action: (s) => {
      const scores = [4, 3, 2, 1, 0, 3];
      const idx = (s as any).QKB5 as number;
      s._socialChildcare = (scores[idx] ?? 0) * 2;
    },
  },

  // ── QKB5d — Parenting style ──
  // Dim: social
  {
    id: 'qkb5d.parenting_style',
    condition: (s) => s.parentingStyle !== undefined || (s as any).QKB5d !== undefined,
    action: (s) => {
      if (s.parentingStyle !== undefined) {
        const map: Record<string, number> = {
          guiding: 4, democratic: 4, protective: 2,
          authoritarian: 2, permissive: 1, controlling: 0,
        };
        s._socialParenting = map[s.parentingStyle] ?? 0;
        return;
      }
      const scores = [4, 4, 2, 2, 1, 0];
      s._socialParenting = scores[(s as any).QKB5d as number] ?? 0;
    },
  },

  // ── QKB6 — Siblings ──
  // Dim: social + mind (hostile siblings → mind drain)
  {
    id: 'qkb6.siblings',
    condition: (s) => s.siblingRelation !== undefined || (s as any).QKB6 !== undefined,
    action: (s) => {
      let pts: number;
      let isHostile = false;

      if (s.siblingRelation !== undefined) {
        const map: Record<string, number> = {
          very_close: 4, friendly: 3, estranged: 1, hostile: 0, only_child: 2,
        };
        pts = map[s.siblingRelation] ?? 0;
        isHostile = s.siblingRelation === 'hostile';
      } else {
        const scores = [4, 3, 1, 0, 2];
        const idx = (s as any).QKB6 as number;
        pts = scores[idx] ?? 0;
        isHostile = idx === 3;
      }

      s._socialSiblings = pts;

      // CRITICAL: hostile siblings → Mind drain
      if (isHostile) {
        s._mindScore = (s._mindScore as number ?? 0) - 4;
      }
    },
  },

  // ── QKB7 — Emergency funds (uses calculateResilienceModifier) ──
  // Dim: wealth (financial resilience buff)
  {
    id: 'qkb7.emergency_funds',
    condition: (s) =>
      s.emergencyFunds !== undefined ||
      s.familySupport !== undefined ||
      (s as any).QKB7 !== undefined,
    action: (s) => {
      const efMap: Record<number, string> = {
        0: 'easy_300k', 1: 'family_decent_amount',
        2: 'small_loan_only', 3: 'nothing',
      };
      const ef = s.emergencyFunds ?? efMap[(s as any).QKB7 as number] ?? null;
      const fs = s.familySupport ?? null;
      const ps = (s as any).partnerSupport ?? null;

      const result = calculateResilienceModifier(ef, fs, ps);

      s._wealthResilience = (s._wealthResilience as number ?? 0)
        + result.financialResilienceBuff;

      // Store recovery rate for downstream rules
      (s as any).stressRecoveryRate = result.stressRecoveryRate;
    },
  },

  // ╔══════════════════════════════════════════════════════════╗
  //  CAREGIVER (QKAI series)
  // ╚══════════════════════════════════════════════════════════╝

  // ── QKAI3 — Family support (caregiver, uses resilience) ──
  {
    id: 'qkai3.family_support',
    condition: (s) => (s as any).QKAI3 !== undefined,
    action: (s) => {
      const scores = [4, 3, 2, 0];
      const idx = (s as any).QKAI3 as number;
      s._socialScore = (s._socialScore as number ?? 0) + (scores[idx] ?? 0) * 2;
      // Negative support → mind drain
      if (idx === 3) {
        s._mindScore = (s._mindScore as number ?? 0) - 4;
      }
    },
  },

  // ── QKAI4 — Partner parenting share (uses resilience context) ──
  {
    id: 'qkai4.partner_parenting',
    condition: (s) => (s as any).QKAI4 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      const idx = (s as any).QKAI4 as number;
      s._socialScore = (s._socialScore as number ?? 0) + (scores[idx] ?? 0);
      // Zero parenting partner → health and mind penalty (caregiver burnout)
      if (idx === 3) {
        s._healthScore = (s._healthScore as number ?? 0) - 3;
        s._mindScore = (s._mindScore as number ?? 0) - 3;
      }
    },
  },

  // ╔══════════════════════════════════════════════════════════╗
  //  SKILLS, EXPERIENCES & PSYCHOLOGY (QKD series)
  // ╚══════════════════════════════════════════════════════════╝

  // ── QKD1 — Foreign language proficiency ──
  // Dim: mind
  {
    id: 'qkd1.foreign_language',
    condition: (s) => (s as any).QKD1 !== undefined,
    action: (s) => {
      const scores = [4, 4, 3, 2, 1, 0, 0];
      s._mindLanguage = scores[(s as any).QKD1 as number] ?? 0;
    },
  },

  // ── QKD7 + QKD15 — Persistence + Info Quality → Growth Multiplier ──
  // CRITICAL: uses calculateGrowthMultiplier to create a Mind multiplier
  {
    id: 'qkd7_d15.growth_multiplier',
    condition: (s) =>
      (s as any).consistencyLevel !== undefined ||
      s.informationLiteracy !== undefined ||
      (s as any).QKD7 !== undefined ||
      (s as any).QKD15 !== undefined,
    action: (s) => {
      // Map raw QKD7 index → consistency level string
      const cMap: Record<number, string> = {
        0: 'iron_discipline', 1: 'consistent_with_feedback',
        2: 'motivation_dependent', 3: 'abandons_quickly',
      };
      // Map raw QKD15 index → info quality string
      const iMap: Record<number, string> = {
        0: 'high_filtering', 1: 'multi_perspective',
        2: 'cautious_logical', 3: 'authority_dependent',
        4: 'seeing_is_believing', 5: 'contrarian_bias', 6: 'disengaged',
      };

      const cLevel = (s as any).consistencyLevel
        ?? cMap[(s as any).QKD7 as number]
        ?? undefined;
      const iLevel = s.informationLiteracy
        ?? iMap[(s as any).QKD15 as number]
        ?? undefined;

      const result = calculateGrowthMultiplier(cLevel, iLevel);

      // Apply as a multiplier to the current mind accumulator
      const currentMind = (s._mindScore as number ?? 0)
        + (s._mindLanguage as number ?? 0)
        + (s._mindAddictions as number ?? 0)
        + (s._mindGrowth as number ?? 0);

      // The growth multiplier scales the mind baseline
      s._mindGrowth = Math.round(10 * result.multiplier - 10);

      // Also add QKD7 and QKD15 as direct mind contributions
      if ((s as any).QKD7 !== undefined) {
        const d7scores = [4, 3, 1, 0];
        s._mindScore = (s._mindScore as number ?? 0) + (d7scores[(s as any).QKD7 as number] ?? 0);
      }
      if ((s as any).QKD15 !== undefined) {
        const d15scores = [4, 4, 3, 2, 1, 0, 0];
        s._mindInfoLiteracy = d15scores[(s as any).QKD15 as number] ?? 0;
      }
    },
  },

  // ── QKD8 — Emotional management ──
  // Dim: mind
  {
    id: 'qkd8.emotional_mgmt',
    condition: (s) => (s as any).QKD8 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      s._mindScore = (s._mindScore as number ?? 0) + (scores[(s as any).QKD8 as number] ?? 0);
    },
  },

  // ── QKD9 — Life agency ──
  // Dim: mind
  {
    id: 'qkd9.life_agency',
    condition: (s) => (s as any).QKD9 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      s._mindScore = (s._mindScore as number ?? 0) + (scores[(s as any).QKD9 as number] ?? 0);
    },
  },

  // ── QKD12 — Sustained focus ──
  // Dim: mind
  {
    id: 'qkd12.focus',
    condition: (s) => (s as any).QKD12 !== undefined,
    action: (s) => {
      const scores = [4, 3, 1, 0];
      s._mindScore = (s._mindScore as number ?? 0) + (scores[(s as any).QKD12 as number] ?? 0);
    },
  },

  // ── QKD13 — TCM attitude ──
  // Dim: mind
  {
    id: 'qkd13.tcm',
    condition: (s) => s.tcmAttitude !== undefined || (s as any).QKD13 !== undefined,
    action: (s) => {
      if (s.tcmAttitude !== undefined) {
        const map: Record<string, number> = {
          open_minded: 4, skeptical_respectful: 3,
          staunch_supporter: 2, strongly_opposed: 1,
        };
        s._mindTcm = map[s.tcmAttitude] ?? 0;
        return;
      }
      const scores = [2, 4, 3, 1];
      s._mindTcm = scores[(s as any).QKD13 as number] ?? 0;
    },
  },

  // ── QKD14 — Risk appetite ──
  // Dim: mind
  {
    id: 'qkd14.risk',
    condition: (s) => (s as any).QKD14 !== undefined,
    action: (s) => {
      const scores = [4, 3, 2, 1];
      s._mindScore = (s._mindScore as number ?? 0) + (scores[(s as any).QKD14 as number] ?? 0);
    },
  },

  // ╔══════════════════════════════════════════════════════════╗
  //  TRAITS & CONDITIONS (QKT series)
  // ╚══════════════════════════════════════════════════════════╝

  // ── QKT1 — Self-harm tendency ──
  // Dim: mind + health
  {
    id: 'qkt1.self_harm',
    condition: (s) => (s as any).QKT1 !== undefined,
    action: (s) => {
      const scores = [4, 2, 1, 0];
      const idx = (s as any).QKT1 as number;
      s._mindScore = (s._mindScore as number ?? 0) + (scores[idx] ?? 0);
      // Active self-harm → health penalty
      if (idx === 3) {
        s._healthScore = (s._healthScore as number ?? 0) - 5;
      }
    },
  },

  // ── QKT3 — Mental health conditions ──
  // Dim: mind
  {
    id: 'qkt3.mental_health',
    condition: (s) => (s as any).QKT3 !== undefined,
    action: (s) => {
      const scores = [4, 3, 2, 1, 0];
      s._mindScore = (s._mindScore as number ?? 0) + (scores[(s as any).QKT3 as number] ?? 0);
    },
  },

  // ── QKT14 — Color blindness ──
  // Dim: health (absolute penalty)
  {
    id: 'qkt14.color_blindness',
    condition: (s) =>
      s.colorBlindnessPenalty !== undefined ||
      (s as any).QKT14 !== undefined,
    action: (s) => {
      if (s.colorBlindnessPenalty !== undefined) {
        s._healthColorBlindness = s.colorBlindnessPenalty;
        return;
      }
      const penalties = [0, -1, -2, -3, -4];
      s._healthColorBlindness = penalties[(s as any).QKT14 as number] ?? 0;
    },
  },

  // ── QKC6 — Criminal record ──
  // Dim: mind
  {
    id: 'qkc6.criminal',
    condition: (s) => s.criminalRecord !== undefined || (s as any).QKC6 !== undefined,
    action: (s) => {
      if (s.criminalRecord !== undefined) {
        const map: Record<string, number> = {
          clean: 4, minor: 2, undetected_serious: 2,
          minor_with_impact: 0, major: -3,
        };
        s._mindCriminal = map[s.criminalRecord] ?? 0;
        return;
      }
      const scores = [4, 3, 2, 1, 0];
      s._mindCriminal = scores[(s as any).QKC6 as number] ?? 0;
    },
  },

  // ╔══════════════════════════════════════════════════════════╗
  //  ENTREPRENEUR (QKAC series) — uses calculateBusinessScore
  // ╚══════════════════════════════════════════════════════════╝

  // ── QKAC1-4 combined — Business score ──
  {
    id: 'qkac.business',
    condition: (s) =>
      (s as any).QKC_cashFlow !== undefined ||
      ((s as any).QKAC1 !== undefined && (s as any).QKAC2 !== undefined),
    action: (s) => {
      // Map raw indices to string keys
      const cfMap = ['stable_profit', 'break_even', 'pre_revenue', 'losing_money', 'severe_debt'];
      const whMap = ['under_40', '40_to_60', '60_to_80', 'over_80'];
      const cbMap = ['ultra_sticky', 'sticky', 'moderate_churn', 'early_validation', 'cold_start'];
      const chMap = ['certified_mogul', 'founder', 'solo_operator', 'side_hustle'];

      const cf = (s as any).cashFlowStage ?? cfMap[(s as any).QKAC1 as number] ?? null;
      const wh = (s as any).weeklyHours ?? whMap[(s as any).QKAC2 as number] ?? null;
      const cb = (s as any).customerBase ?? cbMap[(s as any).QKAC3 as number] ?? null;
      const ch = (s as any).entrepreneurChannel ?? chMap[(s as any).QKAC4 as number] ?? null;

      // Import at call site (runtime on window.LSFn.business or direct)
      // For type-level, we inline the logic pattern
      if (!cf || !wh || !cb || !ch) return;

      // Simple inline scoring matching calculateBusinessScore logic
      const cfScores: Record<string, number> = {
        stable_profit: 10, break_even: 5, pre_revenue: 2, losing_money: -2, severe_debt: -6,
      };
      const whScores: Record<string, number> = {
        under_40: 4, '40_to_60': 2, '60_to_80': 0, over_80: -3,
      };
      const cbScores: Record<string, number> = {
        ultra_sticky: 6, sticky: 4, moderate_churn: 2, early_validation: 1, cold_start: 0,
      };
      const chWeights: Record<string, number> = {
        certified_mogul: 1.0, founder: 0.85, solo_operator: 0.65, side_hustle: 0.45,
      };

      const isSH = ch === 'side_hustle';
      const whSH: Record<string, number> = { under_40: 2, '40_to_60': 1, '60_to_80': 0, over_80: -1 };
      const raw = cfScores[cf] + (isSH ? whSH[wh] : whScores[wh]) + cbScores[cb];
      let weighted = raw * chWeights[ch];

      const hasMoat = cf === 'stable_profit' && cb === 'ultra_sticky';
      if (hasMoat) weighted *= 1.5;

      const isBurnout = (cf === 'losing_money' || cf === 'severe_debt') && wh === 'over_80';
      if (isBurnout) weighted *= 0.4;

      s._wealthBusiness = Math.max(-10, Math.min(25, Math.round(weighted)));

      // Burnout flag → health penalty
      if (isBurnout) {
        s._healthBurnoutPenalty = -5;
      }
    },
  },
];

// ════════════════════════════════════════════════════════════
//   Batch 5 rules: Bonus (QKBON_G1 → QKBON_G8)
//   Massive direct buffs via simple += to core dimensions.
// ════════════════════════════════════════════════════════════

export const rulesConfigBatch5: ScoringRule[] = [

  // ── QKBON_G1 — Public Figure ──
  // opt 0: 全国范围内广为人知 → +15 social
  // opt 1: 行业内有很高知名度 → +10 social
  // opt 2: 地方/区域范围 → +5 social
  // opt 3: 网络影响力 → +5 social
  // opt 4: 曾短暂受到关注 → +2 social
  // opt 5: 普通市民 → 0
  {
    id: 'qkbon_g1.public_figure',
    condition: (s) => (s as any).QKBON_G1 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_G1 as number;
      const buffs = [15, 10, 5, 5, 2, 0];
      s._socialScore = (s._socialScore as number ?? 0) + (buffs[idx] ?? 0);
    },
  },

  // ── QKBON_G3 — Surviving Disaster ──
  // opt 0: 近乎零生还率幸存 → +10 mind, +5 health
  // opt 1: 安全脱离高度危险 → +5 mind, +2 health
  // opt 2: 没有 → 0
  {
    id: 'qkbon_g3.disaster_survivor',
    condition: (s) => (s as any).QKBON_G3 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_G3 as number;
      if (idx === 0) {
        s._mindScore = (s._mindScore as number ?? 0) + 10;
        s._healthScore = (s._healthScore as number ?? 0) + 5;
      } else if (idx === 1) {
        s._mindScore = (s._mindScore as number ?? 0) + 5;
        s._healthScore = (s._healthScore as number ?? 0) + 2;
      }
    },
  },

  // ── QKBON_G7 — Master Skill ──
  // opt 0: 国家级/世界级大师 → +15 mind, +10 wealth
  // opt 1: 国家级专业认证 → +12 mind, +8 wealth
  // opt 2: 省级/区域级 → +8 mind, +5 wealth
  // opt 3: 行业内资深专家 → +6 mind, +4 wealth
  // opt 4: 高含金量证书 → +4 mind, +3 wealth
  // opt 5: 技艺精湛但无认可 → +2 mind, +1 wealth
  // opt 6: 没有 → 0
  {
    id: 'qkbon_g7.master_skill',
    condition: (s) => (s as any).QKBON_G7 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_G7 as number;
      const mindBuffs   = [15, 12, 8, 6, 4, 2, 0];
      const wealthBuffs = [10,  8, 5, 4, 3, 1, 0];
      s._mindScore = (s._mindScore as number ?? 0) + (mindBuffs[idx] ?? 0);
      s._wealthScore = (s._wealthScore as number ?? 0) + (wealthBuffs[idx] ?? 0);
    },
  },

  // ── QKBON_G8 — Extreme Endurance ──
  // opt 0: 多次完成极限挑战 → +15 health, +10 mind
  // opt 1: 全程马拉松 → +10 health, +6 mind
  // opt 2: 半程马拉松/标铁 → +6 health, +3 mind
  // opt 3: 超长距离骑行/登山 → +6 health, +3 mind
  // opt 4: 正在训练10km+ → +3 health, +1 mind
  // opt 5: 有运动习惯 → +1 health
  // opt 6: 没有 → 0
  {
    id: 'qkbon_g8.extreme_endurance',
    condition: (s) => (s as any).QKBON_G8 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_G8 as number;
      const healthBuffs = [15, 10, 6, 6, 3, 1, 0];
      const mindBuffs   = [10,  6, 3, 3, 1, 0, 0];
      s._healthScore = (s._healthScore as number ?? 0) + (healthBuffs[idx] ?? 0);
      s._mindScore = (s._mindScore as number ?? 0) + (mindBuffs[idx] ?? 0);
    },
  },
];

// ════════════════════════════════════════════════════════════
//   Batch 6 rules: Stage-Specific Bonus (QKBON_S/AB/AC/AE)
// ════════════════════════════════════════════════════════════

export const rulesConfigBatch6: ScoringRule[] = [

  // ── QKBON_S1 — Iron Discipline (Student) ──
  {
    id: 'qkbon_s1.iron_discipline',
    condition: (s) => (s as any).QKBON_S1 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_S1 as number;
      const buffs = [15, 8, 4, 1, 0];
      s._mindScore = (s._mindScore as number ?? 0) + (buffs[idx] ?? 0);
    },
  },

  // ── QKBON_S3 — Top Academic/Competition ──
  {
    id: 'qkbon_s3.top_academic',
    condition: (s) => (s as any).QKBON_S3 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_S3 as number;
      const mindBuffs   = [15, 12, 8, 5, 3, 1, 0];
      const socialBuffs = [10,  8, 5, 3, 1, 0, 0];
      s._mindScore = (s._mindScore as number ?? 0) + (mindBuffs[idx] ?? 0);
      s._socialScore = (s._socialScore as number ?? 0) + (socialBuffs[idx] ?? 0);
    },
  },

  // ── QKBON_AC2 — Business Moat (Entrepreneur) ──
  {
    id: 'qkbon_ac2.business_moat',
    condition: (s) => (s as any).QKBON_AC2 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_AC2 as number;
      const buffs = [20, 6, 0];
      s._wealthScore = (s._wealthScore as number ?? 0) + (buffs[idx] ?? 0);
    },
  },

  // ── QKBON_AC5 — 3-Month Vacation Automation (Entrepreneur) ──
  {
    id: 'qkbon_ac5.time_freedom',
    condition: (s) => (s as any).QKBON_AC5 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_AC5 as number;
      if (idx === 0) {
        s._mindScore = (s._mindScore as number ?? 0) + 20;
        s._wealthScore = (s._wealthScore as number ?? 0) + 10;
      } else if (idx === 1) {
        s._mindScore = (s._mindScore as number ?? 0) + 5;
        s._wealthScore = (s._wealthScore as number ?? 0) + 3;
      }
    },
  },

  // ── QKBON_AE1 — God-Tier Retiree Fitness ──
  {
    id: 'qkbon_ae1.retiree_fitness',
    condition: (s) => (s as any).QKBON_AE1 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_AE1 as number;
      const buffs = [20, 8, 0];
      s._healthScore = (s._healthScore as number ?? 0) + (buffs[idx] ?? 0);
    },
  },

  // ── QKBON_AE2 — Generational Wealth ──
  {
    id: 'qkbon_ae2.generational_wealth',
    condition: (s) => (s as any).QKBON_AE2 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_AE2 as number;
      const buffs = [20, 6, 0];
      s._wealthScore = (s._wealthScore as number ?? 0) + (buffs[idx] ?? 0);
    },
  },

  // ── QKBON_AE3 — Irreplaceable Consultant ──
  {
    id: 'qkbon_ae3.irreplaceable_consultant',
    condition: (s) => (s as any).QKBON_AE3 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_AE3 as number;
      if (idx === 0) {
        s._socialScore = (s._socialScore as number ?? 0) + 15;
        s._wealthScore = (s._wealthScore as number ?? 0) + 10;
      } else if (idx === 1) {
        s._socialScore = (s._socialScore as number ?? 0) + 4;
        s._wealthScore = (s._wealthScore as number ?? 0) + 2;
      }
    },
  },

  // ── QKBON_AE4 — Tech-Savvy / AI Creator (60+) ──
  {
    id: 'qkbon_ae4.tech_savvy',
    condition: (s) => (s as any).QKBON_AE4 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_AE4 as number;
      const buffs = [20, 5, 0];
      s._mindScore = (s._mindScore as number ?? 0) + (buffs[idx] ?? 0);
    },
  },

  // ── QKBON_AE5 — Spiritual Independence ──
  {
    id: 'qkbon_ae5.spiritual_independence',
    condition: (s) => (s as any).QKBON_AE5 !== undefined,
    action: (s) => {
      const idx = (s as any).QKBON_AE5 as number;
      if (idx === 0) {
        s._mindScore = (s._mindScore as number ?? 0) + 20;
        s._socialScore = (s._socialScore as number ?? 0) + 10;
      } else if (idx === 1) {
        s._mindScore = (s._mindScore as number ?? 0) + 5;
        s._socialScore = (s._socialScore as number ?? 0) + 2;
      }
    },
  },
];
