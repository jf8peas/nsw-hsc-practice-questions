import { describe, expect, it } from "vitest";

import { conceptProgress, type ConceptResult } from "@/lib/concepts/progress";
import type { Unit } from "@/lib/types";

// Spec 010 FR-040 and the 2026-11-22 Clarification: a gap clears after 2 later correct uses, and a redo of the essay
// that raised it does not count. A concept's counts are replayed from the results' concept outcomes.

const U = "y12-economics-essay-writing";
const WTO = `${U}.c-china-wto`;

const unit = (flag: boolean): Unit =>
  ({
    id: U,
    questions: ["e1", "e2", "e3", "e5"].map((e) => ({ id: `${U}.${e}`, type: "essay" })),
    concepts: [{ id: WTO, description: "WTO", clearAfter: 2 }],
    conceptsClearOnOtherQuestions: flag,
  }) as unknown as Unit;

let n = 0;
const result = (essay: string, correct: boolean | null): ConceptResult => ({
  id: `r${++n}`.padStart(4, "0"),
  questionId: `${U}.${essay}`,
  marks: 12,
  max: 20,
  answeredAt: new Date(2026, 10, 22, 9, n),
  conceptOutcomes: correct === null ? [] : [{ conceptId: WTO, correct }],
});

describe("clearing a gap on a different essay only", () => {
  it("a miss sets the count to 2", () => {
    expect(conceptProgress(unit(true), [result("e1", false)]).map((c) => [c.conceptId, c.count])).toEqual([[WTO, 2]]);
  });

  it("clears after two correct uses on other essays", () => {
    const r = [result("e1", false), result("e5", true), result("e2", true)];
    expect(conceptProgress(unit(true), r)).toEqual([]);
  });

  it("is taken down by one other essay, and left at 1", () => {
    const r = [result("e1", false), result("e5", true)];
    expect(conceptProgress(unit(true), r).map((c) => c.count)).toEqual([1]);
  });

  it("is not cleared by a redo of the essay that raised it", () => {
    const r = [result("e1", false), result("e1", true), result("e1", true)];
    expect(conceptProgress(unit(true), r).map((c) => c.count)).toEqual([2]);
  });

  it("a redo does not count, but later essays still do", () => {
    const r = [result("e1", false), result("e1", true), result("e5", true), result("e2", true)];
    expect(conceptProgress(unit(true), r)).toEqual([]);
  });

  it("is re-raised by a miss on another essay, which then becomes the raising essay", () => {
    const r = [result("e1", false), result("e5", true), result("e3", false), result("e3", true), result("e1", true)];
    // after e3's miss the count is 2 (raised by e3); e3's redo is ignored; e1 is a different essay, so it takes 1 off
    expect(conceptProgress(unit(true), r).map((c) => c.count)).toEqual([1]);
  });

  it("ignores an essay that mentions no concept", () => {
    const r = [result("e1", false), result("e5", null)];
    expect(conceptProgress(unit(true), r).map((c) => c.count)).toEqual([2]);
  });

  it("a concept never missed is never listed", () => {
    expect(conceptProgress(unit(true), [result("e1", true), result("e5", true)])).toEqual([]);
  });

  it("units without the flag keep the original behaviour (a same-question use clears)", () => {
    const r = [result("e1", false), result("e1", true), result("e1", true)];
    expect(conceptProgress(unit(false), r)).toEqual([]);
  });
});
