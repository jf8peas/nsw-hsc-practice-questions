// Unit tests for the sentence-rewrite scoring rubric (2026-11-03 scoring fix, revised).
//
// Rubric: each required term used correctly contributes; criterion A (meaning/cause-and-effect)
// and criterion C (≤25 words, no padding) each cost one mark when lost; a retry is capped at
// totalMarks - 1; a non-perfect first try is capped at totalMarks - 2 (so it is always below the
// retry cap); the final is max(firstTry, retry). The invariant is checked against every question
// in the bank.

import { describe, expect, it } from "vitest";

import { getUnit } from "@/content";
import { getAnswer } from "@/content/answers";
import { rewriteRetryCap, rewriteScore } from "@/lib/rewrite-scoring";

const REWRITE_UNIT = "y12-economics-sentence-writing";

describe("rewriteScore — the four example outcomes (3 marks, 2 terms)", () => {
  it("both terms on the first try with A and C → 3/3 (no retry)", () => {
    expect(rewriteScore({ totalMarks: 3, termCount: 2, termsUsed: 2, criterionA: true, criterionC: true, phase: 1 })).toBe(3);
  });

  it("fixed on the retry → 2/3 (the retry is capped at 2)", () => {
    const firstTry = rewriteScore({ totalMarks: 3, termCount: 2, termsUsed: 1, criterionA: true, criterionC: true, phase: 1 });
    const retry = rewriteScore({ totalMarks: 3, termCount: 2, termsUsed: 2, criterionA: true, criterionC: true, phase: 2 });
    expect(firstTry).toBe(1);
    expect(retry).toBe(2);
    expect(Math.max(firstTry, retry)).toBe(2);
  });

  it("one term on the first try, no fix → 1/3", () => {
    const firstTry = rewriteScore({ totalMarks: 3, termCount: 2, termsUsed: 1, criterionA: true, criterionC: true, phase: 1 });
    const retry = rewriteScore({ totalMarks: 3, termCount: 2, termsUsed: 1, criterionA: true, criterionC: true, phase: 2 });
    expect(firstTry).toBe(1);
    expect(retry).toBe(1);
    expect(Math.max(firstTry, retry)).toBe(1);
  });

  it("no terms → 0/3", () => {
    const firstTry = rewriteScore({ totalMarks: 3, termCount: 2, termsUsed: 0, criterionA: true, criterionC: true, phase: 1 });
    const retry = rewriteScore({ totalMarks: 3, termCount: 2, termsUsed: 0, criterionA: true, criterionC: true, phase: 2 });
    expect(firstTry).toBe(0);
    expect(retry).toBe(0);
    expect(Math.max(firstTry, retry)).toBe(0);
  });
});

describe("rewriteScore — criteria A and C are restored", () => {
  it("both terms but meaning lost on the first try → 1, fixed on the retry → 2", () => {
    const firstTry = rewriteScore({ totalMarks: 3, termCount: 2, termsUsed: 2, criterionA: false, criterionC: true, phase: 1 });
    const retry = rewriteScore({ totalMarks: 3, termCount: 2, termsUsed: 2, criterionA: true, criterionC: true, phase: 2 });
    expect(firstTry).toBe(1);
    expect(retry).toBe(2);
    expect(Math.max(firstTry, retry)).toBe(2);
  });

  it("both terms but over 25 words (C lost) → 1", () => {
    expect(rewriteScore({ totalMarks: 3, termCount: 2, termsUsed: 2, criterionA: true, criterionC: false, phase: 1 })).toBe(1);
  });

  it("losing both A and C costs two marks (floored at 0)", () => {
    expect(rewriteScore({ totalMarks: 3, termCount: 2, termsUsed: 1, criterionA: false, criterionC: false, phase: 1 })).toBe(0);
    expect(rewriteScore({ totalMarks: 3, termCount: 2, termsUsed: 0, criterionA: false, criterionC: false, phase: 1 })).toBe(0);
  });

  it("termCount 0 can never earn the first-try full mark (0-of-0 terms is not 'all terms used')", () => {
    expect(rewriteScore({ totalMarks: 3, termCount: 0, termsUsed: 0, criterionA: true, criterionC: true, phase: 1 })).toBe(0);
    expect(rewriteScore({ totalMarks: 3, termCount: 0, termsUsed: 0, criterionA: true, criterionC: true, phase: 2 })).toBe(0);
  });
});

describe("rewriteScore — 3-term questions", () => {
  it("2 terms on the first try → 1, all 3 on the retry → 2", () => {
    const firstTry = rewriteScore({ totalMarks: 3, termCount: 3, termsUsed: 2, criterionA: true, criterionC: true, phase: 1 });
    const retry = rewriteScore({ totalMarks: 3, termCount: 3, termsUsed: 3, criterionA: true, criterionC: true, phase: 2 });
    expect(firstTry).toBe(1);
    expect(retry).toBe(2);
    expect(Math.max(firstTry, retry)).toBe(2);
  });

  it("all three terms on the first try with A and C → 3", () => {
    expect(rewriteScore({ totalMarks: 3, termCount: 3, termsUsed: 3, criterionA: true, criterionC: true, phase: 1 })).toBe(3);
  });
});

describe("rewriteScore — retry cap", () => {
  it("the retry cap is totalMarks - 1", () => {
    expect(rewriteRetryCap(3)).toBe(2);
    expect(rewriteRetryCap(5)).toBe(4);
  });
});

describe("invariant across the question bank", () => {
  it("a non-perfect first try always scores below the retry cap for every question", () => {
    const unit = getUnit(REWRITE_UNIT)!;
    const rewrite = unit.questions.filter((q) => q.type === "rewrite");
    expect(rewrite.length).toBeGreaterThan(0);

    for (const q of rewrite) {
      const termCount = getAnswer(q.id)?.targetTerms?.length ?? 0;
      const totalMarks = q.maxMarks;
      const retryCap = rewriteRetryCap(totalMarks);
      for (let termsUsed = 0; termsUsed <= termCount; termsUsed++) {
        for (const criterionA of [true, false]) {
          for (const criterionC of [true, false]) {
            const firstTry = rewriteScore({ totalMarks, termCount, termsUsed, criterionA, criterionC, phase: 1 });
            if (firstTry !== totalMarks) {
              expect(firstTry, `${q.id} termsUsed=${termsUsed} A=${criterionA} C=${criterionC}`).toBeLessThan(retryCap);
            }
          }
        }
      }
    }
  });
});