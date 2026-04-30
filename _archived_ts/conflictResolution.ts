/* ============================================================
 * conflictResolution.ts
 *
 * Declarative conflict resolution matrix for the Dual-Track
 * scoring engine.  Defines which Traits provide immunity or
 * amplification against specific dimension penalties.
 *
 * Adding a new rule:
 *   Just append an entry to CONFLICT_RULES.  No functions to
 *   write — the resolver reads the matrix and applies it.
 *
 * Runs between Pass 1 (defaults) and Pass 2 (complex rules)
 * inside evaluateRules.
 * ============================================================ */

// ════════════════════════════════════════════════════════════
//   Types
// ════════════════════════════════════════════════════════════

export type Dimension = 'health' | 'wealth' | 'social' | 'mind';

export type ConflictEffect =
  | 'immunity'       // Zeroes out ALL negative contributions to the target
  | 'resistance'     // Reduces negative contributions by a percentage
  | 'amplify'        // Multiplies positive contributions
  | 'floor'          // Sets a minimum score for the dimension
  | 'cap_penalty';   // Caps the maximum penalty from matched sources

export interface ConflictRule {
  /** Human-readable label for debugging / analysis UI. */
  id: string;

  /** The trait that activates this rule. */
  trait: string;

  /** Which dimension this rule protects or amplifies. */
  dimension: Dimension;

  /** What this rule does. */
  effect: ConflictEffect;

  /**
   * Effect parameter:
   *   immunity    → ignored (all negatives zeroed)
   *   resistance  → 0.0–1.0, fraction of negatives REMOVED (0.8 = 80% reduction)
   *   amplify     → multiplier on positives (1.5 = 50% boost)
   *   floor       → minimum dimension score (before clamping)
   *   cap_penalty → max negative delta allowed (e.g., -10 means no worse than -10)
   */
  value?: number;

  /**
   * Optional: only apply to penalties from specific state fields.
   * If omitted, applies to ALL fields in the target dimension.
   * Use this to scope immunity narrowly (e.g., only housing/employment).
   */
  sourceFields?: string[];

  /**
   * Optional: only apply if a SECOND trait is also present.
   * Enables combo effects (e.g., FINANCIAL_SHIELD + TOP_INSURANCE → full immunity).
   */
  requiresTrait?: string;
}

// ════════════════════════════════════════════════════════════
//   Conflict Resolution Matrix
// ════════════════════════════════════════════════════════════

export const CONFLICT_RULES: ConflictRule[] = [

  // ╔══════════════════════════════════════════════════════════╗
  //  WEALTH IMMUNITIES
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'financially_free_wealth_immunity',
    trait: 'FINANCIALLY_FREE',
    dimension: 'wealth',
    effect: 'immunity',
    sourceFields: ['_wealthScore', '_wealthHousing'],
  },

  {
    id: 'top_insurance_illness_shield',
    trait: 'TOP_INSURANCE',
    dimension: 'wealth',
    effect: 'immunity',
    sourceFields: ['_wealthAddictionCap', '_wealthBusiness'],
  },

  {
    id: 'financial_shield_penalty_cap',
    trait: 'FINANCIAL_SHIELD',
    dimension: 'wealth',
    effect: 'cap_penalty',
    value: -5,
  },

  {
    id: 'generational_wealth_floor',
    trait: 'GENERATIONAL_WEALTH',
    dimension: 'wealth',
    effect: 'floor',
    value: 100,
  },

  {
    id: 'savings_discipline_wealth_boost',
    trait: 'SAVINGS_DISCIPLINE',
    dimension: 'wealth',
    effect: 'amplify',
    value: 1.3,
  },

  {
    id: 'business_moat_wealth_boost',
    trait: 'BUSINESS_MOAT',
    dimension: 'wealth',
    effect: 'amplify',
    value: 1.4,
  },

  {
    id: 'time_freedom_wealth_floor',
    trait: 'TIME_FREEDOM',
    dimension: 'wealth',
    effect: 'floor',
    value: 90,
  },

  // ╔══════════════════════════════════════════════════════════╗
  //  HEALTH IMMUNITIES
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'elite_fitness_health_boost',
    trait: 'ELITE_FITNESS',
    dimension: 'health',
    effect: 'amplify',
    value: 1.3,
  },

  {
    id: 'extreme_endurance_health_floor',
    trait: 'EXTREME_ENDURANCE',
    dimension: 'health',
    effect: 'floor',
    value: 80,
  },

  {
    id: 'top_insurance_health_resistance',
    trait: 'TOP_INSURANCE',
    dimension: 'health',
    effect: 'resistance',
    value: 0.5,
    sourceFields: ['_healthBurnoutPenalty'],
  },

  // ╔══════════════════════════════════════════════════════════╗
  //  MIND IMMUNITIES
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'spiritual_independence_toxic_family_resist',
    trait: 'SPIRITUAL_INDEPENDENCE',
    dimension: 'mind',
    effect: 'resistance',
    value: 0.8,
  },

  {
    id: 'iron_discipline_mind_boost',
    trait: 'IRON_DISCIPLINE',
    dimension: 'mind',
    effect: 'amplify',
    value: 1.25,
  },

  {
    id: 'master_skill_mind_floor',
    trait: 'MASTER_SKILL',
    dimension: 'mind',
    effect: 'floor',
    value: 90,
  },

  {
    id: 'polyglot_mind_boost',
    trait: 'POLYGLOT',
    dimension: 'mind',
    effect: 'amplify',
    value: 1.2,
  },

  {
    id: 'tech_savvy_elder_mind_floor',
    trait: 'TECH_SAVVY_ELDER',
    dimension: 'mind',
    effect: 'floor',
    value: 85,
  },

  // ╔══════════════════════════════════════════════════════════╗
  //  SOCIAL IMMUNITIES
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'public_figure_social_boost',
    trait: 'PUBLIC_FIGURE',
    dimension: 'social',
    effect: 'amplify',
    value: 1.3,
  },

  {
    id: 'irreplaceable_consultant_social_floor',
    trait: 'IRREPLACEABLE_CONSULTANT',
    dimension: 'social',
    effect: 'floor',
    value: 85,
  },

  // ╔══════════════════════════════════════════════════════════╗
  //  NEGATIVE AMPLIFICATIONS (debuffs make things worse)
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'extreme_addiction_mind_amplify_penalty',
    trait: 'EXTREME_ADDICTION',
    dimension: 'mind',
    effect: 'cap_penalty',
    value: -40,
  },

  {
    id: 'burnout_risk_health_cap',
    trait: 'BURNOUT_RISK',
    dimension: 'health',
    effect: 'cap_penalty',
    value: -30,
  },

  {
    id: 'toxic_family_social_penalty_cap',
    trait: 'TOXIC_FAMILY',
    dimension: 'social',
    effect: 'cap_penalty',
    value: -25,
  },

  // ╔══════════════════════════════════════════════════════════╗
  //  COMBO EFFECTS (require two traits)
  // ╚══════════════════════════════════════════════════════════╝

  {
    id: 'shield_plus_insurance_full_wealth_immunity',
    trait: 'FINANCIAL_SHIELD',
    requiresTrait: 'TOP_INSURANCE',
    dimension: 'wealth',
    effect: 'immunity',
  },

  {
    id: 'discipline_plus_endurance_health_floor',
    trait: 'IRON_DISCIPLINE',
    requiresTrait: 'EXTREME_ENDURANCE',
    dimension: 'health',
    effect: 'floor',
    value: 110,
  },
];

// ════════════════════════════════════════════════════════════
//   Resolver Engine
// ════════════════════════════════════════════════════════════

/**
 * Resolve all trait-based conflicts on a state object.
 *
 * Reads the dimension accumulator fields (_healthScore, etc.),
 * applies the conflict matrix, and writes back modified values.
 *
 * Call this AFTER Pass 1 (defaults) and AFTER Pass 2 (rules),
 * but BEFORE extractDimensions.
 */
export function resolveConflicts(
  state: Record<string, any>,
  traits: Set<string>,
): void {
  if (!traits || traits.size === 0) return;

  const DIMENSION_FIELDS: Record<Dimension, string[]> = {
    health: ['_healthScore','_healthBmi','_healthVision','_healthColorBlindness','_healthOverall','_healthDining','_healthBurnoutPenalty'],
    wealth: ['_wealthScore','_wealthHousing','_wealthBaseline','_wealthResilience','_wealthBusiness','_wealthAddictionCap'],
    social: ['_socialScore','_socialRelationship','_socialSiblings','_socialChildcare','_socialParenting'],
    mind:   ['_mindScore','_mindAddictions','_mindGrowth','_mindEducation','_mindLanguage','_mindTravel','_mindProfession','_mindTcm','_mindInfoLiteracy','_mindCriminal'],
  };

  for (const rule of CONFLICT_RULES) {
    if (!traits.has(rule.trait)) continue;
    if (rule.requiresTrait && !traits.has(rule.requiresTrait)) continue;

    const fields = rule.sourceFields ?? DIMENSION_FIELDS[rule.dimension];

    switch (rule.effect) {

      case 'immunity': {
        for (const f of fields) {
          const val = state[f];
          if (typeof val === 'number' && val < 0) {
            state[f] = 0;
          }
        }
        break;
      }

      case 'resistance': {
        const reduction = rule.value ?? 0.5;
        for (const f of fields) {
          const val = state[f];
          if (typeof val === 'number' && val < 0) {
            state[f] = Math.round(val * (1 - reduction));
          }
        }
        break;
      }

      case 'amplify': {
        const mult = rule.value ?? 1.0;
        for (const f of fields) {
          const val = state[f];
          if (typeof val === 'number' && val > 0) {
            state[f] = Math.round(val * mult);
          }
        }
        break;
      }

      case 'floor': {
        const floor = rule.value ?? 0;
        state['_' + rule.dimension + 'Floor'] = Math.max(
          state['_' + rule.dimension + 'Floor'] ?? 0,
          floor,
        );
        break;
      }

      case 'cap_penalty': {
        const maxPenalty = rule.value ?? -10;
        let totalNeg = 0;
        for (const f of fields) {
          const val = state[f];
          if (typeof val === 'number' && val < 0) totalNeg += val;
        }
        if (totalNeg < maxPenalty) {
          const scale = totalNeg !== 0 ? maxPenalty / totalNeg : 1;
          for (const f of fields) {
            const val = state[f];
            if (typeof val === 'number' && val < 0) {
              state[f] = Math.round(val * scale);
            }
          }
        }
        break;
      }
    }
  }
}
