// The weighted draw (spec 008 FR-027, FR-028, research R9): the weights, and an exact enumeration of
// every random value so the odds are proved, not sampled.

import { describe, expect, it } from "vitest";

import {
  ageWeights,
  drawUnseen,
  formStatsOf,
  formWeight,
  isRepeating,
  latestAnswers,
  latestShares,
  markWeight,
  recentQuestionIds,
  repeatCandidates,
  repeatWeightOf,
  unansweredOf,
  weightOf,
  type AnsweredResult,
} from "@/lib/unseen/draw";
import type { TextForm, UnseenQuestion } from "@/lib/types";

const q = (id: string, form: TextForm, concepts: string[] = []): UnseenQuestion & { form: TextForm } =>
  ({ id, type: "unseen", concepts, form }) as unknown as UnseenQuestion & { form: TextForm };
const formOf = (x: UnseenQuestion) => (x as unknown as { form: TextForm }).form;

describe("formWeight", () => {
  it("is 10 for a form with no answer", () => {
    expect(formWeight(undefined)).toBe(10);
    expect(formWeight({ n: 0, avg: 0 })).toBe(10);
  });
  it("is 2 to 8 by round(6 × (1 − average))", () => {
    expect(formWeight({ n: 1, avg: 1 })).toBe(2);
    expect(formWeight({ n: 1, avg: 0 })).toBe(8);
    expect(formWeight({ n: 2, avg: 0.5 })).toBe(5);
    expect(formWeight({ n: 2, avg: 2 / 3 })).toBe(4);
  });
});

describe("weightOf", () => {
  const stats = new Map([["poem" as TextForm, { n: 1, avg: 0 }]]);
  it("is formWeight × (2 + the number of the question's skills still uncleared)", () => {
    const uncleared = new Set(["a", "b"]);
    expect(weightOf(q("x", "poem"), "poem", stats, uncleared)).toBe(8 * 2);
    expect(weightOf(q("x", "poem", ["a"]), "poem", stats, uncleared)).toBe(8 * 3);
    expect(weightOf(q("x", "poem", ["a", "b", "c"]), "poem", stats, uncleared)).toBe(8 * 4);
    expect(weightOf(q("x", "visual"), "visual", stats, uncleared)).toBe(10 * 2); // untried form
  });
});

describe("the draw, enumerated", () => {
  // answered: a poem at full marks (poem weight 2) and a prose-fiction at no marks (weight 8); a visual is untried (10)
  const answered = [q("p1", "poem"), q("s1", "prose-fiction")];
  const marks = new Map([["p1", 1], ["s1", 0]]);
  const candidates = [q("p2", "poem"), q("s2", "prose-fiction", ["skill-x"]), q("v1", "visual")];
  const bank = [...answered, ...candidates];
  const stats = formStatsOf(bank, formOf, marks);
  const w = (x: UnseenQuestion) => weightOf(x, formOf(x), stats, new Set(["skill-x"]));

  it("weights: poem 2 × 2, prose 8 × 3 (one uncleared skill), visual 10 × 2", () => {
    expect(candidates.map(w)).toEqual([4, 24, 20]);
  });

  it("picks each question for exactly its weight's share of every possible random value", () => {
    const total = candidates.map(w).reduce((a, b) => a + b, 0);
    expect(total).toBe(48);
    const counts: Record<string, number> = { p2: 0, s2: 0, v1: 0 };
    for (let r = 0; r < total; r++) counts[drawUnseen(candidates, w, () => r)!.id] += 1;
    expect(counts).toEqual({ p2: 4, s2: 24, v1: 20 });
  });

  it("never offers an answered question, and the bank order does not matter", () => {
    const answeredIds = new Set(answered.map((a) => a.id));
    expect(unansweredOf(bank, answeredIds).map((x) => x.id)).toEqual(["p2", "s2", "v1"]);
    const reversed = [...candidates].reverse();
    const counts: Record<string, number> = { p2: 0, s2: 0, v1: 0 };
    for (let r = 0; r < 48; r++) counts[drawUnseen(reversed, w, () => r)!.id] += 1;
    expect(counts).toEqual({ p2: 4, s2: 24, v1: 20 });
  });

  it("returns null when nothing is left", () => {
    expect(drawUnseen([], w, () => 0)).toBeNull();
  });

  it("an untried form outweighs a mastered one and a weak form outweighs a strong one", () => {
    expect(formWeight(undefined)).toBeGreaterThan(formWeight(stats.get("prose-fiction")));
    expect(formWeight(stats.get("prose-fiction"))).toBeGreaterThan(formWeight(stats.get("poem")));
  });
});

// ---- repeats (FR-029): once every question has a recorded mark the draw continues over the whole bank

const day = (n: number) => new Date(Date.UTC(2026, 10, n));
const res = (questionId: string, marks: number, answeredAt: Date, max = 3): AnsweredResult => ({ questionId, marks, max, answeredAt });

describe("repeats begin only when every question is answered", () => {
  const bank = [q("a", "poem"), q("b", "poem"), q("c", "visual")];
  it("is false while any question is unanswered, true once all have a recorded mark, false for an empty bank", () => {
    expect(isRepeating(bank, new Set(["a", "b"]))).toBe(false);
    expect(isRepeating(bank, new Set(["a", "b", "c"]))).toBe(true);
    expect(isRepeating([], new Set())).toBe(false);
  });
});

describe("the latest recorded mark is the one used", () => {
  it("a later result replaces an earlier one, in the question's share and in the form averages", () => {
    const results = [res("a", 1, day(1)), res("b", 3, day(2)), res("a", 3, day(9))];
    expect(latestAnswers(results).get("a")).toEqual({ share: 1, at: day(9).getTime() });
    expect(latestShares(results).get("a")).toBe(1);
    const stats = formStatsOf([q("a", "poem"), q("b", "poem")], formOf, latestShares(results));
    expect(stats.get("poem")).toEqual({ n: 2, avg: 1 }); // improvement shows: not (1/3 + 1) / 2
  });
});

describe("the last 3 quizzes are never offered again", () => {
  const six = ["a", "b", "c", "d", "e", "f"].map((id) => q(id, "poem"));
  const log = ["a", "b", "c", "d", "e", "f"].map((id, i) => res(id, 3, day(i + 1)));
  const ids = (xs: UnseenQuestion[]) => xs.map((x) => x.id);

  it("recentQuestionIds is the last 3 quizzes, newest first, each question once", () => {
    expect(recentQuestionIds(six, log)).toEqual(["f", "e", "d"]);
    expect(recentQuestionIds(six, [...log, res("d", 2, day(20))])).toEqual(["d", "f", "e"]);
    expect(recentQuestionIds(six, [res("zz", 3, day(1)), ...log.slice(0, 2)])).toEqual(["b", "a"]); // retired questions do not count
  });

  it("a bank of more than 3 questions excludes the last 3", () => {
    expect(ids(repeatCandidates(six, recentQuestionIds(six, log)))).toEqual(["a", "b", "c"]);
  });

  it("a bank of 4 leaves exactly one question", () => {
    const four = six.slice(0, 4);
    const l = four.map((x, i) => res(x.id, 3, day(i + 1)));
    expect(ids(repeatCandidates(four, recentQuestionIds(four, l)))).toEqual(["a"]);
  });

  it("a bank of 3 or fewer excludes only the most recent question; a bank of 1 offers it", () => {
    const three = six.slice(0, 3);
    const l3 = three.map((x, i) => res(x.id, 3, day(i + 1)));
    expect(ids(repeatCandidates(three, recentQuestionIds(three, l3)))).toEqual(["a", "b"]);
    const two = six.slice(0, 2);
    const l2 = two.map((x, i) => res(x.id, 3, day(i + 1)));
    expect(ids(repeatCandidates(two, recentQuestionIds(two, l2)))).toEqual(["a"]);
    const one = six.slice(0, 1);
    expect(ids(repeatCandidates(one, recentQuestionIds(one, [res("a", 3, day(1))])))).toEqual(["a"]);
  });
});

describe("lowest mark and oldest first", () => {
  it("markWeight is 5 for no marks down to 1 for full marks", () => {
    expect([0, 1 / 3, 0.5, 2 / 3, 1].map(markWeight)).toEqual([5, 4, 3, 2, 1]);
  });

  it("ageWeights gives the longest since answered 4 and the most recent 1, by rank", () => {
    const cands = [q("a", "poem"), q("b", "poem"), q("c", "poem"), q("d", "poem")];
    const latest = latestAnswers([res("a", 3, day(9)), res("b", 3, day(1)), res("c", 3, day(5)), res("d", 3, day(7))]);
    expect([...ageWeights(cands, latest)]).toEqual([["b", 4], ["c", 3], ["d", 2], ["a", 1]]);
    expect(ageWeights([q("a", "poem")], latest).get("a")).toBe(1); // one candidate: nothing to rank
  });

  it("a lower latest mark and an older answer each raise a question's odds, exactly, over every random value", () => {
    // same form, no skills: weight = form (equal) x 2 x markWeight x ageWeight
    const cands = [q("hard-old", "poem"), q("hard-new", "poem"), q("easy-old", "poem"), q("easy-new", "poem")];
    const results = [res("easy-old", 3, day(1)), res("hard-old", 0, day(2)), res("easy-new", 3, day(8)), res("hard-new", 0, day(9))];
    const latest = latestAnswers(results);
    const stats = formStatsOf(cands, formOf, latestShares(results));
    const ages = ageWeights(cands, latest);
    const w = (x: UnseenQuestion) => repeatWeightOf(x, formOf(x), stats, new Set(), latest, ages);
    const weights = Object.fromEntries(cands.map((x) => [x.id, w(x)]));
    expect(weights["hard-old"]).toBeGreaterThan(weights["hard-new"]);
    expect(weights["hard-old"]).toBeGreaterThan(weights["easy-old"]);
    expect(weights["easy-old"]).toBeGreaterThan(weights["easy-new"]);
    expect(weights["hard-new"]).toBeGreaterThan(weights["easy-new"]);
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    const counts: Record<string, number> = { "hard-old": 0, "hard-new": 0, "easy-old": 0, "easy-new": 0 };
    for (let r = 0; r < total; r++) counts[drawUnseen(cands, w, () => r)!.id] += 1;
    expect(counts).toEqual(weights);
  });

  it("the text-form and uncleared-skill weights still apply to a repeat", () => {
    const cands = [q("p", "poem", ["s1"]), q("v", "visual")];
    const results = [res("p", 3, day(1)), res("v", 3, day(2))];
    const latest = latestAnswers(results);
    const stats = formStatsOf(cands, formOf, latestShares(results));
    const ages = ageWeights(cands, latest);
    const withSkill = repeatWeightOf(cands[0], "poem", stats, new Set(["s1"]), latest, ages);
    const without = repeatWeightOf(cands[0], "poem", stats, new Set(), latest, ages);
    expect(withSkill).toBeGreaterThan(without);
    expect(withSkill / without).toBeCloseTo(3 / 2);
  });
});
