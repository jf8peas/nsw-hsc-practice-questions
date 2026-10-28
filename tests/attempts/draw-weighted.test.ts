// The weighted quiz draw (spec 002 US4; FR-033 to FR-038, research R4).

import { describe, expect, it } from "vitest";

import { drawAttempt, type RandomInt } from "@/lib/attempts/draw.server";
import type { Weighting } from "@/lib/concepts/weighting.server";
import type { Unit } from "@/lib/types";

import { conceptId, readyUnit } from "../helpers/concept-fixtures";

function seeded(seed: number): RandomInt {
  let s = seed;
  return (max) => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return Math.floor((s / 4294967296) * max);
  };
}

const T0 = new Date("2026-10-01T00:00:00Z").getTime();
const at = (n: number) => new Date(T0 + n * 60_000);

function weighting(
  concepts: Array<[letter: string, count: 1 | 2 | 3]>,
  seen: Array<[id: string, correct: boolean, minute: number]> = [],
): Weighting {
  return {
    states: concepts.map(([l, count], i) => ({ conceptId: conceptId(l), count, lastMissedAt: at(100 - i) })),
    seen: new Set(seen.map(([id]) => id)),
    lastAnswer: new Map(seen.map(([id, correct, m]) => [id, { at: at(m), correct }])),
  };
}

const conceptOf = (u: Unit, id: string) => u.questions.find((q) => q.id === id)!.concept;
const onConcepts = (u: Unit, ids: string[], letters: string[]) =>
  ids.filter((id) => letters.map(conceptId).includes(conceptOf(u, id)!));

describe("without a weighting", () => {
  it("is the ordinary draw, call for call", () => {
    for (let seed = 1; seed <= 10; seed++) {
      expect(drawAttempt(readyUnit, seeded(seed), undefined)).toEqual(drawAttempt(readyUnit, seeded(seed)));
    }
  });

  it("a unit that has not adopted concepts ignores a weighting", () => {
    const u: Unit = { ...readyUnit, conceptsReady: false };
    expect(drawAttempt(u, seeded(3), weighting([["a", 3]]))).toEqual(drawAttempt(u, seeded(3)));
  });
});

describe("the weighted places", () => {
  it("gives exactly half the places, rounded up, to the weak concepts", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const { questionIds } = drawAttempt(readyUnit, seeded(seed), weighting([["a", 3], ["b", 2], ["c", 1]]));
      expect(questionIds).toHaveLength(8);
      expect(onConcepts(readyUnit, questionIds, ["a", "b", "c"]).length).toBeGreaterThanOrEqual(4);
      expect(new Set(questionIds).size).toBe(8);
    }
  });

  it("rounds up for an odd quiz", () => {
    const u: Unit = {
      ...readyUnit,
      quiz: { short: 0, mc: 0, passMark: 50, groups: [{ group: "mc", n: 3 }] },
    };
    for (let seed = 1; seed <= 15; seed++) {
      const { questionIds } = drawAttempt(u, seeded(seed), weighting([["a", 3], ["b", 3]]));
      expect(questionIds).toHaveLength(3);
      expect(onConcepts(u, questionIds, ["a", "b"]).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("a ten-question quiz gives five", () => {
    const u: Unit = {
      ...readyUnit,
      quiz: { short: 0, mc: 0, passMark: 50, groups: [{ group: "mc", n: 5 }, { group: "sa", n: 5 }] },
    };
    for (let seed = 1; seed <= 15; seed++) {
      const { questionIds } = drawAttempt(u, seeded(seed), weighting([["a", 3], ["b", 3], ["c", 3]]));
      expect(questionIds).toHaveLength(10);
      expect(onConcepts(u, questionIds, ["a", "b", "c"]).length).toBeGreaterThanOrEqual(5);
    }
  });

  it("with fewer weak questions than half, uses all of them and fills the rest as usual", () => {
    const u: Unit = { ...readyUnit, questions: readyUnit.questions.filter((q) => q.concept !== conceptId("a") || q.id.endsWith("m01")) };
    const { questionIds } = drawAttempt(u, seeded(4), weighting([["a", 3]]));
    expect(questionIds).toHaveLength(8);
    expect(questionIds).toContain("fx-ready.m01");
  });
});

describe("which weak questions", () => {
  it("takes unseen questions before ones the student has answered", () => {
    // concept a has m01, m07, s01, s07; only m07 is unseen among the mc group
    const w = weighting([["a", 3]], [["fx-ready.m01", false, 1], ["fx-ready.s01", false, 2], ["fx-ready.s07", false, 3]]);
    for (let seed = 1; seed <= 15; seed++) {
      const { questionIds } = drawAttempt(readyUnit, seeded(seed), w);
      expect(questionIds).toContain("fx-ready.m07");
    }
  });

  it("when only seen questions remain, takes the one last answered wrong first, then the oldest", () => {
    const u: Unit = {
      ...readyUnit,
      quiz: { short: 0, mc: 0, passMark: 50, groups: [{ group: "mc", n: 2 }] },
    };
    // concept a has two mc questions, m01 and m07; places = 1
    const wrongLast = weighting([["a", 3]], [["fx-ready.m01", true, 10], ["fx-ready.m07", false, 50]]);
    expect(drawAttempt(u, seeded(1), wrongLast).questionIds).toContain("fx-ready.m07");
    const oldestFirst = weighting([["a", 3]], [["fx-ready.m01", true, 50], ["fx-ready.m07", true, 10]]);
    expect(drawAttempt(u, seeded(1), oldestFirst).questionIds).toContain("fx-ready.m07");
  });

  it("spreads across the concepts instead of taking every place from the first", () => {
    for (let seed = 1; seed <= 15; seed++) {
      const { questionIds } = drawAttempt(readyUnit, seeded(seed), weighting([["a", 3], ["b", 3], ["c", 3], ["d", 3]]));
      const hit = new Set(questionIds.map((id) => conceptOf(readyUnit, id)).filter((c) => [..."abcd"].map(conceptId).includes(c!)));
      expect(hit.size).toBeGreaterThanOrEqual(4); // four weighted places, four concepts: one each
    }
  });

  it("gives the highest count the first place when there are fewer places than concepts", () => {
    const u: Unit = {
      ...readyUnit,
      quiz: { short: 0, mc: 0, passMark: 50, groups: [{ group: "mc", n: 2 }] },
    };
    for (let seed = 1; seed <= 15; seed++) {
      const { questionIds } = drawAttempt(u, seeded(seed), weighting([["c", 3], ["b", 1]]));
      // one weighted place, and it goes to the highest count (c), not the lower one (b); the
      // other place is an ordinary draw and may be any question
      expect(onConcepts(u, questionIds, ["c"]).length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("the group mix", () => {
  it("keeps the usual mix when the weak questions allow it", () => {
    // every concept has both kinds, so four weighted places fit inside a 4 + 4 mix
    for (let seed = 1; seed <= 15; seed++) {
      const { questionIds } = drawAttempt(readyUnit, seeded(seed), weighting([["a", 3], ["b", 3], ["c", 3], ["d", 3]]));
      const groups = questionIds.map((id) => readyUnit.questions.find((q) => q.id === id)!.group);
      expect(groups.filter((g) => g === "mc")).toHaveLength(4);
      expect(groups.filter((g) => g === "sa")).toHaveLength(4);
      expect(groups.slice(0, 4).every((g) => g === "mc")).toBe(true); // listed group order
    }
  });

  it("gives up the mix rather than a weighted place", () => {
    // only short-answer questions exist for the weak concept
    const u: Unit = { ...readyUnit, questions: readyUnit.questions.filter((q) => q.group === "sa" || q.concept !== conceptId("a")) };
    const w = weighting([["a", 3], ["b", 3], ["c", 3], ["d", 3], ["e", 3], ["f", 3]]);
    const mcOnly = (id: string) => u.questions.find((q) => q.id === id)!.group === "mc";
    for (let seed = 1; seed <= 15; seed++) {
      const { questionIds } = drawAttempt(u, seeded(seed), w);
      expect(questionIds).toHaveLength(8);
      expect(onConcepts(u, questionIds, ["a", "b", "c", "d", "e", "f"]).length).toBeGreaterThanOrEqual(4);
      expect(questionIds.filter(mcOnly).length).toBeLessThanOrEqual(4);
    }
  });
});

describe("the result", () => {
  it("only uses bank questions, no duplicates, and an option order for every mc", () => {
    const ids = new Set(readyUnit.questions.map((q) => q.id));
    for (let seed = 1; seed <= 20; seed++) {
      const { questionIds, mcOptionOrder } = drawAttempt(readyUnit, seeded(seed), weighting([["a", 3], ["f", 2]]));
      expect(new Set(questionIds).size).toBe(questionIds.length);
      for (const id of questionIds) expect(ids.has(id)).toBe(true);
      const mcs = questionIds.filter((id) => readyUnit.questions.find((q) => q.id === id)!.type === "mc");
      expect(Object.keys(mcOptionOrder).sort()).toEqual(mcs.slice().sort());
    }
  });

  it("is still random", () => {
    const w = weighting([["a", 3]]);
    const a = drawAttempt(readyUnit, seeded(1), w).questionIds.join();
    const b = drawAttempt(readyUnit, seeded(2), w).questionIds.join();
    expect(a).not.toBe(b);
  });
});
