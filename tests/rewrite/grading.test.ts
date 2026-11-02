import { beforeEach, describe, expect, it, vi } from "vitest";

import { gradeRewriteAnswer } from "@/lib/grading.server";

// Mock the LLM call so the tests drive the grading logic with a stand-in grader (FR-036).
vi.mock("@/lib/openrouter.server", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/openrouter.server")>();
  return { ...original, gradeRewrite: vi.fn() };
});

import { gradeRewrite } from "@/lib/openrouter.server";

const mockGradeRewrite = gradeRewrite as unknown as ReturnType<typeof vi.fn>;

// A real rewrite question: r21 targets tariff, imports, domestic-producers.
const QID = "y12-economics-sentence-writing.r21";

// The three target terms, as the stand-in grader would name them.
const TERMS = ["tariff", "imports", "domestic producers"];

function llmReply(over: Partial<{ criterionA: boolean; padding: boolean; terms: Array<{ term: string; status: string }> }> = {}) {
  mockGradeRewrite.mockResolvedValue({
    criterionA: true,
    padding: false,
    terms: TERMS.map((term) => ({ term, status: "used" })),
    feedback: "Fake rewrite grader.",
    gradedBy: "fake",
    ...over,
  });
}

const allBut = (term: string, status = "missing") =>
  TERMS.map((t) => ({ term: t, status: t === term ? status : "used" }));

describe("gradeRewriteAnswer (spec 005)", () => {
  beforeEach(() => {
    mockGradeRewrite.mockReset();
  });

  it("a phase 1 answer that keeps the meaning, uses every term and is concise scores 3/3 and skips phase 2 (no hint)", async () => {
    llmReply();
    const out = await gradeRewriteAnswer(QID, "A tariff makes imports dearer, so consumers buy more from domestic producers.", 1);
    expect(out?.result.marksAwarded).toBe(3);
    expect(out?.result.hint).toBeUndefined();
    expect(out?.result.discussion?.modelSentences.length).toBeGreaterThan(0);
    expect(out?.result.termOutcomes.every((o) => o.correct)).toBe(true);
  });

  it("criterion (b) is all or nothing: one missing term loses the term mark even when the rest are used", async () => {
    llmReply({ terms: allBut("tariff") });
    const out = await gradeRewriteAnswer(QID, "Imports became dearer and consumers bought more from domestic producers.", 1);
    expect(out?.result.marksAwarded).toBe(2); // A + C, no B
    expect(out?.result.termOutcomes.some((o) => !o.correct)).toBe(true);
  });

  it("the hint lists only the missed terms with their definitions", async () => {
    llmReply({ terms: allBut("tariff", "misused") });
    const out = await gradeRewriteAnswer(QID, "Imports stayed cheap and nothing changed at home.", 1);
    expect(out?.result.hint?.terms.map((t) => t.term)).toEqual(["tariff"]);
    expect(out?.result.hint?.terms[0]?.definition.length).toBeGreaterThan(0);
  });

  it("phase 2 is capped at 2 marks and the recorded mark keeps the best of the two (FR-019)", async () => {
    // Phase 1 scores 2 (one term missing), phase 2 would score 3 but is capped at 2.
    llmReply({ terms: allBut("domestic producers") });
    const p1 = await gradeRewriteAnswer(QID, "A tariff makes imports dearer but buyers did not switch.", 1);
    expect(p1?.result.marksAwarded).toBe(2);
    expect(p1?.result.hint?.terms.length).toBe(1);

    llmReply(); // all terms used now
    const p2 = await gradeRewriteAnswer(QID, "A tariff makes imports dearer, so consumers buy more from domestic producers.", 2);
    expect(p2?.result.marksAwarded).toBe(2); // capped
  });

  it("when every term is used but criterion (a) is lost, the hint names the lost criterion with no terms (FR-045)", async () => {
    llmReply({ criterionA: false });
    const out = await gradeRewriteAnswer(QID, "Tariffs, imports and domestic producers are all economics words.", 1);
    expect(out?.result.marksAwarded).toBe(2); // B + C
    expect(out?.result.hint?.terms).toEqual([]);
    expect(out?.result.hint?.lostCriterion).toBe("a");
  });

  it("a rewrite over 25 words loses the conciseness mark even when the grader sees no padding", async () => {
    llmReply();
    const long = "A tariff is a tax that makes imported goods and services more expensive, and because of that consumers end up buying more from the domestic producers who make things at home.";
    expect(long.split(/\s+/).length).toBeGreaterThan(25);
    const out = await gradeRewriteAnswer(QID, long, 1);
    expect(out?.result.marksAwarded).toBe(2); // A + B, no C
  });

  it("falls back to self-marking (needsSelfMark) when the grader is unavailable", async () => {
    mockGradeRewrite.mockResolvedValue(null);
    const out = await gradeRewriteAnswer(QID, "A tariff makes imports dearer.", 1);
    expect(out?.result.needsSelfMark).toBe(true);
    expect(out?.result.marksAwarded).toBeNull();
  });
});
