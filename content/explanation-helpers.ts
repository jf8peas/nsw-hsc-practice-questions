import type { AnswerSet, Question } from "@/lib/types";

// ANSWER KEY helper — import it only from a unit's answers.ts, never from a client component.
//
// Wrong-option explanations (spec 002 FR-039): written next to the answer key, one for each
// wrong option of a multiple-choice question. Options are shuffled per attempt, so the key
// stores them against the option's TEXT. To keep a unit's explanations readable, each is
// written against the START of the option's text; this resolves it to the full text and fails
// loudly (at load, so `npm run validate` and the build fail) if the start matches no option,
// more than one option, or the correct answer.

/** `{ 12: [["The start of a wrong option", "Why it is wrong."], ...] }` — 12 is question m12. */
export type ExplanationTable = Record<number, Array<[start: string, explanation: string]>>;

/**
 * The number of digits in this unit's question ids. Most units use two digits ("m01"); a unit
 * with more than 99 questions (e.g. y12-physics-advanced-mechanics, m001–m180) passes 3.
 */
const pad = (n: number, width: number) => String(n).padStart(width, "0");

export function withWrongExplanations(
  answers: AnswerSet,
  questions: Question[],
  unitId: string,
  table: ExplanationTable,
  width = 2,
): AnswerSet {
  const out: AnswerSet = { ...answers };
  for (const [number, entries] of Object.entries(table)) {
    const id = `${unitId}.m${pad(Number(number), width)}`;
    const question = questions.find((q) => q.id === id);
    const key = answers[id];
    if (!question || question.type !== "mc" || !key) {
      throw new Error(`${id}: explanations given for a question that is not a multiple-choice question of ${unitId}`);
    }
    const resolved: Record<string, string> = {};
    for (const [start, explanation] of entries) {
      // Prefer an exact match (e.g. the option "F" when "F/4" is also present), otherwise the
      // start of the option's text.
      const exact = question.options.filter((option) => option === start);
      const matches = exact.length === 1 ? exact : question.options.filter((option) => option.startsWith(start));
      if (matches.length !== 1) {
        throw new Error(`${id}: "${start}" matches ${matches.length} options (it must match exactly one)`);
      }
      const option = matches[0];
      if (option === key.correctText) throw new Error(`${id}: "${start}" is the correct option; explain wrong options only`);
      if (option in resolved) throw new Error(`${id}: two explanations for "${option}"`);
      resolved[option] = explanation.trim();
    }
    out[id] = { ...key, wrongExplanations: resolved };
  }
  return out;
}
