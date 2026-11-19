// The draw of the unseen-text unit (spec 008 FR-027, FR-028, research R9): one unanswered question
// per quiz, weighted toward the text forms where the student's average mark is lowest (untried forms
// at top weight) and toward questions tagged with a skill still in "Things I need to know". Pure; the
// random source is injected so a test can enumerate every outcome.

import type { TextForm, UnseenQuestion } from "@/lib/types";

/** A source of random integers in [0, max). Production uses crypto.randomInt. */
export type RandomInt = (max: number) => number;

/** The unit's questions, in bank order. */
export function unseenQuestions(unit: { questions: Array<{ type: string }> }): UnseenQuestion[] {
  return (unit.questions as UnseenQuestion[]).filter((q) => q.type === "unseen");
}

/** The questions the student has no result for. */
export function unansweredOf(questions: readonly UnseenQuestion[], answered: ReadonlySet<string>): UnseenQuestion[] {
  return questions.filter((q) => !answered.has(q.id));
}

/** How many questions of a form the student has answered, and their mean mark as a share of full marks. */
export interface FormStat {
  n: number;
  avg: number;
}

/** `marks`: question id to mark / full marks (0..1) for the questions the student has answered. */
export function formStatsOf(
  questions: readonly UnseenQuestion[],
  formOf: (q: UnseenQuestion) => TextForm | null,
  marks: ReadonlyMap<string, number>,
): Map<TextForm, FormStat> {
  const sums = new Map<TextForm, { n: number; total: number }>();
  for (const q of questions) {
    const form = formOf(q);
    const m = marks.get(q.id);
    if (form === null || m === undefined) continue;
    const cur = sums.get(form) ?? { n: 0, total: 0 };
    sums.set(form, { n: cur.n + 1, total: cur.total + m });
  }
  return new Map([...sums].map(([form, v]) => [form, { n: v.n, avg: v.total / v.n }]));
}

/** 10 for a form with no answer yet; otherwise 2 (strong) to 8 (weak) by the average mark. */
export function formWeight(stat: FormStat | undefined): number {
  if (!stat || stat.n === 0) return 10;
  const avg = Math.min(1, Math.max(0, stat.avg));
  return 2 + Math.round(6 * (1 - avg));
}

/** formWeight times (2 + how many of the question's skill tags are still uncleared): 4 to 50, an integer. */
export function weightOf(
  q: UnseenQuestion,
  form: TextForm | null,
  stats: ReadonlyMap<TextForm, FormStat>,
  uncleared: ReadonlySet<string>,
): number {
  const skillCount = q.concepts.filter((c) => uncleared.has(c)).length;
  return formWeight(form ? stats.get(form) : undefined) * (2 + skillCount);
}

/**
 * Pick one candidate with probability proportional to its integer weight (the cumulative walk in bank
 * order). Returns null when there are no candidates. Every weight must be a positive integer.
 */
export function drawUnseen(
  candidates: readonly UnseenQuestion[],
  weightOf: (q: UnseenQuestion) => number,
  rand: RandomInt,
): UnseenQuestion | null {
  if (candidates.length === 0) return null;
  const weights = candidates.map(weightOf);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand(total);
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r < 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
