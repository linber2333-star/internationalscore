/* ============================================================
 * defaultWeights.ts
 *
 * Dual-Track scoring: Default Weight Map for simple questions.
 *
 * Every scorable question that does NOT have a complex rule in
 * rulesConfig.ts gets a simple linear mapping here.  This
 * ensures no question ever contributes 0 points silently.
 *
 * Adding a new question to quick_questions.js?  Just add one
 * entry here — no TypeScript function needed.  If you later
 * need complex math, add a rule to rulesConfig.ts and it will
 * override this default via the dual-track merge.
 *
 * Structure:
 *   questionId → optionIndex → { dimension, score }
 *
 * The engine processes defaults FIRST, then rulesConfig rules
 * run on top.  If a rulesConfig rule writes to the same
 * dimension field, it overwrites the default contribution.
 * ============================================================ */

// ════════════════════════════════════════════════════════════
//   Types
// ════════════════════════════════════════════════════════════

export type Dimension = 'health' | 'wealth' | 'social' | 'mind';

export interface DimensionDelta {
  dimension: Dimension;
  score: number;
}

/**
 * Maps question ID → array of option deltas (indexed by option index).
 * Each option can contribute to one or more dimensions.
 */
export type DefaultWeightMap = Record<string, DimensionDelta[][]>;

// ════════════════════════════════════════════════════════════
//   Section → Dimension mapping
//   basic → health, social → social, identity → mind
// ════════════════════════════════════════════════════════════

/**
 * Helper: create a single-dimension option array from raw scores.
 * Multiplies each raw score by `scale` for the 150-point framework.
 */
function dim(
  dimension: Dimension,
  rawScores: number[],
  scale: number = 1.5,
): DimensionDelta[][] {
  return rawScores.map(s => [{ dimension, score: Math.round(s * scale) }]);
}

/**
 * Helper: create multi-dimension option array.
 */
function multi(
  entries: Array<Array<{ d: Dimension; s: number }>>,
): DimensionDelta[][] {
  return entries.map(opts =>
    opts.map(o => ({ dimension: o.d, score: o.s }))
  );
}

// ════════════════════════════════════════════════════════════
//   Default Weight Map
// ════════════════════════════════════════════════════════════

export const DEFAULT_WEIGHTS: DefaultWeightMap = {

  // ── Student: Academic Stage — NO SCORING per spec ──
  QKA_STAGE: dim('mind', [0, 0, 0, 0], 1.5),
  // All zero — academic stage does not add or deduct points

  // ── Student HS: additional uncovered questions ──
  // QKA_HS6 — Family respects privacy → mind
  QKA_HS6: dim('mind', [4, 3, 1, 0], 1.5),
  // QKA_HS7 — Hobbies allowed → mind
  QKA_HS7: dim('mind', [4, 3, 1, 0], 1.5),
  // QKA_HS8 — Willingness to spend time with family → social
  QKA_HS8: dim('social', [4, 3, 1, 0], 1.5),
  // QKA_HS9 — Sleep deprivation → health
  QKA_HS9: dim('health', [4, 3, 1, 0], 2),
  // [8, 6, 2, 0]
  // QKA_HS10 — Share family life with friends → social
  QKA_HS10: dim('social', [4, 3, 2, 0], 1),

  // ── Student College/Bachelor+ ──
  // QKA_BC6 — Campus social life → social
  QKA_BC6: dim('social', [4, 3, 1, 0], 1.5),

  // ── Student Masters+ ──
  QKA_D1: dim('mind', [4, 3, 1, 0], 1.5),
  QKA_D2: dim('wealth', [4, 3, 1, 0], 1.5),
  QKA_D3: dim('mind', [4, 3, 2, 0], 1.5),

  // ── Unemployed ──
  // QKAD1 — Savings runway → wealth
  QKAD1: dim('wealth', [4, 3, 1, 0], 2),
  // QKAD2 — Regular schedule → health
  QKAD2: dim('health', [4, 2, 0], 2),
  // QKAD3 — Unemployed status type → social
  QKAD3: dim('social', [4, 3, 3, 2, 1, 0, 0, 0], 1.5),

  // ── Retired ──
  // QKAE1 — Pension adequacy → wealth
  QKAE1: dim('wealth', [4, 3, 1, 0], 2),
  // QKAE2 — Physical independence → health
  QKAE2: dim('health', [4, 3, 1, 0], 2),

  // ── Seriously Ill / Post-Accident ──
  QKAF1: dim('mind', [4, 3, 1, 0], 1.5),
  QKAF2: dim('social', [4, 2, 0], 2),
  QKAF3: dim('mind', [4, 3, 1, 0], 1.5),

  // ── Restricted Movement ──
  QKAH1: dim('health', [3, 1, 0], 2),
  QKAH2: dim('mind', [4, 3, 1, 0], 1.5),

  // ── Caregiver ──
  // QKAI1 — Off-duty rest → health
  QKAI1: dim('health', [4, 2, 1, 0], 2),
  // QKAI2 — Additional income → wealth (4 options)
  QKAI2: dim('wealth', [4, 3, 2, 0], 2),

  // ── Relationships (uncovered) ──
  // QKB3 — Sex life satisfaction → social
  QKB3: dim('social', [4, 3, 1, 0], 1),
  // QKB5b — Relationship with children → social
  // 5 options: very_close, good, distant, hostile, too_young (score-equivalent to good)
  QKB5b: dim('social', [4, 3, 1, 0, 3], 1.5),

  // ── Skills & Identity (uncovered) ──
  // QKD2 — Travel experience (two variants share ID) → mind
  QKD2: dim('mind', [4, 3, 1, 0, 1], 1.5),
  // QKD3 — Overseas experience → mind
  QKD3: dim('mind', [4, 3, 2, 2, 1, 1, 0, 0], 1),
  // QKD4 — Education level → mind
  QKD4: dim('mind', [4, 3, 3, 3, 3, 3, 2, 2, 0], 1),

  // ── Traits (uncovered) ──
  // QKT4 — Sense of humor → social
  QKT4: dim('social', [4, 3, 2, 1, 0], 1),
  // QKT5 — Attractiveness → social (hidden from display but still scores)
  QKT5: dim('social', [4, 3, 2, 1, 0], 1),
  // QKT16 — Empathy/EQ → social
  QKT16: dim('social', [4, 3, 2, 1, 0], 1.5),

  // ── Age-specific modules ──
  // QKS56_1 — Chronic condition management (56-75) → health
  QKS56_1: dim('health', [4, 3, 1, 0], 2),
  // QKS56_2 — Retirement transition security (56-75) → wealth
  QKS56_2: dim('wealth', [4, 3, 1, 0], 1.5),
  // QKS56_3 — Social vitality (56-75) → social
  QKS56_3: dim('social', [4, 3, 1, 0], 1.5),
  // QKS76_1 — Functional independence (76-100) → health
  QKS76_1: dim('health', [4, 3, 1, 0], 2),
  // QKS76_2 — Safety & medical continuity (76-100) → health
  QKS76_2: dim('health', [4, 3, 1, 0], 1.5),
  // QKS76_3 — Emotional security (76-100) → mind
  QKS76_3: dim('mind', [4, 3, 1, 0], 1.5),
};

// ════════════════════════════════════════════════════════════
//   Applicator — runs defaults before complex rules
// ════════════════════════════════════════════════════════════

/**
 * Apply default weights to a state object.
 * Reads raw answer indices from state (e.g., state.QKA_HS6 = 0)
 * and writes to the appropriate _dimensionScore fields.
 *
 * Call this BEFORE evaluateRules() so complex rules can override.
 */
export function applyDefaultWeights(
  state: Record<string, any>,
): void {
  for (const [qid, optionDeltas] of Object.entries(DEFAULT_WEIGHTS)) {
    const idx = state[qid];
    if (idx === undefined || idx === null) continue;
    if (typeof idx !== 'number' || idx < 0 || idx >= optionDeltas.length) continue;

    const deltas = optionDeltas[idx];
    if (!deltas) continue;

    for (const delta of deltas) {
      const field = '_' + delta.dimension + 'Score';
      state[field] = (state[field] ?? 0) + delta.score;
    }
  }
}

/**
 * Get the list of question IDs covered by default weights.
 * Useful for diagnostics: any scorable question NOT in this
 * list AND not in rulesConfig is truly scoring 0.
 */
export function getDefaultWeightQuestionIds(): string[] {
  return Object.keys(DEFAULT_WEIGHTS);
}
