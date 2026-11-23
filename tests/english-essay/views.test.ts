import { describe, expect, it } from "vitest";

import type { EnglishEssayPhaseRow } from "@/lib/db/queries/english-essay-phases.server";
import { emptyEnglishEssayScaffold } from "@/lib/english-essay/scaffold";
import type { PublicEnglishEssay } from "@/lib/english-essay/types";
import { englishResultView, englishUnfinishedView } from "@/lib/english-essay/views";

// The release map (spec 011 data-model §10.2): what a finished owned row may show and what no view may ever carry.

const essay: PublicEnglishEssay = {
  type: "englishEssay",
  group: "englishEssay",
  maxMarks: 20,
  live: true,
  id: "y12-english-essay-writing.e1",
  prompt: "To what extent do you agree?",
  directive: "to what extent",
  directiveDefinition: "d",
  directiveGuidance: "unit",
  offer: 1,
  source: "Knox 2025 Trial, Q6",
  conceptIds: [],
};

const reason = (r: string) => ({ verdict: "sound" as const, reason: r });

function row(over: Partial<EnglishEssayPhaseRow> = {}): EnglishEssayPhaseRow {
  const scaffold = emptyEnglishEssayScaffold();
  scaffold.thesis = "PLAN THESIS";
  return {
    id: "r1",
    attemptId: "a1",
    userId: "u1",
    unitId: "y12-english-essay-writing",
    questionId: essay.id,
    status: "finished",
    scaffold,
    scaffoldWords: 2,
    scaffoldLockedAt: new Date(),
    review: { checks: [{ id: "thesis", status: "fix", line: "REVIEW LINE SECRET" }] },
    reviewPromptVersion: "r",
    reviewModel: "m",
    reviewedAt: new Date(),
    markingStartedAt: null,
    essayText: "THE ESSAY",
    essayWords: 900,
    rawMark: 19,
    band: 1,
    finalMark: 16,
    finalBand: 2,
    criteria: { argument: reason("a"), analysis: reason("b"), knowledge: reason("c"), expression: reason("d") },
    bandReason: "BAND REASON",
    lift: ["l1", "l2", "l3"],
    questionFocus: "fully",
    questionFocusReason: "FOCUS REASON",
    knowledgeErrors: [
      { quote: "wrong a", why: "why a", source: "marker" },
      { quote: "invented quote here", why: "check this quote: not found in the play", source: "quote-check" },
    ],
    quoteResults: [
      { quote: "good quote one two", status: "ok" },
      { quote: "near quote one two", status: "near", correct: "Exact play words", ratio: 0.9 },
      { quote: "invented quote here", status: "not-found", ratio: 0.2 },
      { quote: "other source phrase here", status: "other-source" },
    ],
    referenceTextHash: "h".repeat(64),
    gaps: [1, 2, 3, 4, 5, 6].map((n) => ({ conceptId: `c${n}`, detail: `gap detail ${n}` })),
    usedWell: ["USED-WELL-ID"],
    promptVersion: "eng-essay-pilot-5",
    model: "mock",
    gradedAt: new Date(),
    ...over,
  };
}

const view = (r = row(), modelEssay: string | null = "THE MODEL") => englishResultView(r, essay, { modelEssay, termOf: (id) => `term-${id}` })!;

describe("a finished owned result", () => {
  it("carries the final mark and band, the caps, four criteria, two lifts, focus, errors and flags", () => {
    const v = view();
    expect(v).toMatchObject({
      finalMark: 16,
      finalBand: 2,
      knowledgeCapApplied: true,
      focusCap: null,
      questionFocus: "fully",
      questionFocusReason: "FOCUS REASON",
      essayText: "THE ESSAY",
      words: 900,
      modelEssay: "THE MODEL",
    });
    expect(Object.keys(v.criteria)).toHaveLength(4);
    expect(v.lift).toEqual(["l1", "l2"]);
    expect(v.knowledgeErrors).toEqual([
      { quote: "wrong a", why: "why a" },
      { quote: "invented quote here", why: "check this quote: not found in the play" },
    ]);
    expect(v.plan.thesis).toBe("PLAN THESIS");
  });

  it("shows only near and not-found quotations, with the play's words for a near match only", () => {
    expect(view().quoteFlags).toEqual([
      { quote: "near quote one two", status: "near", correct: "Exact play words", ratio: 0.9 },
      { quote: "invented quote here", status: "not-found", ratio: 0.2 },
    ]);
  });

  it("lists at most five gaps with their terms and details", () => {
    const v = view();
    expect(v.gaps).toHaveLength(5);
    expect(v.gaps[0]).toEqual({ conceptId: "c1", term: "term-c1", detail: "gap detail 1" });
  });

  it("recomputes the cap explanation from the stored inputs", () => {
    const capped = view(row({ questionFocus: "partly", finalMark: 12, finalBand: 3 }));
    expect(capped).toMatchObject({ focusCap: 12, capped: true });
    const clean = view(row({ rawMark: 14, band: 2, finalMark: 14, finalBand: 2, knowledgeErrors: [], questionFocus: "fully" }));
    expect(clean).toMatchObject({ capped: false, knowledgeCapApplied: false, focusCap: null });
  });

  it("omits the model essay unless the caller passes it", () => {
    expect(view(row(), null)).not.toHaveProperty("modelEssay");
  });

  it("never carries the raw mark, the marker band, the review, the used-well ids, successful quotes or hashes", () => {
    const s = JSON.stringify(view());
    for (const secret of ["REVIEW LINE SECRET", "USED-WELL-ID", "good quote one two", "other source phrase here", "hhhhhhhh", "rawMark", "referenceTextHash", "usedWell", "markerBand", "conceptTags", "markingNotes"]) {
      expect(s).not.toContain(secret);
    }
    const v = view() as unknown as Record<string, unknown>;
    expect(v).not.toHaveProperty("band");
    expect(v).not.toHaveProperty("rawMark");
    expect(v).not.toHaveProperty("review");
  });
});

describe("an unfinished or incomplete row", () => {
  it("builds no result view", () => {
    expect(englishResultView(row({ status: "writing", finalMark: null }), essay, { termOf: String })).toBeNull();
    expect(englishResultView(row({ finalBand: null }), essay, { termOf: String })).toBeNull();
    expect(englishResultView(row({ quoteResults: null }), essay, { termOf: String })).toBeNull();
  });

  it("the unfinished view has only the public question, the plan and the draft", () => {
    const u = englishUnfinishedView(essay, row({ status: "writing" }), "MY DRAFT");
    expect(Object.keys(u).sort()).toEqual(["draft", "essay", "plan"]);
    expect(JSON.stringify(u)).not.toMatch(/REVIEW LINE|rawMark|finalMark|modelEssay|knowledgeErrors/);
  });
});
