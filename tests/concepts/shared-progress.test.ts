// Shared skill progress between the two Advanced English units (spec 009 FR-022, research R8, task T013):
// one count per shared skill, replayed from both units' first-try outcomes in time order; each unit lists only
// its own concepts; the comparison skills come only from the comparative unit.

import { describe, expect, it } from "vitest";

import { conceptProgress, conceptReviewCounts, sharedConceptProgress, type ConceptResult } from "@/lib/concepts/progress";
import type { Concept, Unit } from "@/lib/types";

const A = "unit-a";
const B = "unit-b";
const shared = (n: string) => `${A}.c-${n}`; // spec 009: the shared skills keep the first unit's ids
const own = `${B}.c-compares`;

const concept = (id: string): Concept => ({ id, title: id, description: id, clearAfter: 2 }) as unknown as Concept;
const unitA = { id: A, questions: [], concepts: [concept(shared("x")), concept(shared("y"))], conceptsReady: true, sharesProgressWith: [B] } as unknown as Unit;
const unitB = { id: B, questions: [], concepts: [concept(shared("x")), concept(shared("y")), concept(own)], conceptsReady: true, sharesProgressWith: [A] } as unknown as Unit;
const lone = { id: "lone", questions: [], concepts: [concept("lone.c-x")], conceptsReady: true } as unknown as Unit;

let n = 0;
const r = (minute: number, outcomes: Array<[string, boolean]>): ConceptResult => {
  n += 1;
  return {
    id: `r${String(n).padStart(3, "0")}`,
    questionId: "q",
    marks: 1,
    max: 3,
    answeredAt: new Date(Date.UTC(2026, 10, 20, 9, minute)),
    conceptOutcomes: outcomes.map(([conceptId, correct]) => ({ conceptId, correct })),
  };
};
const counts = (unit: Unit, results: ConceptResult[]) => sharedConceptProgress(unit, results).map((s) => [s.conceptId, s.count] as const).sort();

describe("sharedConceptProgress", () => {
  it("a miss in either unit sets the shared skill to 2 in both lists", () => {
    const missInA = r(1, [[shared("x"), false]]);
    expect(counts(unitA, [missInA])).toEqual([[shared("x"), 2]]);
    expect(counts(unitB, [missInA])).toEqual([[shared("x"), 2]]);
  });

  it("two shows, in any mix of units, clear it in both", () => {
    const rs = [r(1, [[shared("x"), false]]), r(2, [[shared("x"), true]]), r(3, [[shared("x"), true]])];
    expect(counts(unitA, rs)).toEqual([]);
    expect(counts(unitB, rs)).toEqual([]);
    const oneShow = rs.slice(0, 2);
    expect(counts(unitA, oneShow)).toEqual([[shared("x"), 1]]);
  });

  it("a later miss in the other unit sets it back to 2, in time order", () => {
    const rs = [r(1, [[shared("x"), false]]), r(2, [[shared("x"), true]]), r(3, [[shared("x"), false]])];
    expect(counts(unitB, rs)).toEqual([[shared("x"), 2]]);
  });

  it("each unit lists only its own concepts: the comparison skill never shows in the first unit", () => {
    const rs = [r(1, [[own, false], [shared("y"), false]])];
    expect(counts(unitA, rs)).toEqual([[shared("y"), 2]]);
    expect(counts(unitB, rs)).toEqual([[own, 2], [shared("y"), 2]].sort());
  });

  it("the comparison skill clears after two shows of its own", () => {
    const rs = [r(1, [[own, false]]), r(2, [[own, true]]), r(3, [[own, true]])];
    expect(counts(unitB, rs)).toEqual([]);
  });
});

describe("a unit that shares nothing is unchanged", () => {
  it("conceptProgress still replays only what it is given", () => {
    const rs = [r(1, [["lone.c-x", false]])];
    expect(conceptProgress(lone, rs).map((s) => [s.conceptId, s.count])).toEqual([["lone.c-x", 2]]);
  });
});

describe("the home page's review counts follow the sharing", () => {
  it("counts a skill missed in the other unit", () => {
    const tagged = [{ ...r(1, [[shared("x"), false]]), unitId: B }];
    const counts = conceptReviewCounts([unitA, unitB, lone], tagged);
    expect(counts.get(A)).toBe(1);
    expect(counts.get(B)).toBe(1);
    expect(counts.has("lone")).toBe(false);
  });

  it("counts the comparison skill only for the comparative unit", () => {
    const tagged = [{ ...r(1, [[own, false]]), unitId: B }];
    const counts = conceptReviewCounts([unitA, unitB], tagged);
    expect(counts.has(A)).toBe(false);
    expect(counts.get(B)).toBe(1);
  });
});
