/* ============================================================
 * calculateGrowthMultiplier.ts
 *
 * Pure scoring helper that models the compound effect of two
 * cognitive habits on long-term skill acquisition and career
 * trajectory:
 *
 *   1. Consistency / persistence  (from QKD7)
 *   2. Information quality         (from QKD15)
 *
 * The insight: talent and opportunity matter, but two meta-skills
 * sit underneath everything else — the ability to *stick with*
 * something long enough for compounding to kick in, and the
 * ability to *filter signal from noise* so you're compounding
 * in the right direction.  Someone with iron discipline but
 * garbage information sources will grind hard on the wrong
 * things.  Someone with superb information habits but zero
 * follow-through will know exactly what to do and never do it.
 *
 * The multiplier ranges from 0.70 (worst combination) to 1.50
 * (best combination).  It is designed to be applied by the Rule
 * Engine as a scaling factor on any future skill-acquisition or
 * career-promotion points:
 *
 *   E.registerModifier({
 *     id: 'growth_multiplier',
 *     dimension: 'modifier',
 *     priority: 30,   // after longevity, before illness
 *     appliesTo: (s) => s.consistencyLevel != null
 *                     && s.informationQuality != null,
 *     apply: (state, scores) => {
 *       const m = calculateGrowthMultiplier(
 *         state.consistencyLevel,
 *         state.informationQuality,
 *       );
 *       const next = { ...scores };
 *       // Scale mind dimension (skill/career proxy)
 *       next.mind = Math.round(scores.mind * m.multiplier);
 *       return next;
 *     },
 *   });
 *
 * No external dependencies.  No I/O.  Same input → same output.
 * ============================================================ */

// ════════════════════════════════════════════════════════════
//   Configuration — every tunable lives here
// ════════════════════════════════════════════════════════════

/**
 * Consistency levels — mapped from QKD7 option indices:
 *
 *   QKD7 option 0 → 'iron_discipline'
 *     "轻松，我有钢铁般的自律，目标成为不可妥协的习惯。"
 *     Iron discipline.  Can sustain effort for 6+ months without
 *     external reinforcement.  This is the rarest and most
 *     valuable trait — it turns any skill into compounding returns.
 *
 *   QKD7 option 1 → 'consistent_with_feedback'
 *     "通常可以，如果能看到正向反馈或结果。"
 *     Consistent when feedback loops are present.  Most functional
 *     adults fall here — they'll stick with something that visibly
 *     works but drop what doesn't show results.
 *
 *   QKD7 option 2 → 'motivation_dependent'
 *     "很少，我依靠动力，但动力消退得很快。"
 *     Motivation-dependent.  Relies on inspiration rather than
 *     systems.  Prone to the "New Year's resolution" pattern:
 *     explosive starts, silent quits after 2–4 weeks.
 *
 *   QKD7 option 3 → 'abandons_quickly'
 *     "从不，每个新计划都在几周内放弃。"
 *     Abandons plans within weeks.  Not necessarily lazy — may be
 *     intelligent and ambitious — but lacks the executive function
 *     or environmental support to sustain effort.  This is the
 *     single biggest bottleneck to growth.
 */
type ConsistencyLevel =
  | 'iron_discipline'
  | 'consistent_with_feedback'
  | 'motivation_dependent'
  | 'abandons_quickly';

/**
 * Consistency weight — how much this trait contributes to the
 * final multiplier.  Consistency is weighted slightly higher
 * than information quality (60/40 split) because persistence
 * is the harder constraint: you can improve your information
 * sources relatively quickly, but building discipline is a
 * multi-year project.
 */
const CONSISTENCY_WEIGHT = 0.60;

/**
 * Consistency scores on a 0–1 normalized scale.
 *
 * The gap between 'motivation_dependent' (0.30) and
 * 'consistent_with_feedback' (0.70) is deliberately large —
 * this is where the biggest behavioral cliff exists.  People
 * who need motivation to act vs. people who can act without it
 * are in fundamentally different categories of output capacity.
 */
const CONSISTENCY_SCORES: Readonly<Record<ConsistencyLevel, number>> = Object.freeze({
  iron_discipline:          1.00,
  consistent_with_feedback: 0.70,
  motivation_dependent:     0.30,
  abandons_quickly:         0.00,
});

/**
 * Information quality levels — mapped from QKD15 option indices:
 *
 *   QKD15 option 0 → 'high_filtering'
 *     "善于从各种媒体和日常生活中寻找信息，并具备辨别真伪的能力。"
 *     Active multi-source filtering with truth-detection.  The
 *     gold standard — this person won't waste years chasing
 *     bad advice.
 *
 *   QKD15 option 1 → 'multi_perspective'
 *     "能接受来自不同角度的信息——对我来说一个问题有两种不同的声音是正常的。"
 *     Comfortable with information diversity.  Not necessarily
 *     great at filtering, but won't be captured by a single
 *     narrative.  This openness is protective.
 *
 *   QKD15 option 2 → 'cautious_logical'
 *     "对所有信息都非常谨慎，逻辑推理对我来说很重要。"
 *     Logic-first but potentially narrow.  Good at rejecting
 *     nonsense but may also reject valid novel information that
 *     doesn't fit their existing framework.
 *
 *   QKD15 option 3 → 'authority_dependent'
 *     "最可能接受权威认证的信息。"
 *     Relies on credentialed sources.  Decent baseline quality
 *     but vulnerable to institutional blind spots and slow to
 *     adopt contrarian-but-correct positions.
 *
 *   QKD15 option 4 → 'seeing_is_believing'
 *     "眼见为实。"
 *     Empiricist by temperament but limited by direct experience.
 *     Misses everything that can't be personally observed —
 *     which is most of what matters for career and skill growth.
 *
 *   QKD15 option 5 → 'contrarian_bias'
 *     "倾向于相信非官方的说法。"
 *     Anti-authority bias.  Systematically selects for fringe
 *     information.  Occasionally catches things the mainstream
 *     misses, but mostly wastes time on noise.
 *
 *   QKD15 option 6 → 'disengaged'
 *     "从不关心这些，也从来没有想过。"
 *     Informationally disengaged.  Not actively consuming bad
 *     info, but not consuming good info either.  Growth is
 *     essentially random.
 */
type InformationQuality =
  | 'high_filtering'
  | 'multi_perspective'
  | 'cautious_logical'
  | 'authority_dependent'
  | 'seeing_is_believing'
  | 'contrarian_bias'
  | 'disengaged';

/**
 * Information quality weight — the complement of consistency.
 */
const INFO_QUALITY_WEIGHT = 0.40;

/**
 * Information quality scores on a 0–1 normalized scale.
 *
 * 'high_filtering' and 'multi_perspective' are both strong but
 * different: the first is actively analytical, the second is
 * passively open.  Both produce good outcomes, hence both score
 * high (1.0 and 0.85).
 *
 * 'seeing_is_believing' scores low (0.20) despite being a
 * reasonable-sounding heuristic, because in the modern world
 * almost nothing that drives career/skill growth is directly
 * observable — you need second-hand information (books, mentors,
 * data) to make good decisions.
 */
const INFO_QUALITY_SCORES: Readonly<Record<InformationQuality, number>> = Object.freeze({
  high_filtering:       1.00,
  multi_perspective:    0.85,
  cautious_logical:     0.65,
  authority_dependent:  0.45,
  seeing_is_believing:  0.20,
  contrarian_bias:      0.10,
  disengaged:           0.00,
});

/**
 * Output range.  The multiplier maps the [0, 1] composite onto
 * [MIN_MULTIPLIER, MAX_MULTIPLIER].
 *
 * 0.70 at the floor means even the worst combination doesn't
 * wipe out career/skill points entirely — you can still stumble
 * into growth by accident.
 *
 * 1.50 at the ceiling means the best combination gives a 50%
 * bonus — significant but not game-breaking, reflecting the
 * reality that discipline + good info is a powerful amplifier
 * but not a substitute for the underlying skills themselves.
 */
const MIN_MULTIPLIER = 0.70;
const MAX_MULTIPLIER = 1.50;

// ════════════════════════════════════════════════════════════
//   Public types
// ════════════════════════════════════════════════════════════

export interface GrowthMultiplierResult {
  /** Final multiplier in [0.70, 1.50]. */
  multiplier: number;

  /**
   * The normalized composite score in [0, 1] before mapping to
   * the multiplier range.  Useful for the analysis UI to show
   * "your growth potential is at X%".
   */
  compositeScore: number;

  /**
   * Individual normalized scores for each input dimension,
   * before weighting.  Useful for the analysis UI bar charts.
   */
  consistencyScore: number;
  infoQualityScore: number;

  /**
   * Human-readable tier label for the analysis UI:
   *   'exceptional' | 'strong' | 'moderate' | 'limited'
   */
  tier: 'exceptional' | 'strong' | 'moderate' | 'limited';
}

// ════════════════════════════════════════════════════════════
//   Core logic
// ════════════════════════════════════════════════════════════

/**
 * Map the [0, 1] composite score to the output multiplier range.
 * Simple linear interpolation — no curves, because the input
 * scores already encode the non-linear behavioral cliffs.
 */
function scaleToMultiplier(composite: number): number {
  const clamped = Math.max(0, Math.min(1, composite));
  return MIN_MULTIPLIER + (MAX_MULTIPLIER - MIN_MULTIPLIER) * clamped;
}

/**
 * Determine the human-readable tier from the composite score.
 *
 * Thresholds:
 *   ≥ 0.80 → exceptional  (iron discipline + high filtering)
 *   ≥ 0.55 → strong       (good combo, room to improve one axis)
 *   ≥ 0.30 → moderate     (one decent trait compensating for one weak)
 *   < 0.30 → limited      (both traits are weak)
 */
function tierFromComposite(composite: number): GrowthMultiplierResult['tier'] {
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
 * Behavior summary:
 *
 *   consistency             info quality          multiplier   tier
 *   ───────────────────     ──────────────────    ──────────   ────
 *   iron_discipline         high_filtering        1.50         exceptional
 *   iron_discipline         seeing_is_believing   0.96         moderate
 *   consistent_with_fb      multi_perspective     1.23         strong
 *   consistent_with_fb      authority_dependent   1.05         moderate
 *   motivation_dependent    high_filtering        1.02         moderate
 *   motivation_dependent    seeing_is_believing   0.78         limited
 *   abandons_quickly        high_filtering        0.86         limited
 *   abandons_quickly        seeing_is_believing   0.70         limited
 *   abandons_quickly        disengaged            0.70         limited
 *
 * Edge cases:
 *   - undefined / null / unrecognized inputs → { multiplier: 1.0,
 *     compositeScore: 0.5, tier: 'moderate' }  (neutral fallback)
 *
 * @param consistencyLevel    From QKD7 mapping
 * @param informationQuality  From QKD15 mapping
 * @returns  Full result object — never throws, never returns null.
 */
export function calculateGrowthMultiplier(
  consistencyLevel: string | undefined | null,
  informationQuality: string | undefined | null,
): GrowthMultiplierResult {

  // ── Edge case: missing or unrecognized inputs ──
  // Return neutral multiplier (1.0) so the engine never crashes
  // and un-mapped users aren't penalized or rewarded.
  const cScore = (consistencyLevel && CONSISTENCY_SCORES[consistencyLevel as ConsistencyLevel] !== undefined)
    ? CONSISTENCY_SCORES[consistencyLevel as ConsistencyLevel]
    : undefined;

  const iScore = (informationQuality && INFO_QUALITY_SCORES[informationQuality as InformationQuality] !== undefined)
    ? INFO_QUALITY_SCORES[informationQuality as InformationQuality]
    : undefined;

  // If BOTH inputs are missing, return a perfectly neutral result.
  if (cScore === undefined && iScore === undefined) {
    return {
      multiplier: 1.0,
      compositeScore: 0.5,
      consistencyScore: 0.5,
      infoQualityScore: 0.5,
      tier: 'moderate',
    };
  }

  // If only one is missing, use 0.5 (neutral midpoint) for the
  // missing dimension so the present one still has influence.
  const c = cScore !== undefined ? cScore : 0.5;
  const i = iScore !== undefined ? iScore : 0.5;

  // ── Weighted composite ──
  const composite = c * CONSISTENCY_WEIGHT + i * INFO_QUALITY_WEIGHT;

  // ── Map to multiplier ──
  const multiplier = Math.round(scaleToMultiplier(composite) * 100) / 100;

  return {
    multiplier,
    compositeScore: Math.round(composite * 1000) / 1000,
    consistencyScore: c,
    infoQualityScore: i,
    tier: tierFromComposite(composite),
  };
}

// ════════════════════════════════════════════════════════════
//   Convenience: thin wrapper returning just the number
// ════════════════════════════════════════════════════════════

/**
 * Returns only the multiplier for callers that don't need the
 * breakdown.  Identical math, different return shape.
 */
export function getGrowthMultiplier(
  consistencyLevel: string | undefined | null,
  informationQuality: string | undefined | null,
): number {
  return calculateGrowthMultiplier(consistencyLevel, informationQuality).multiplier;
}
