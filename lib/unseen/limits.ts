// Submission rules of the unseen-text unit (spec 008 FR-010, FR-011), shared by the word meter in
// the browser and the grade route on the server so a student's count is the server's count. PUBLIC,
// pure, no I/O. Words are counted by lib/wordcount.ts.

/** Under this many words Submit is disabled. */
export const MIN_WORDS = 20;

/**
 * The suggested length for a question whose answer lines cannot be counted: the median for its mark
 * value across the papers whose lines can be counted (FR-011). The 2 to 6 mark values are the medians the
 * review report counts over the bank (2 marks: 1 question, 3: 47, 4: 57, 5: 10, 6: 1, so 2 and 6 rest on one
 * paper each); 1 mark is extrapolated at 72 words until counted data exists. scripts/unseen-report.ts
 * fails when a value that has counted data differs from this table.
 */
export const MEDIAN_WORDS: Record<number, number> = { 1: 72, 2: 216, 3: 192, 4: 276, 5: 402, 6: 684 };

export interface Limits {
  min: number;
  suggested: number;
  /** The most words that can be submitted: 20% over the suggested length, rounded down. */
  max: number;
}

export function limitsFor(suggestedWords: number): Limits {
  // integer arithmetic so 20% never picks up a floating-point error
  return { min: MIN_WORDS, suggested: suggestedWords, max: Math.floor((suggestedWords * 12) / 10) };
}

/**
 * short: under the minimum (Submit disabled). ok: within the suggested length. warn: over the
 * suggested length but within 20% (a warning, Submit enabled). over: more than 20% over (Submit
 * disabled until the answer is cut).
 */
export type LengthState = "short" | "ok" | "warn" | "over";

export function lengthState(words: number, suggestedWords: number): LengthState {
  const { min, suggested, max } = limitsFor(suggestedWords);
  if (words < min) return "short";
  if (words > max) return "over";
  if (words > suggested) return "warn";
  return "ok";
}

/** The note shown under the meter for a state, or null. */
export function lengthNote(words: number, suggestedWords: number): string | null {
  const state = lengthState(words, suggestedWords);
  const { suggested, max } = limitsFor(suggestedWords);
  if (state === "short") return `Write at least ${MIN_WORDS} words before you submit.`;
  if (state === "warn") return `About ${words - suggested} words over the suggested length. Tighten it if you can.`;
  if (state === "over") return `${words - max} words over the limit. Cut it to submit.`;
  return null;
}
