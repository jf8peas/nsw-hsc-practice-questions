// The unseen-first draw (spec 012 FR-005 to FR-009, research §3): one question from each group, never-answered ones
// first, then the least recently answered, and no change to any other unit.

import { describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { drawAttempt, type DrawHistory, type RandomInt } from "@/lib/attempts/draw.server";
import type { Weighting } from "@/lib/concepts/weighting.server";
import type { Unit } from "@/lib/types";

import { buildCaseFactsFixture } from "../helpers/case-facts-fixtures";

function seeded(seed: number): RandomInt {
  let s = seed;
  return (max) => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return Math.floor((s / 4294967296) * max);
  };
}

const CASE_FACTS = "y12-economics-case-study-facts";
const GROUPS = ["mc-china", "mc-nepal", "sa-china", "sa-nepal", "sa-both"];
const { unit } = buildCaseFactsFixture();
const groupOf = new Map(unit.questions.map((q) => [q.id, q.group]));
const groups = (ids: string[]) => ids.map((id) => groupOf.get(id));
const history = (entries: Array<[string, number]> = []): DrawHistory => ({
  lastAnswered: new Map(entries.map(([id, minute]) => [id, new Date(Date.UTC(2026, 10, 1, 0, minute))])),
});

/** Run attempts one after another, recording every drawn question as answered. */
function attempts(n: number, seed: number, target: Unit = unit, weighting?: Weighting): string[][] {
  const rand = seeded(seed);
  const answered = new Map<string, Date>();
  let minute = 0;
  return Array.from({ length: n }, () => {
    const { questionIds } = drawAttempt(target, rand, weighting, { lastAnswered: answered });
    for (const id of questionIds) answered.set(id, new Date(Date.UTC(2026, 10, 1, 0, (minute += 1))));
    return questionIds;
  });
}

describe("unseen-first draw", () => {
  it("draws one question from each group, in group order", () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(groups(drawAttempt(unit, seeded(seed), undefined, history()).questionIds)).toEqual(GROUPS);
    }
  });

  it("gives 40 different questions over 8 attempts, then repeats the least recently answered set", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const drawn = attempts(10, seed);
      expect(new Set(drawn.slice(0, 8).flat()).size).toBe(40);
      expect(new Set(drawn[8])).toEqual(new Set(drawn[0]));
      expect(new Set(drawn[9])).toEqual(new Set(drawn[1]));
    }
  });

  it("takes the one unseen question left in each pool", () => {
    const unseen = GROUPS.map((g) => unit.questions.filter((q) => q.group === g)[3].id);
    const seen = unit.questions.filter((q) => !unseen.includes(q.id)).map((q, i): [string, number] => [q.id, i]);
    for (let seed = 1; seed <= 25; seed++) {
      expect(drawAttempt(unit, seeded(seed), undefined, history(seen)).questionIds).toEqual(unseen);
    }
  });

  it("without history keeps the shape and draws at random", () => {
    const draws = new Set<string>();
    for (let seed = 1; seed <= 25; seed++) {
      const { questionIds } = drawAttempt(unit, seeded(seed));
      expect(groups(questionIds)).toEqual(GROUPS);
      draws.add(questionIds.join());
    }
    expect(draws.size).toBeGreaterThan(10);
  });

  it("keeps the shape when concepts are on and a weighting is passed", () => {
    const ready: Unit = { ...unit, conceptsReady: true };
    const weighting = {
      states: [{ conceptId: `${unit.id}.c-china-opening-up` }],
      seen: new Set<string>(),
      lastAnswer: new Map(),
    } as unknown as Weighting;
    for (let seed = 1; seed <= 25; seed++) {
      expect(groups(drawAttempt(ready, seeded(seed), weighting).questionIds)).toEqual(GROUPS);
      expect(groups(drawAttempt(ready, seeded(seed), weighting, history()).questionIds)).toEqual(GROUPS);
    }
    expect(new Set(attempts(8, 3, ready, weighting).flat()).size).toBe(40);
  });

  it("offers a never-answered MC option order as usual", () => {
    const { questionIds, mcOptionOrder } = drawAttempt(unit, seeded(4), undefined, history());
    expect(Object.keys(mcOptionOrder)).toEqual(questionIds.slice(0, 2));
  });
});

describe("no other unit's draw changes (FR-009)", () => {
  const others = UNITS.filter((u) => u.id !== CASE_FACTS);

  it("only the case-study unit opts in", () => {
    expect(UNITS.find((u) => u.id === CASE_FACTS)?.quiz?.drawUnseenFirst).toBe(true);
    expect(others.filter((u) => u.quiz?.drawUnseenFirst).map((u) => u.id)).toEqual([]);
  });

  for (const other of others) {
    it(`${other.id}: a history changes nothing`, () => {
      const answered = history(other.questions.slice(0, Math.ceil(other.questions.length / 2)).map((q, i) => [q.id, i]));
      for (let seed = 1; seed <= 25; seed++) {
        expect(drawAttempt(other, seeded(seed), undefined, answered)).toEqual(drawAttempt(other, seeded(seed)));
      }
    });
  }
});
