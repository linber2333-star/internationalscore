/* ============================================================
 * scoring-engine.d.ts
 *
 * Type contract for the LifeScore scoring architecture.
 *
 * This file is the single source of truth for the shape of:
 *   1. UserProfileState — the global state object
 *   2. Action — the dispatch payload that mutates state
 *   3. Rule + RuleEngine — the decoupled scoring layer
 *   4. ScoreResult — the final output shape
 *
 * The vanilla JS implementation in scoring-engine.js implements
 * these interfaces at runtime.  Editors with TypeScript language
 * services will type-check JS files that reference these types
 * via JSDoc /// imports.
 * ============================================================ */

// ════════════════════════════════════════════════════════════
//   1. UserProfileState — facts about the user, no scores
// ════════════════════════════════════════════════════════════

/**
 * The four core dimensions all scores roll up into.
 * Every Rule contributes to exactly one dimension.
 */
export type Dimension = 'health' | 'wealth' | 'social' | 'mind';

/**
 * Discrete enumerations for fields with bounded vocabularies.
 * Strings are used (not ints) so the state is self-describing
 * in a debugger and serializes cleanly to JSON.
 */
export type AgeRange =
  | 'under_18'
  | '18_25'
  | '26_35'
  | '36_45'
  | '46_55'
  | '56_65'
  | '66_75'
  | '76_85'
  | '86_100'
  | 'over_100';

export type Gender = 'male' | 'female' | 'unspecified';

export type PrimaryStatus =
  | 'student'
  | 'employed'
  | 'entrepreneur'
  | 'unemployed'
  | 'retired'
  | 'critically_ill'
  | 'post_accident'
  | 'restricted_mobility'
  | 'caregiver';

export type HousingTier =
  | 'manor'              // T1: detached estate
  | 'luxury_residence'   // T2
  | 'self_owned'         // T3
  | 'family_property'    // T4: parents'/independent rental/shared w/ acquaintances
  | 'shared_strangers'   // T5
  | 'single_dorm'        // T6
  | 'multi_dorm'         // T7: incl. relatives' home, hospital ward
  | 'tent'               // T8
  | 'street'             // T9: homeless
  | 'unspecified';

export type RelationshipStatus =
  | 'never_dated'
  | 'dating'
  | 'previously_dated'
  | 'married_happy'
  | 'married_neutral'
  | 'married_collapsing'
  | 'cheated_hidden'
  | 'cheated_caught'
  | 'partner_cheated'
  | 'divorced'
  | 'remarried'
  | 'widowed'
  | 'unspecified';

export type SiblingRelation =
  | 'very_close'
  | 'friendly'
  | 'estranged'
  | 'only_child'
  | 'hostile'
  | 'unspecified';

export type DiningPriority =
  | 'health_balance'
  | 'taste'
  | 'price'
  | 'unspecified';

export type TcmAttitude =
  | 'staunch_supporter'
  | 'open_minded'
  | 'skeptical_respectful'
  | 'strongly_opposed'
  | 'unspecified';

/**
 * Categorical bands for continuous quantities. Bands let rules
 * pattern-match without dealing with raw numbers — but we keep
 * the raw value too for rules that need exact thresholds.
 */
export type SavingsBand =
  | 'net_debt'
  | 'paycheck_to_paycheck'
  | 'low'
  | 'moderate'
  | 'healthy'
  | 'abundant'
  | 'unspecified';

export type AddictionLevel =
  | 'none'
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'unspecified';

/**
 * The complete user profile.  Every field is OPTIONAL — the state
 * starts empty and fills in as the user answers questions.
 *
 * Convention: never mutate this object directly.  Always go through
 * the reducer via dispatch(action).
 */
export interface UserProfileState {
  // ── Demographic & Physical ──
  ageRange?: AgeRange;
  ageYearsApprox?: number;        // numeric centerpoint of band, for math
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  primaryStatus?: PrimaryStatus;

  // ── Health ──
  visionPenalty?: number;          // 0 to -5; rules add directly
  colorBlindnessPenalty?: number;  // 0 to -5
  overallHealth?: 'excellent' | 'good' | 'subhealthy' | 'chronic' | 'severe';
  hasChronicCondition?: boolean;
  isCriticallyIll?: boolean;       // derived from primaryStatus, exposed for rule clarity
  isMobilityRestricted?: boolean;  // derived likewise
  addictionLevel?: AddictionLevel;
  mentalHealthScore?: number;      // 0–100 normalized
  sleepQuality?: 'excellent' | 'good' | 'poor' | 'severe';

  // ── Wealth ──
  housing?: HousingTier;
  monthlySavings?: number;         // raw currency value
  savingsBand?: SavingsBand;       // categorical bucket of monthlySavings
  hasInsurance?: boolean;
  monthlyIncome?: number;
  diningPriority?: DiningPriority;

  // ── Social ──
  relationship?: RelationshipStatus;
  hasChildren?: boolean;
  childcareEffortLevel?: 1 | 2 | 3 | 4 | 5;       // 1=minimal, 5=maximal
  parentingStyle?: 'guiding' | 'democratic' | 'protective' | 'authoritarian' | 'permissive' | 'controlling';
  siblingRelation?: SiblingRelation;
  socialCircleQuality?: 'rich' | 'adequate' | 'thin' | 'isolated';

  // ── Mind / Identity ──
  educationLevel?: 'highschool_below' | 'vocational' | 'bachelor' | 'master_above';
  foreignLanguageLevel?: 0 | 1 | 2 | 3 | 4 | 5;
  travelExperience?: 'global' | 'extensive' | 'moderate' | 'limited' | 'none';
  hasOverseasExperience?: boolean;
  professionalSkillTier?: 1 | 2 | 3 | 4 | 0;       // 0 = none of the above
  tcmAttitude?: TcmAttitude;
  informationLiteracy?: 'high' | 'medium_high' | 'medium' | 'low' | 'none';
  criminalRecord?: 'clean' | 'minor' | 'undetected_serious' | 'minor_with_impact' | 'major';

  // ── Meta ──
  lastUpdatedAt?: number;          // unix ms — for debugging/replay
}

// ════════════════════════════════════════════════════════════
//   2. Action — the dispatch payload
// ════════════════════════════════════════════════════════════

/**
 * Actions are flat, serializable objects.  Each action type maps
 * to exactly one reducer case.  This list is open — add new types
 * as new questions appear, but never reuse a type for two different
 * meanings.
 */
export type Action =
  | { type: 'SET_AGE_RANGE'; payload: AgeRange }
  | { type: 'SET_GENDER'; payload: Gender }
  | { type: 'SET_HEIGHT'; payload: number }
  | { type: 'SET_WEIGHT'; payload: number }
  | { type: 'SET_PRIMARY_STATUS'; payload: PrimaryStatus }
  | { type: 'SET_VISION_PENALTY'; payload: number }
  | { type: 'SET_COLOR_BLINDNESS_PENALTY'; payload: number }
  | { type: 'SET_OVERALL_HEALTH'; payload: NonNullable<UserProfileState['overallHealth']> }
  | { type: 'SET_ADDICTION_LEVEL'; payload: AddictionLevel }
  | { type: 'SET_HOUSING'; payload: HousingTier }
  | { type: 'SET_MONTHLY_SAVINGS'; payload: number }
  | { type: 'SET_SAVINGS_BAND'; payload: SavingsBand }
  | { type: 'SET_DINING_PRIORITY'; payload: DiningPriority }
  | { type: 'SET_RELATIONSHIP'; payload: RelationshipStatus }
  | { type: 'SET_HAS_CHILDREN'; payload: boolean }
  | { type: 'SET_CHILDCARE_EFFORT'; payload: 1 | 2 | 3 | 4 | 5 }
  | { type: 'SET_PARENTING_STYLE'; payload: NonNullable<UserProfileState['parentingStyle']> }
  | { type: 'SET_SIBLING_RELATION'; payload: SiblingRelation }
  | { type: 'SET_EDUCATION'; payload: NonNullable<UserProfileState['educationLevel']> }
  | { type: 'SET_FOREIGN_LANGUAGE'; payload: 0 | 1 | 2 | 3 | 4 | 5 }
  | { type: 'SET_TRAVEL_EXPERIENCE'; payload: NonNullable<UserProfileState['travelExperience']> }
  | { type: 'SET_PROFESSIONAL_SKILL_TIER'; payload: 0 | 1 | 2 | 3 | 4 }
  | { type: 'SET_TCM_ATTITUDE'; payload: TcmAttitude }
  | { type: 'SET_INFO_LITERACY'; payload: NonNullable<UserProfileState['informationLiteracy']> }
  | { type: 'SET_CRIMINAL_RECORD'; payload: NonNullable<UserProfileState['criminalRecord']> }
  | { type: 'PATCH'; payload: Partial<UserProfileState> }   // escape hatch for compound updates
  | { type: 'RESET' };

/**
 * The reducer signature. Pure function. Same input → same output.
 * Never mutates `state`; always returns a new object.
 */
export type Reducer = (state: UserProfileState, action: Action) => UserProfileState;

// ════════════════════════════════════════════════════════════
//   3. Store — minimal observable
// ════════════════════════════════════════════════════════════

export type Listener = (state: UserProfileState) => void;
export type Unsubscribe = () => void;

export interface Store {
  getState(): UserProfileState;
  dispatch(action: Action): void;
  subscribe(listener: Listener): Unsubscribe;
}

// ════════════════════════════════════════════════════════════
//   4. Rule Engine — the decoupled scoring layer
// ════════════════════════════════════════════════════════════

/**
 * A Rule is a pure function that inspects the state and returns
 * either a contribution or null (if it doesn't apply).
 *
 * Rules are completely decoupled from questions.  A rule never
 * knows which question produced a state field — it only knows
 * the field exists and what to do with it.
 */
export interface RuleContribution {
  /** Which dimension this rule contributes to. */
  dimension: Dimension;
  /** Signed point delta, before global modifiers. */
  delta: number;
  /** Stable identifier — used for breakdown / debugging. */
  ruleId: string;
  /** Human-readable explanation, shown in the analysis report. */
  reason: string;
}

export interface Rule {
  /** Unique ID. Stable across versions. */
  id: string;
  /** Which dimension this rule belongs to (used for grouping in UI). */
  dimension: Dimension;
  /**
   * Optional priority (default 0).  Rules run in priority order so
   * dependent rules can rely on earlier ones already having fired.
   * Higher numbers run later. Most rules don't need this.
   */
  priority?: number;
  /**
   * Cheap predicate to short-circuit before evaluation.
   * Return false to skip this rule entirely.
   */
  appliesTo(state: UserProfileState): boolean;
  /**
   * Compute the contribution.  Must be pure.  Return null to
   * indicate "applies but contributes nothing this time".
   */
  evaluate(state: UserProfileState, ctx: RuleContext): RuleContribution | null;
}

/**
 * Context passed to every rule's evaluate().  Lets a rule peek at
 * earlier rule outputs (for cross-rule logic like "if savings rule
 * said HIGH and there are children, add a bonus") without coupling
 * to specific rule implementations.
 */
export interface RuleContext {
  /** Contributions accumulated from rules that ran earlier. */
  prior: RuleContribution[];
  /**
   * Look up an earlier rule's contribution by ID.
   * Returns null if it didn't fire or hasn't run yet.
   */
  prevById(ruleId: string): RuleContribution | null;
}

/**
 * Modifiers run AFTER all rules have contributed.  They operate on
 * the aggregated dimension scores or the final composite — useful
 * for things like the "critically ill → ×0.7" multiplier or the
 * "age 90+ → +20" longevity bonus, neither of which can be
 * expressed cleanly as a per-dimension rule.
 */
export interface FinalScoreModifier {
  id: string;
  /** Higher priority runs later. Default 0. */
  priority?: number;
  appliesTo(state: UserProfileState, scores: DimensionScores): boolean;
  /**
   * Returns the new scores object.  Pure — does not mutate the
   * input.  Modifiers can return a new composite, new dimension
   * scores, or both.
   */
  apply(state: UserProfileState, scores: DimensionScores): DimensionScores;
}

export interface DimensionScores {
  health: number;
  wealth: number;
  social: number;
  mind: number;
  /** Weighted composite, computed from the four dimensions. */
  composite: number;
}

/**
 * The engine itself.  You register rules and modifiers up-front,
 * then call .compute(state) any time to get the latest scores.
 * Re-running compute() is cheap because rules are pure.
 */
export interface RuleEngine {
  registerRule(rule: Rule): void;
  registerModifier(modifier: FinalScoreModifier): void;
  /**
   * Configure how dimensions roll up into the composite.
   * Weights should sum to 1.0 but the engine normalizes anyway.
   */
  setWeights(weights: Record<Dimension, number>): void;
  /**
   * Run the full pipeline:
   *   1. Filter rules with appliesTo()
   *   2. Sort by priority
   *   3. Evaluate each, accumulating contributions
   *   4. Aggregate per-dimension totals
   *   5. Compute weighted composite
   *   6. Apply final-score modifiers in priority order
   *   7. Return ScoreResult
   */
  compute(state: UserProfileState): ScoreResult;
}

export interface ScoreResult {
  /** Final dimension and composite scores after all modifiers. */
  scores: DimensionScores;
  /** Every rule contribution that fired, in evaluation order. */
  contributions: RuleContribution[];
  /** Which modifiers ran, for the analysis breakdown. */
  modifiersApplied: string[];
  /** Snapshot of the state used for this computation. */
  stateSnapshot: UserProfileState;
}
