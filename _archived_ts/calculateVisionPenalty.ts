/* ============================================================
 * calculateVisionPenalty.ts
 *
 * Pure scoring helper for the Vision question (QKC4).
 *
 * Replaces the old linear penalty [-1, -2, -3] with a non-linear
 * power-law curve that models the exponential real-world impact
 * difference between mild myopia and severe vision loss.
 *
 * The gap between "no glasses" and "mild myopia" is trivial —
 * corrected by a ¥50 pair of glasses.  But the gap between
 * "severe myopia" and "vision damage affecting daily life" is
 * an order of magnitude worse: it limits careers, mobility,
 * independence, and safety.  A linear scale cannot represent
 * this reality.
 *
 * Formula:  penalty = base × x^γ
 *
 *   base  = 2.5   (scaling constant)
 *   γ     = 1.8   (acceleration exponent)
 *   x     = severity level [0..4]
 *
 * Result is returned as a negative integer (health deduction).
 *
 * Penalty table:
 *
 *   Option                                              Severity   Penalty
 *   ──────────────────────────────────────────────────   ────────   ───────
 *   A  视力完好，无需任何矫正工具                          0         0
 *   B  轻度近视/散光，佩戴眼镜后几乎无影响                 1        -3
 *   C  重度近视/散光，高度依赖眼镜，摘掉后严重模糊         2        -9
 *   D  视力明显受损，即使戴眼镜仍有困难                     3       -18
 *   E  法定失明或接近完全失明                               4       -30
 *
 * The curve: each step hurts roughly 2–3× more than the previous,
 * modelling the compounding loss of capability.
 *
 * Drops into the Rule Engine as:
 *
 *   const penalty = calculateVisionPenalty(state.visionStatus);
 *   state._healthVision = penalty;
 *
 * No external dependencies.  No I/O.  Same input → same output.
 * ============================================================ */

// ════════════════════════════════════════════════════════════
//   Configuration — every tunable lives here
// ════════════════════════════════════════════════════════════

/** Scaling constant for the penalty curve. */
const BASE = 2.5;

/** Acceleration exponent — controls how fast the penalty grows.
 *  1.0 = linear, 2.0 = quadratic, 1.8 = between (spec value). */
const GAMMA = 1.8;

// ════════════════════════════════════════════════════════════
//   Severity mapping
// ════════════════════════════════════════════════════════════

/**
 * Maps vision status strings (CN prefix match) to a severity
 * level from 0 (perfect) to 4 (blind).
 *
 * Supports both:
 *   - Full CN option strings from quick_questions.js
 *   - Engine-dispatched semantic strings
 *   - Raw option index numbers (0–4)
 */
type VisionSeverity = 0 | 1 | 2 | 3 | 4;

/**
 * Known vision status keys and their severity levels.
 *
 * QKC4 options:
 *   opt 0 → '视力完好'           → severity 0  (A: perfect)
 *   opt 1 → '轻度近视/散光'      → severity 1  (B: mild)
 *   opt 2 → '重度近视/散光'      → severity 2  (C: severe myopia)
 *   opt 3 → '视力损伤'           → severity 3  (D: vision damage)
 *   opt 4 → '法定失明'           → severity 4  (E: legally blind)
 *
 * Also accepts semantic engine strings for forward compatibility.
 */
const SEVERITY_MAP: ReadonlyArray<{ prefix: string; severity: VisionSeverity }> = [
  // CN option prefixes (matching quick_questions.js)
  { prefix: '视力完好',       severity: 0 },
  { prefix: '轻度近视',       severity: 1 },
  { prefix: '重度近视',       severity: 2 },
  { prefix: '视力明显受损',   severity: 3 },
  { prefix: '视力损伤',       severity: 3 },  // legacy compat
  { prefix: '法定失明',       severity: 4 },
  // EN semantic keys
  { prefix: 'perfect',        severity: 0 },
  { prefix: 'no_correction',  severity: 0 },
  { prefix: 'mild',           severity: 1 },
  { prefix: 'severe_myopia',  severity: 2 },
  { prefix: 'vision_impaired', severity: 3 },
  { prefix: 'vision_damage',  severity: 3 },  // legacy compat
  { prefix: 'legally_blind',  severity: 4 },
  { prefix: 'near_blind',     severity: 4 },
];

/**
 * Resolve a raw input to a severity level.
 *
 * Accepts:
 *   - Chinese option string (prefix match)
 *   - English semantic key (exact match)
 *   - Numeric index (0–4)
 *   - undefined / null → returns null (no penalty)
 *   - Unrecognized non-empty string → returns severity 1 (mild)
 *     as a conservative fallback, because the user clearly has
 *     some vision concern if they're providing an answer that
 *     doesn't match "perfect".
 */
function resolveSeverity(
  input: string | number | undefined | null,
): VisionSeverity | null {
  if (input === undefined || input === null) return null;

  // Numeric index
  if (typeof input === 'number') {
    if (input >= 0 && input <= 4 && Number.isInteger(input)) {
      return input as VisionSeverity;
    }
    return null;
  }

  // String match
  const trimmed = input.trim();
  if (trimmed === '') return null;

  for (const entry of SEVERITY_MAP) {
    if (trimmed.startsWith(entry.prefix) || trimmed === entry.prefix) {
      return entry.severity;
    }
  }

  // Unrecognized non-empty string → conservative mild assumption
  return 1;
}

// ════════════════════════════════════════════════════════════
//   Public types
// ════════════════════════════════════════════════════════════

export interface VisionPenaltyResult {
  /** Negative health penalty, e.g. 0, -3, -9, -18, -30.
   *  Always ≤ 0. */
  penalty: number;

  /** Severity level used for the calculation (0–4). */
  severity: VisionSeverity;

  /** Raw unrounded penalty before Math.round. */
  rawPenalty: number;
}

// ════════════════════════════════════════════════════════════
//   Public API
// ════════════════════════════════════════════════════════════

/**
 * Calculate the non-linear vision penalty for the Health dimension.
 *
 * @param visionStatus  Raw answer string, semantic key, or option index.
 * @returns             Penalty result, or { penalty: 0 } if unrecognized.
 *
 * Examples:
 *   calculateVisionPenalty('视力完好，无需任何矫正工具。')     → { penalty: 0,   severity: 0 }
 *   calculateVisionPenalty('轻度近视/散光，佩戴眼镜后')       → { penalty: -3,  severity: 1 }
 *   calculateVisionPenalty('重度近视/散光，高度依赖')          → { penalty: -9,  severity: 2 }
 *   calculateVisionPenalty('视力明显受损，即使佩戴眼镜')       → { penalty: -18, severity: 3 }
 *   calculateVisionPenalty('法定失明或接近完全失明')           → { penalty: -30, severity: 4 }
 *   calculateVisionPenalty(4)                                 → { penalty: -30, severity: 4 }
 *   calculateVisionPenalty('some unrecognized text')          → { penalty: -3,  severity: 1 }
 */
export function calculateVisionPenalty(
  visionStatus: string | number | undefined | null,
): VisionPenaltyResult {
  const severity = resolveSeverity(visionStatus);

  // Unrecognized → no penalty
  if (severity === null || severity === 0) {
    return { penalty: 0, severity: 0, rawPenalty: 0 };
  }

  // Power-law curve: penalty = base × x^γ
  const rawPenalty = BASE * Math.pow(severity, GAMMA);
  const penalty = -Math.round(rawPenalty);

  return { penalty, severity, rawPenalty };
}

/**
 * Convenience: returns just the penalty number.
 */
export function getVisionPenalty(
  visionStatus: string | number | undefined | null,
): number {
  return calculateVisionPenalty(visionStatus).penalty;
}
