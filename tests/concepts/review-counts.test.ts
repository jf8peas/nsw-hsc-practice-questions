// The home page's "to review" pill: how many concepts are not yet cleared in each unit,
// derived in one pass over every saved result (spec 002 FR-004 to FR-008). Pure function; no database.

import { describe, expect, it } from "vitest";

import { conceptReviewCounts, type ConceptResultWithUnit } from "@/lib/concepts/progress";
import type { Unit } from "@/lib/types";

import { PLAIN, READY, plainUnit, readyUnit } from "../helpers/concept-fixtures";

const T0 = Date.UTC(2026, 9, 1, 9, 0, 0);
let seq = 0;
function result(unitId: string, questionId: string, marks: number, max: number, minute: number): ConceptResultWithUnit {
  seq += 1;
  return { id: `r${String(seq).padStart(4, "0")}`, unitId, questionId, marks, max, answeredAt: new Date(T0 + minute * 60_000) };
}
// m questions are MC (max 1); s questions are short (max 2)
const wrong = (unitId: string, q: string, minute: number) => result(unitId, q, 0, q.includes(".s") ? 2 : 1, minute);
const right = (unitId: string, q: string, minute: number) => result(unitId, q, q.includes(".s") ? 2 : 1, q.includes(".s") ? 2 : 1, minute);

const units: Unit[] = [readyUnit, plainUnit];

describe("conceptReviewCounts (home page 'to review' pill)", () => {
  it("an empty history has nothing to review", () => {
    expect(conceptReviewCounts(units, [])).toEqual(new Map());
  });

  it("counts the uncleared concepts in one unit", () => {
    const r = [wrong(READY, `${READY}.m01`, 1), wrong(READY, `${READY}.m02`, 2)];
    // m01 -> concept a (3), m02 -> concept b (3): two uncleared
    expect([...conceptReviewCounts(units, r).entries()]).toEqual([[READY, 2]]);
  });

  it("a concept cleared after three correct answers is no longer counted", () => {
    const r = [
      wrong(READY, `${READY}.m01`, 1),
      right(READY, `${READY}.m01`, 2),
      right(READY, `${READY}.m07`, 3),
      right(READY, `${READY}.s01`, 4),
    ];
    expect(conceptReviewCounts(units, r).has(READY)).toBe(false);
  });

  it("results for a unit id that is no longer in content are ignored", () => {
    const r = [wrong("y11-removed-unit", "y11-removed-unit.q1", 1)];
    expect(conceptReviewCounts(units, r)).toEqual(new Map());
  });

  it("a unit that has not adopted concepts never gets a count", () => {
    // PLAIN questions carry no concept tag, so they count toward nothing
    const r = [wrong(PLAIN, `${PLAIN}.m01`, 1)];
    expect(conceptReviewCounts(units, r)).toEqual(new Map());
  });

  it("keeps units apart: counts never leak from one unit into another", () => {
    const r = [
      wrong(READY, `${READY}.m01`, 1),
      wrong(READY, `${READY}.m02`, 2),
      wrong(PLAIN, `${PLAIN}.m01`, 3),
    ];
    expect([...conceptReviewCounts(units, r).entries()]).toEqual([[READY, 2]]);
  });
});
