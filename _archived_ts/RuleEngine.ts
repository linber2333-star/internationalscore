/* ============================================================
 * RuleEngine.ts
 *
 * Dual-Track scoring executor for the LifeScore engine.
 *
 * Two-pass pipeline:
 *
 *   Pass 1 — Base Calculation (defaultWeights):
 *     Loop through all raw answers on state.  For each answer
 *     found in the DefaultWeightMap, apply the simple +/- score
 *     to the dimension accumulators.  This gives every question
 *     a non-zero contribution without writing TypeScript rules.
 *
 *   Pass 2 — Rule Overrides & Complex Math (rulesConfig):
 *     Loop through ScoringRules in order.  These can apply
 *     multipliers, cross-dimension penalties, helper-function
 *     results, or overwrite specific fields entirely.
 *
 *   Final — Clamp each dimension to [0, 150].
 *
 * Design guarantees:
 *   1. NEVER MUTATES the input state.
 *   2. FAULT-ISOLATED per rule.
 *   3. DETERMINISTIC.
 *   4. AUDITABLE with full fired/skipped/errored trail.
 *
 * Dependencies (types only):
 *   - scoring-engine.d.ts  (UserProfileState, Dimension)
 *   - defaultWeights.ts    (applyDefaultWeights)
 * ============================================================ */

import type {
  UserProfileState as BaseUserProfileState,
  Dimension,
} from './scoring-engine_d';

import { applyDefaultWeights } from './defaultWeights';
import { resolveConflicts } from './conflictResolution';

// ════════════════════════════════════════════════════════════
//   Extended state
// ════════════════════════════════════════════════════════════

export interface UserProfileState extends BaseUserProfileState {
  heightRange?: string;
  weightRange?: string;
  addictions?: string[];
  consistencyLevel?: string;
  cashFlowStage?: string;
  weeklyHours?: string;
  customerBase?: string;
  entrepreneurChannel?: string;
  emergencyFunds?: string;
  familySupport?: string;
  partnerSupport?: string;
  [key: string]: unknown;
}

// ════════════════════════════════════════════════════════════
//   ScoringRule interface
// ════════════════════════════════════════════════════════════

export interface ScoringRule {
  id: string;
  condition: (state: UserProfileState) => boolean;
  action: (state: UserProfileState) => void;
}

// ════════════════════════════════════════════════════════════
//   Dimensions
// ════════════════════════════════════════════════════════════

export interface Dimensions {
  health: number;
  wealth: number;
  social: number;
  mind: number;
  composite: number;
}

// ════════════════════════════════════════════════════════════
//   Audit trail
// ════════════════════════════════════════════════════════════

export interface RuleFiredRecord {
  ruleId: string;
  stateBefore: Readonly<UserProfileState>;
  stateAfter: Readonly<UserProfileState>;
}

export interface EvaluationResult {
  state: UserProfileState;
  dimensions: Dimensions;
  fired: RuleFiredRecord[];
  skipped: string[];
  errored: string[];
  totalRules: number;
  /** Number of default-weight questions that contributed in Pass 1. */
  defaultsApplied: number;
}

// ════════════════════════════════════════════════════════════
//   Helpers
// ════════════════════════════════════════════════════════════

function deepCopy<T>(obj: T): T {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function snapshot(state: UserProfileState): Readonly<UserProfileState> {
  return Object.freeze(deepCopy(state));
}

// ════════════════════════════════════════════════════════════
//   Dimension extraction constants
// ════════════════════════════════════════════════════════════

const COMPOSITE_WEIGHTS: Record<Dimension, number> = {
  health: 0.30,
  wealth: 0.25,
  social: 0.20,
  mind:   0.25,
};

const DIMENSION_FIELDS: Record<Dimension, string[]> = {
  health: [
    '_healthScore',
    '_healthBmi',
    '_healthVision',
    '_healthColorBlindness',
    '_healthOverall',
    '_healthDining',
    '_healthBurnoutPenalty',
  ],
  wealth: [
    '_wealthScore',
    '_wealthHousing',
    '_wealthBaseline',
    '_wealthResilience',
    '_wealthBusiness',
    '_wealthAddictionCap',
  ],
  social: [
    '_socialScore',
    '_socialRelationship',
    '_socialSiblings',
    '_socialChildcare',
    '_socialParenting',
  ],
  mind: [
    '_mindScore',
    '_mindAddictions',
    '_mindGrowth',
    '_mindEducation',
    '_mindLanguage',
    '_mindTravel',
    '_mindProfession',
    '_mindTcm',
    '_mindInfoLiteracy',
    '_mindCriminal',
  ],
};

/** Starting baseline per dimension (average human = 60). */
const DIMENSION_BASELINES: Record<Dimension, number> = {
  health: 60,
  wealth: 60,
  social: 60,
  mind:   60,
};

/** Absolute ceiling per dimension (SSR god-tier zone). */
const DIMENSION_CAP = 150;

// ════════════════════════════════════════════════════════════
//   extractDimensions — baseline + fields + clamp [0, 150]
// ════════════════════════════════════════════════════════════

function extractDimensions(state: UserProfileState): Dimensions {
  const dims: Record<Dimension, number> = {
    health: 0,
    wealth: 0,
    social: 0,
    mind: 0,
  };

  for (const dim of Object.keys(DIMENSION_FIELDS) as Dimension[]) {
    let sum = DIMENSION_BASELINES[dim];
    for (const field of DIMENSION_FIELDS[dim]) {
      const val = (state as Record<string, unknown>)[field];
      if (typeof val === 'number' && isFinite(val)) {
        sum += val;
      }
    }
    dims[dim] = clamp(Math.round(sum), 0, DIMENSION_CAP);
  }

  const composite = clamp(
    Math.round(
      dims.health * COMPOSITE_WEIGHTS.health +
      dims.wealth * COMPOSITE_WEIGHTS.wealth +
      dims.social * COMPOSITE_WEIGHTS.social +
      dims.mind   * COMPOSITE_WEIGHTS.mind
    ),
    0,
    DIMENSION_CAP,
  );

  return {
    health: dims.health,
    wealth: dims.wealth,
    social: dims.social,
    mind:   dims.mind,
    composite,
  };
}

// ════════════════════════════════════════════════════════════
//   evaluateRules — Dual-Track entry point
// ════════════════════════════════════════════════════════════

/**
 * Dual-Track scoring pipeline.
 *
 * Pass 1 — Base Calculation:
 *   Apply defaultWeights for every raw answer on state.
 *   Writes simple +/- deltas to _dimensionScore fields.
 *   Questions without a complex rule still contribute.
 *
 * Pass 2 — Rule Overrides & Complex Math:
 *   Run ScoringRules in order.  Each rule reads state
 *   (including Pass 1 contributions) and writes/overwrites
 *   dimension fields.  Complex rules act as modifiers on
 *   top of the base calculation.
 *
 * Final — Extract dimensions (baseline 60 + all field sums),
 *   clamp each to [0, 150], compute weighted composite.
 */
export function evaluateRules(
  initialState: UserProfileState,
  rules: ScoringRule[],
): EvaluationResult {

  // ── Deep copy to protect caller ──
  const state = deepCopy(initialState);

  // ══════════════════════════════════════════════════════════
  //   PASS 1: Default Weights (base calculation)
  //
  //   Snapshot dimension fields BEFORE and AFTER so the
  //   interceptor can compute exact deltas to refund.
  // ══════════════════════════════════════════════════════════

  let defaultsApplied = 0;

  // Snapshot all _ fields before Pass 1
  const prePass1: Record<string, number> = {};
  for (const k of Object.keys(state as Record<string, unknown>)) {
    if (k.startsWith('_')) {
      prePass1[k] = (state as Record<string, unknown>)[k] as number ?? 0;
    }
  }

  try {
    applyDefaultWeights(state as Record<string, any>);
  } catch (e) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[RuleEngine] Pass 1 (defaultWeights) threw:', e);
    }
  }

  // Snapshot after Pass 1 — compute per-field deltas from defaults
  const pass1Deltas: Record<string, number> = {};
  for (const k of Object.keys(state as Record<string, unknown>)) {
    if (k.startsWith('_')) {
      const before = prePass1[k] ?? 0;
      const after = (state as Record<string, unknown>)[k] as number ?? 0;
      const delta = after - before;
      if (delta !== 0) {
        pass1Deltas[k] = delta;
        defaultsApplied++;
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  //   PASS 2: Complex Rule Overrides
  // ══════════════════════════════════════════════════════════

  // Snapshot before Pass 2 for rule-level delta tracking
  const prePass2: Record<string, number> = {};
  for (const k of Object.keys(state as Record<string, unknown>)) {
    if (k.startsWith('_')) {
      prePass2[k] = (state as Record<string, unknown>)[k] as number ?? 0;
    }
  }

  const fired: RuleFiredRecord[] = [];
  const skipped: string[] = [];
  const errored: string[] = [];

  for (const rule of rules) {
    let applies: boolean;
    try {
      applies = rule.condition(state);
    } catch (e) {
      errored.push(rule.id);
      if (typeof console !== 'undefined' && console.error) {
        console.error(`[RuleEngine] condition threw for '${rule.id}':`, e);
      }
      continue;
    }

    if (!applies) {
      skipped.push(rule.id);
      continue;
    }

    const before = snapshot(state);

    try {
      rule.action(state);
    } catch (e) {
      Object.keys(state).forEach(k => delete (state as Record<string, unknown>)[k]);
      Object.assign(state, deepCopy(before));
      errored.push(rule.id);
      if (typeof console !== 'undefined' && console.error) {
        console.error(`[RuleEngine] action threw for '${rule.id}':`, e);
      }
      continue;
    }

    const after = snapshot(state);
    fired.push({ ruleId: rule.id, stateBefore: before, stateAfter: after });
  }

  // Compute Pass 2 deltas
  const pass2Deltas: Record<string, number> = {};
  for (const k of Object.keys(state as Record<string, unknown>)) {
    if (k.startsWith('_')) {
      const before = prePass2[k] ?? 0;
      const after = (state as Record<string, unknown>)[k] as number ?? 0;
      const delta = after - before;
      if (delta !== 0) pass2Deltas[k] = delta;
    }
  }

  // ══════════════════════════════════════════════════════════
  //   PASS 3: Trait Interceptor — Refund & Resolve
  //
  //   Generic loop: for each active trait, check the conflict
  //   matrix.  If a rule grants immunity/resistance to a field,
  //   compute how much was deducted in Pass 1 + Pass 2, and
  //   refund the appropriate amount.
  //
  //   Then apply amplifications, floors, and caps.
  //
  //   This is NOT hardcoded per trait — it reads the matrix.
  // ══════════════════════════════════════════════════════════

  const traits = (state.traits instanceof Set) ? state.traits as Set<string> : new Set<string>();

  if (traits.size > 0) {
    try {
      // Merge Pass 1 + Pass 2 deltas for refund calculation
      const allDeltas: Record<string, number> = {};
      for (const k of new Set([...Object.keys(pass1Deltas), ...Object.keys(pass2Deltas)])) {
        allDeltas[k] = (pass1Deltas[k] ?? 0) + (pass2Deltas[k] ?? 0);
      }

      resolveConflicts(state as Record<string, any>, traits);

      // Refund check: for fields where resolveConflicts zeroed a
      // negative value, the refund already happened inside
      // resolveConflicts (it sets the field to 0, which effectively
      // refunds the deduction).  No additional action needed — the
      // matrix-driven resolver handles immunity, resistance,
      // amplification, floors, and caps generically.

    } catch (e) {
      if (typeof console !== 'undefined' && console.error) {
        console.error('[RuleEngine] Pass 3 (interceptor) threw:', e);
      }
    }
  }

  // ══════════════════════════════════════════════════════════
  //   FINAL: Extract dimensions, apply floors, clamp [0, 150]
  // ══════════════════════════════════════════════════════════

  const dimensions = extractDimensions(state);

  // Apply trait-based floors (set by conflict resolver)
  for (const dim of ['health', 'wealth', 'social', 'mind'] as Dimension[]) {
    const floorVal = (state as Record<string, any>)['_' + dim + 'Floor'];
    if (typeof floorVal === 'number' && floorVal > dimensions[dim]) {
      dimensions[dim] = Math.min(floorVal, DIMENSION_CAP);
    }
  }

  // Recompute composite after floor adjustments
  dimensions.composite = Math.min(DIMENSION_CAP, Math.max(0, Math.round(
    dimensions.health * COMPOSITE_WEIGHTS.health +
    dimensions.wealth * COMPOSITE_WEIGHTS.wealth +
    dimensions.social * COMPOSITE_WEIGHTS.social +
    dimensions.mind   * COMPOSITE_WEIGHTS.mind
  )));

  return {
    state,
    dimensions,
    fired,
    skipped,
    errored,
    totalRules: rules.length,
    defaultsApplied,
  };
}
