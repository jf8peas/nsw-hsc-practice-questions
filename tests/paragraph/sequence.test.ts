import { describe, expect, it } from "vitest";

import { essayProgress, nextQuestion } from "@/lib/attempts/sequence.server";
import type { ParagraphQuestion, Unit } from "@/lib/types";

const U = "y12-economics-paragraph-writing";

function unitWith(essays: number): Unit {
  const questions: ParagraphQuestion[] = [];
  for (let e = 1; e <= essays; e++) {
    for (let p = 1 as 1 | 2 | 3 | 4 | 5; p <= 5; p = (p + 1) as 1 | 2 | 3 | 4 | 5) {
      questions.push({
        id: `${U}.e${String(e).padStart(2, "0")}p${p}`,
        type: "paragraph",
        group: "paragraph",
        essayId: `e${String(e).padStart(2, "0")}`,
        essayNo: e,
        part: p,
        verb: "evaluate",
        economy: e === 1 ? "Vietnam" : "Bangladesh",
        prompt: `Essay ${e} question`,
        maxMarks: 4,
        concepts: [],
      });
      if (p === 5) break;
    }
  }
  return {
    id: U, year: "Year 12", topic: "t", type: "Writing Practice", title: "T", description: "d",
    created: "2026-11-05", order: 1, sequence: { kind: "essay-parts", parts: 5 }, questions,
  };
}
const id = (e: number, p: number) => `${U}.e${String(e).padStart(2, "0")}p${p}`;

describe("nextQuestion", () => {
  const unit = unitWith(2);
  it("starts at essay 1 part 1", () => {
    expect(nextQuestion(unit, new Set())?.id).toBe(id(1, 1));
  });
  it("continues in framework order, one part at a time", () => {
    expect(nextQuestion(unit, new Set([id(1, 1)]))?.id).toBe(id(1, 2));
    expect(nextQuestion(unit, new Set([id(1, 1), id(1, 2), id(1, 3)]))?.id).toBe(id(1, 4));
  });
  it("starts the next essay after the Link", () => {
    expect(nextQuestion(unit, new Set([1, 2, 3, 4, 5].map((p) => id(1, p))))?.id).toBe(id(2, 1));
  });
  it("offers a part with no result again, even if later ones were answered somehow", () => {
    expect(nextQuestion(unit, new Set([id(1, 1), id(1, 3)]))?.id).toBe(id(1, 2));
  });
  it("returns null when everything has a result", () => {
    const all = new Set(unit.questions.map((q) => q.id));
    expect(nextQuestion(unit, all)).toBeNull();
  });
});

describe("essayProgress", () => {
  it("reads Essay N of M from the bank size (a bank of 2 reads 'of 2')", () => {
    const p = essayProgress(unitWith(2), new Map());
    expect(p.finished).toBe(false);
    if (!p.finished) {
      expect(p.essayNo).toBe(1);
      expect(p.essayTotal).toBe(2);
      expect(p.nextPart).toBe(1);
      expect(p.parts.map((x) => x.state)).toEqual(["next", "later", "later", "later", "later"]);
      expect(p.economy).toBe("Vietnam");
    }
  });
  it("shows recorded marks on finished parts and marks the next part", () => {
    const p = essayProgress(unitWith(2), new Map([[id(1, 1), 4], [id(1, 2), 3]]));
    if (p.finished) throw new Error("not finished");
    expect(p.parts.map((x) => [x.state, x.mark])).toEqual([
      ["done", 4], ["done", 3], ["next", null], ["later", null], ["later", null],
    ]);
    expect(p.nextPart).toBe(3);
    expect(p.parts[2].short).toBe("Evidence");
  });
  it("moves to the next essay after the Link and drops the finished essay's dots", () => {
    const marks = new Map([1, 2, 3, 4, 5].map((n) => [id(1, n), 3] as [string, number]));
    const p = essayProgress(unitWith(2), marks);
    if (p.finished) throw new Error("not finished");
    expect(p.essayNo).toBe(2);
    expect(p.question).toBe("Essay 2 question");
    expect(p.parts.every((x) => x.mark === null)).toBe(true);
  });
  it("is finished when every part has a mark", () => {
    const u = unitWith(1);
    const marks = new Map(u.questions.map((q) => [q.id, 2] as [string, number]));
    expect(essayProgress(u, marks)).toEqual({ finished: true, essayTotal: 1 });
  });
});
