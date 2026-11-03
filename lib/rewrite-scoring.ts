/**
 * Pure scoring for sentence-rewrite questions (spec 005/006).
 *
 * Rubric (2026-11-03 scoring fix, revised):
 * - Each required term used correctly contributes to the raw score.
 * - Criterion A (meaning / cause-and-effect kept) and criterion C (≤25 words, no padding) each
 *   cost one mark when lost: raw = termsUsed - (A && C ? 0 : 1), floored at 0.
 * - Phase 1: every term used AND A AND C → totalMarks; otherwise min(raw, retryCap - 1).
 * - Phase 2 (retry): min(raw, retryCap), where retryCap = totalMarks - 1.
 * - Final = max(firstTry, retry), computed by the caller from the two phases' scores.
 *
 * Invariant: a partial first try (not every term used) always scores below the retry cap. This
 * holds by construction because a non-perfect phase 1 is capped at retryCap - 1 = totalMarks - 2,
 * which is strictly below retryCap = totalMarks - 1. The question bank is checked against this in
 * tests/rewrite-scoring.test.ts.
 */

export interface RewriteScoreInput {
  /** The question's total marks (maxMarks). */
  totalMarks: number;
  /** The number of required target terms. */
  termCount: number;
  /** How many target terms were used correctly in this phase. */
  termsUsed: number;
  /** Criterion A: the meaning and cause-and-effect of the original are kept and correct. */
  criterionA: boolean;
  /** Criterion C: the sentence is concise (≤25 words, no padding). */
  criterionC: boolean;
  /** The phase being scored: 1 (first try) or 2 (retry). */
  phase: 1 | 2;
}

/** The retry cap for a question: totalMarks - 1. */
export function rewriteRetryCap(totalMarks: number): number {
  return totalMarks - 1;
}

/** The score for a single phase under the rubric above. */
export function rewriteScore(input: RewriteScoreInput): number {
  const { totalMarks, termCount, termsUsed, criterionA, criterionC, phase } = input;
  const retryCap = rewriteRetryCap(totalMarks);
  const raw = Math.max(0, termsUsed - (criterionA && criterionC ? 0 : 1));
  if (phase === 1) {
    // termCount 0 can never earn the first-try full mark (0-of-0 terms is not "all terms used")
    const allGood = termCount > 0 && termsUsed >= termCount && criterionA && criterionC;
    return allGood ? totalMarks : Math.min(raw, retryCap - 1);
  }
  return Math.min(raw, retryCap);
}