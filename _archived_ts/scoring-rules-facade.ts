/* ============================================================
 * scoring-rules-facade.ts
 *
 * A simplified "condition → action" rule interface that sits on
 * top of the existing Rule Engine (scoring-engine.d.ts).
 *
 * The existing engine uses `appliesTo` / `evaluate` and returns
 * immutable `RuleContribution` objects.  That's the right design
 * for the pipeline, but it forces every rule author to think in
 * terms of deltas and dimensions.
 *
 * `ScoringRule` is a higher-level abstraction:
 *
 *   - `condition` answers "should this rule fire?"
 *   - `action` answers "what happens when it fires?" by directly
 *     mutating a `DimensionAccumulator` — the running totals for
 *     each dimension.  This is more intuitive for rule authors
 *     who want to say "add 5 to health" rather than constructing
 *     a RuleContribution object.
 *
 * `evaluateRules()` is the loop that ties it together: it walks
 * the rules in order, checks conditions, runs actions, and
 * returns the final dimension totals plus an audit trail.
 *
 * This file imports types from the engine but has NO runtime
 * dependency on it — it can run standalone for unit testing or
 * be used as a planning layer that feeds into the real engine.
 *
 * Dependencies (types only):
 *   - scoring-engine.d.ts  (UserProfileState, Dimension)
 *   - calculateWealthScore.ts
 *   - estimateBMI.ts
 *   - calculateGrowthMultiplier.ts
 * ============================================================ */

import type {
  UserProfileState as BaseUserProfileState,
  Dimension,
  DimensionScores,
} from './scoring-engine_d';

import type { GrowthMultiplierResult } from './calculateGrowthMultiplier';

/**
 * Extended UserProfileState that includes runtime-only fields
 * added via SIMPLE_SETTERS in scoring-engine.js but not yet
 * declared in the base .d.ts.  These fields exist at runtime;
 * declaring them here keeps the facade type-safe without
 * requiring a .d.ts patch.
 */
interface UserProfileState extends BaseUserProfileState {
  /** Categorical height band, e.g. '170 - 175cm'. Set by QK4m/QK4f. */
  heightRange?: string;
  /** Categorical weight band, e.g. '70 - 85kg（正常/健壮）'. Set by QK5m/QK5f. */
  weightRange?: string;
  /** Consistency/persistence level from QKD7. */
  consistencyLevel?: string;
}

// ════════════════════════════════════════════════════════════
//   1. DimensionAccumulator — mutable running totals
// ════════════════════════════════════════════════════════════

/**
 * Mutable accumulator that `action` functions write to.
 *
 * Each field starts at 0 and rules add or subtract from it.
 * After all rules run, these totals feed into the engine's
 * weighted composite calculation.
 *
 * Why mutable?  Because the alternative — having every action
 * return a new object — creates unnecessary ceremony for rule
 * authors.  The mutability is contained: `evaluateRules` creates
 * a fresh accumulator, passes it through, and freezes the result.
 */
export interface DimensionAccumulator {
  health: number;
  wealth: number;
  social: number;
  mind: number;
}

// ════════════════════════════════════════════════════════════
//   2. ScoringRule — the simplified interface
// ════════════════════════════════════════════════════════════

/**
 * A single scoring rule in the LifeScore system.
 *
 * Design contract:
 *   - `condition` must be CHEAP and PURE — no side effects, no
 *     I/O, no state mutation.  It only reads `state` fields to
 *     decide if the rule is relevant.
 *   - `action` is PURE with respect to external state but MUTATES
 *     the `scores` accumulator.  It should call the appropriate
 *     helper function (estimateBMI, calculateWealthScore, etc.)
 *     and write the result into `scores`.
 *   - Rules are evaluated IN ARRAY ORDER.  If rule B depends on
 *     rule A having already adjusted scores, put A before B.
 *
 * Example:
 * ```ts
 * const bmiRule: ScoringRule = {
 *   id: 'health.bmi',
 *   condition: (state) => !!state.heightRange && !!state.weightRange,
 *   action: (state, scores) => {
 *     const mult = estimateBMI(state.heightRange, state.weightRange, state.gender);
 *     const BASE = 10;
 *     scores.health += Math.round(BASE * mult - BASE);
 *   },
 * };
 * ```
 */
export interface ScoringRule {
  /**
   * Stable unique identifier.  Convention: `dimension.aspect`,
   * e.g. 'health.bmi', 'wealth.dynamic_baseline', 'mind.growth'.
   * Used for audit trails and the analysis breakdown UI.
   */
  id: string;

  /**
   * Predicate: does this rule apply to the current user?
   *
   * Receives the complete user profile state.  Should return
   * `true` if the required input fields are present and valid,
   * `false` otherwise.  When `false`, the rule is skipped
   * entirely — `action` is never called.
   *
   * Must be pure.  Must not throw.  Defensive coding: treat
   * every state field as potentially undefined.
   */
  condition: (state: UserProfileState) => boolean;

  /**
   * Effect: compute and apply this rule's score contribution.
   *
   * Receives:
   *   - `state`: the user profile (read-only by convention)
   *   - `scores`: the mutable dimension accumulator to write to
   *
   * The action should call the relevant helper function(s) and
   * add/subtract the result to/from the appropriate dimension(s)
   * in `scores`.
   *
   * Must not throw.  Must not mutate `state`.  May read `scores`
   * to see contributions from earlier rules.
   */
  action: (state: UserProfileState, scores: DimensionAccumulator) => void;
}

// ════════════════════════════════════════════════════════════
//   3. EvaluationResult — what evaluateRules returns
// ════════════════════════════════════════════════════════════

/**
 * Record of a single rule that fired during evaluation.
 */
export interface RuleFiredRecord {
  /** The rule's id. */
  ruleId: string;
  /** Snapshot of dimension scores BEFORE this rule's action ran. */
  scoresBefore: Readonly<DimensionAccumulator>;
  /** Snapshot of dimension scores AFTER this rule's action ran. */
  scoresAfter: Readonly<DimensionAccumulator>;
  /** Per-dimension delta this rule produced. */
  deltas: Readonly<DimensionAccumulator>;
}

/**
 * Complete result of evaluating a rule set against a user state.
 */
export interface EvaluationResult {
  /** Final dimension totals after all rules have run. */
  scores: Readonly<DimensionAccumulator>;
  /** Ordered list of rules that fired, with before/after snapshots. */
  fired: RuleFiredRecord[];
  /** IDs of rules that were skipped (condition returned false). */
  skipped: string[];
  /** IDs of rules that threw during condition or action (and were safely caught). */
  errored: string[];
  /** Total number of rules evaluated. */
  totalRules: number;
}

// ════════════════════════════════════════════════════════════
//   4. Helper function type imports (for the example rules)
// ════════════════════════════════════════════════════════════

// These are the signatures of our existing helper functions.
// In runtime JS they live on window.LSFn.*; here we declare
// the shapes so the example rules type-check.

declare function estimateBMI(
  heightRange: string | undefined | null,
  weightRange: string | undefined | null,
  gender: string | undefined | null,
): number;

declare function calculateWealthScore(
  ageRange: string | undefined | null,
  savingsLevel: string | undefined | null,
): number;

declare function calculateGrowthMultiplier(
  consistencyLevel: string | undefined | null,
  informationQuality: string | undefined | null,
): GrowthMultiplierResult;

// ════════════════════════════════════════════════════════════
//   5. Example rules — lifeScoringRules
// ════════════════════════════════════════════════════════════

/**
 * Two realistic rules demonstrating the ScoringRule pattern,
 * each using a different helper function from our library.
 *
 * These are production-ready — they match the logic already
 * implemented in scoring-rules.js but expressed through the
 * simplified condition/action interface.
 */
export const lifeScoringRules: ScoringRule[] = [

  // ────────────────────────────────────────────────────────
  //  Rule 1: BMI health adjustment
  //
  //  Uses estimateBMI() to convert categorical height/weight
  //  bands into a health multiplier.  A healthy BMI contributes
  //  ~0 delta (baseline); underweight or obese ranges subtract
  //  up to -5 from the health dimension.
  //
  //  Fires when: both heightRange and weightRange are present.
  //  Dimension: health
  // ────────────────────────────────────────────────────────
  {
    id: 'health.bmi',

    condition: (state: UserProfileState): boolean => {
      // Both categorical ranges must be present — if either is
      // missing the user hasn't answered the relevant questions
      // and we can't estimate BMI.
      return (
        state.heightRange !== undefined &&
        state.heightRange !== null &&
        state.weightRange !== undefined &&
        state.weightRange !== null
      );
    },

    action: (state: UserProfileState, scores: DimensionAccumulator): void => {
      // estimateBMI returns a multiplier in [0.5, 1.0] where 1.0
      // is a healthy BMI.  We convert to a delta around a baseline
      // of 10 points: healthy = 0 delta, obese = -5 delta.
      const BASELINE = 10;
      const multiplier = estimateBMI(
        state.heightRange!,
        state.weightRange!,
        state.gender ?? null,
      );
      scores.health += Math.round(BASELINE * multiplier - BASELINE);
    },
  },

  // ────────────────────────────────────────────────────────
  //  Rule 2: Growth multiplier (cognitive habits)
  //
  //  Uses calculateGrowthMultiplier() to scale the mind
  //  dimension based on persistence (QKD7) and information
  //  filtering quality (QKD15).  The best combination
  //  (iron discipline + high filtering) gives a 1.5× boost;
  //  the worst (abandons quickly + disengaged) applies a
  //  0.7× penalty.
  //
  //  Fires when: at least one of consistencyLevel or
  //              informationLiteracy is present.
  //  Dimension: mind
  // ────────────────────────────────────────────────────────
  {
    id: 'mind.growth',

    condition: (state: UserProfileState): boolean => {
      // Fire if at least one cognitive-habit field is present.
      // calculateGrowthMultiplier handles partial input
      // gracefully (uses 0.5 midpoint for missing dimensions).
      return (
        state.consistencyLevel !== undefined ||
        state.informationLiteracy !== undefined
      );
    },

    action: (state: UserProfileState, scores: DimensionAccumulator): void => {
      const result = calculateGrowthMultiplier(
        state.consistencyLevel,
        state.informationLiteracy,
      );

      // Apply as a multiplier to the current mind accumulator.
      // Best combination (iron discipline + high info literacy)
      // yields ×1.5; worst (abandons quickly + disengaged) ×0.7.
      scores.mind = Math.round(scores.mind * result.multiplier);
    },
  },
];

// ════════════════════════════════════════════════════════════
//   6. evaluateRules — the orchestrator
// ════════════════════════════════════════════════════════════

/**
 * Snapshot a DimensionAccumulator into a frozen copy.
 * Used for before/after audit trail records.
 */
function snapshot(acc: DimensionAccumulator): Readonly<DimensionAccumulator> {
  return Object.freeze({
    health: acc.health,
    wealth: acc.wealth,
    social: acc.social,
    mind: acc.mind,
  });
}

/**
 * Compute per-dimension deltas between two snapshots.
 */
function computeDeltas(
  before: Readonly<DimensionAccumulator>,
  after: Readonly<DimensionAccumulator>,
): Readonly<DimensionAccumulator> {
  return Object.freeze({
    health: after.health - before.health,
    wealth: after.wealth - before.wealth,
    social: after.social - before.social,
    mind: after.mind - before.mind,
  });
}

/**
 * Evaluate an ordered array of ScoringRules against a user's
 * profile state.
 *
 * Pipeline:
 *   1. Create a fresh DimensionAccumulator (all zeros).
 *   2. For each rule in array order:
 *      a. Call `rule.condition(state)`.  If false → skip.
 *      b. Snapshot scores (before).
 *      c. Call `rule.action(state, scores)`.
 *      d. Snapshot scores (after).
 *      e. Record the deltas for the audit trail.
 *   3. Freeze the final scores and return everything.
 *
 * Error handling: if a rule's condition or action throws, the
 * error is caught, the rule is recorded in `errored`, and
 * evaluation continues with the next rule.  A single broken
 * rule should never crash the entire scoring pipeline.
 *
 * @param state  The user's profile — treated as read-only.
 * @param rules  Ordered array of rules to evaluate.
 * @returns      Complete evaluation result with scores, audit
 *               trail, and error records.
 */
export function evaluateRules(
  state: UserProfileState,
  rules: ScoringRule[],
): EvaluationResult {
  const scores: DimensionAccumulator = {
    health: 0,
    wealth: 0,
    social: 0,
    mind: 0,
  };

  const fired: RuleFiredRecord[] = [];
  const skipped: string[] = [];
  const errored: string[] = [];

  for (const rule of rules) {
    // ── Phase 1: condition check ──
    let applies: boolean;
    try {
      applies = rule.condition(state);
    } catch (e) {
      // Condition threw — record and move on.
      errored.push(rule.id);
      if (typeof console !== 'undefined' && console.error) {
        console.error(`[evaluateRules] condition threw for rule '${rule.id}':`, e);
      }
      continue;
    }

    if (!applies) {
      skipped.push(rule.id);
      continue;
    }

    // ── Phase 2: action execution ──
    const before = snapshot(scores);
    try {
      rule.action(state, scores);
    } catch (e) {
      // Action threw — record, restore scores to pre-action
      // state, and move on.  We don't want a broken rule to
      // leave the accumulator in a partially-mutated state.
      scores.health = before.health;
      scores.wealth = before.wealth;
      scores.social = before.social;
      scores.mind = before.mind;
      errored.push(rule.id);
      if (typeof console !== 'undefined' && console.error) {
        console.error(`[evaluateRules] action threw for rule '${rule.id}':`, e);
      }
      continue;
    }
    const after = snapshot(scores);

    fired.push({
      ruleId: rule.id,
      scoresBefore: before,
      scoresAfter: after,
      deltas: computeDeltas(before, after),
    });
  }

  return {
    scores: snapshot(scores),
    fired,
    skipped,
    errored,
    totalRules: rules.length,
  };
}
