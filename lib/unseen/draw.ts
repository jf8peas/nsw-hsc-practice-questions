// The draw of the unseen-text unit (spec 008 FR-027, FR-028, research R9): one unanswered question
// per quiz, weighted toward the text forms where the student's average mark is lowest (untried forms
// at top weight) and toward questions tagged with a skill still in "Things I need to know". Pure; the
// random source is injected so a test can enumerate every outcome.

import type { TextForm, UnseenQuestion } from "@/lib/types";

/** What the draw needs of a question: both Advanced English units' questions satisfy it (spec 009 research R9). */
export interface DrawQuestion {
  id: string;
  /** The skill concept ids the question is tagged with. */
  concepts: string[];
}

/** A source of random integers in [0, max). Production uses crypto.randomInt. */
export type RandomInt = (max: number) => number;

/** The unit's questions, in bank order. */
export function unseenQuestions(unit: { questions: Array<{ type: string }> }): UnseenQuestion[] {
  return (unit.questions as UnseenQuestion[]).filter((q) => q.type === "unseen");
}

/** The questions the student has no result for. */
export function unansweredOf<Q extends DrawQuestion>(questions: readonly Q[], answered: ReadonlySet<string>): Q[] {
  return questions.filter((q) => !answered.has(q.id));
}

/** How many questions of a form the student has answered, and their mean mark as a share of full marks. */
export interface FormStat {
  n: number;
  avg: number;
}

/** `marks`: question id to mark / full marks (0..1) for the questions the student has answered. */
export function formStatsOf<Q extends DrawQuestion>(
  questions: readonly Q[],
  formOf: (q: Q) => TextForm | null,
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
  q: DrawQuestion,
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
export function drawUnseen<Q extends DrawQuestion>(
  candidates: readonly Q[],
  weightOf: (q: Q) => number,
  rand: RandomInt,
): Q | null {
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

// ---- repeats: once every question has a recorded mark (spec 008 FR-029, research R9) --------------

/** What a repeat draw needs of one stored result (a quiz's recorded mark and when it was recorded). */
export interface AnsweredResult {
  questionId: string;
  marks: number;
  max: number;
  answeredAt: Date;
}

/** A question's latest recorded mark as a share of full marks, and when it was last answered. */
export interface LatestAnswer {
  share: number;
  at: number;
}

/** Results in answer order (oldest first, as the queries return them); a later result replaces an earlier one. */
export function latestAnswers(results: readonly AnsweredResult[]): Map<string, LatestAnswer> {
  const latest = new Map<string, LatestAnswer>();
  for (const r of results) latest.set(r.questionId, { share: r.max > 0 ? r.marks / r.max : 0, at: r.answeredAt.getTime() });
  return latest;
}

/** The marks the form averages use: each question's LATEST recorded mark, so improvement shows. */
export function latestShares(results: readonly AnsweredResult[]): Map<string, number> {
  return new Map([...latestAnswers(results)].map(([id, a]) => [id, a.share]));
}

/** True when every question of a non-empty bank has a recorded mark: the draw then repeats. */
export function isRepeating(questions: readonly DrawQuestion[], answered: ReadonlySet<string>): boolean {
  return questions.length > 0 && unansweredOf(questions, answered).length === 0;
}

/** The bank questions of the student's last `n` quizzes, newest first (a question appears once). */
export function recentQuestionIds(questions: readonly DrawQuestion[], results: readonly AnsweredResult[], n = 3): string[] {
  const inBank = new Set(questions.map((q) => q.id));
  const ordered = results.filter((r) => inBank.has(r.questionId)); // answer order, oldest first
  const ids: string[] = [];
  for (let i = ordered.length - 1; i >= 0 && ids.length < n; i--) if (!ids.includes(ordered[i].questionId)) ids.push(ordered[i].questionId);
  return ids;
}

/**
 * Never offer a question answered in the last 3 quizzes, unless the bank has 3 or fewer questions: then
 * exclude only the most recent one; with 1 question, offer it.
 */
export function repeatCandidates<Q extends DrawQuestion>(questions: readonly Q[], recent: readonly string[]): Q[] {
  if (questions.length <= 1) return [...questions];
  const excluded = new Set(questions.length > 3 ? recent.slice(0, 3) : recent.slice(0, 1));
  return questions.filter((q) => !excluded.has(q.id));
}

/** 1 (full marks) to 5 (no marks): the lower the latest mark, the likelier. */
export function markWeight(share: number): number {
  return 1 + Math.round(4 * (1 - Math.min(1, Math.max(0, share))));
}

/** 1 to 4 by age rank among the candidates: the longest since answered gets 4, the most recent 1 (ties by bank order). */
export function ageWeights(candidates: readonly DrawQuestion[], latest: ReadonlyMap<string, LatestAnswer>): Map<string, number> {
  const ranked = candidates.map((q, i) => ({ id: q.id, at: latest.get(q.id)?.at ?? 0, i })).sort((a, b) => a.at - b.at || a.i - b.i);
  const n = ranked.length;
  return new Map(ranked.map((r, rank) => [r.id, n <= 1 ? 1 : 1 + Math.round((3 * (n - 1 - rank)) / (n - 1))]));
}

/** The existing weight (form times skills) times the mark weight times the age weight: an integer, 4 to 1000. */
export function repeatWeightOf(
  q: DrawQuestion,
  form: TextForm | null,
  stats: ReadonlyMap<TextForm, FormStat>,
  uncleared: ReadonlySet<string>,
  latest: ReadonlyMap<string, LatestAnswer>,
  ages: ReadonlyMap<string, number>,
): number {
  return weightOf(q, form, stats, uncleared) * markWeight(latest.get(q.id)?.share ?? 0) * (ages.get(q.id) ?? 1);
}
