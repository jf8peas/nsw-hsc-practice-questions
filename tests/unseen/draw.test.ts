// The weighted draw (spec 008 FR-027, FR-028, research R9): the weights, and an exact enumeration of
// every random value so the odds are proved, not sampled.

import { describe, expect, it } from "vitest";

import { drawUnseen, formStatsOf, formWeight, unansweredOf, weightOf } from "@/lib/unseen/draw";
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
