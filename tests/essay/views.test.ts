import { describe, expect, it } from "vitest";

import type { EssayPhaseRow } from "@/lib/db/schema";
import { emptyScaffold } from "@/lib/essay/scaffold";
import type { PublicEssay } from "@/lib/essay/types";
import { resultView } from "@/lib/essay/views";

const essay: PublicEssay = { id: "u.e5", prompt: "q", verb: "evaluate", verbDefinition: "d", economy: "both", offer: 3 };
const criteria = {
  understanding: { verdict: "sound", reason: "r1" },
  theory: { verdict: "sound", reason: "r2" },
  assessment: { verdict: "developing", reason: "r3" },
  data: { verdict: "sound", reason: "r4" },
  structure: { verdict: "strong", reason: "r5" },
} as const;

function row(over: Partial<EssayPhaseRow> = {}): EssayPhaseRow {
  return {
    id: "1",
    attemptId: "a",
    userId: "u",
    unitId: "u",
    questionId: "u.e5",
    status: "finished",
    scaffold: emptyScaffold(),
    scaffoldWords: 0,
    scaffoldLockedAt: new Date(),
    review: { checks: [], figureFlags: [] },
    reviewPromptVersion: "essay-review-1",
    reviewModel: "m",
    reviewedAt: new Date(),
    markingStartedAt: null,
    essayText: "my essay",
    essayWords: 700,
    rawMark: 19,
    band: 1,
    finalMark: 12,
    coversBoth: false,
    criteria: { ...criteria },
    bandReason: "reason",
    lift: ["a", "b", "c"],
    flags: [{ quote: "q", why: "w" }],
    gaps: [{ conceptId: "u.c-x", detail: "missing" }],
    usedWell: ["u.c-y"],
    promptVersion: "essay-pilot-2",
    model: "m",
    gradedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as EssayPhaseRow;
}

const opts = { termOf: (id: string) => `term:${id}`, modelEssay: "MODEL" };

describe("the result view", () => {
  it("builds the finished result with the model essay, the cap flag, two lift points and gap terms", () => {
    const v = resultView(row(), essay, opts)!;
    expect(v).toMatchObject({ finalMark: 12, band: 1, capped: true, essayText: "my essay", words: 700, modelEssay: "MODEL" });
    expect(v.lift).toEqual(["a", "b"]);
    expect(v.gaps).toEqual([{ conceptId: "u.c-x", term: "term:u.c-x", detail: "missing" }]);
  });

  it("is not capped when the mark is the band's own", () => {
    expect(resultView(row({ rawMark: 18, finalMark: 18, coversBoth: true }), essay, opts)!.capped).toBe(false);
    // a mark outside its band is clamped first: raw 15 in band 1 is 17, so a recorded 17 is not capped
    expect(resultView(row({ rawMark: 15, finalMark: 17 }), essay, opts)!.capped).toBe(false);
  });

  it("leaves the model essay out when it is not passed", () => {
    expect("modelEssay" in resultView(row(), essay, { termOf: opts.termOf })!).toBe(false);
    expect("modelEssay" in resultView(row(), essay, { ...opts, modelEssay: null })!).toBe(false);
  });

  it("builds nothing for a row that is not finished", () => {
    expect(resultView(row({ status: "writing", finalMark: null, band: null, criteria: null, essayText: null }), essay, opts)).toBeNull();
    expect(resultView(row({ status: "planning" }), essay, opts)).toBeNull();
  });

  it("never carries the raw mark, the review, the notes or the tags", () => {
    const s = JSON.stringify(resultView(row(), essay, opts));
    for (const banned of ["rawMark", "review", "markingNotes", "schoolCriteria", "reviewPromptVersion", "usedWell", "promptVersion"]) {
      expect(s).not.toContain(banned);
    }
  });
});
