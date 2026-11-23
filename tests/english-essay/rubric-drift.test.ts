import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { englishConceptLines } from "@/content/units/y12-english-essay-writing/concepts";
import rubric from "@/lib/english-essay/rubric.json";
import { BANDS, FOCUS_CAPS, KNOWLEDGE_CAP, MAX_DEDUCTION } from "@/lib/english-essay/scoring";

// A prompt or concept edit without a new promptVersion fails here and blocks release (contracts/replies.md §3): the
// fixture binds the prompt version to the SHA-256 of the canonical rubric plus the one concept record. To change either:
// bump `promptVersion`, run `python scripts/pilot-english-essay-marker.py --write-golden`, and rerun the full marker gate.

const canonical = (v: unknown): string => {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
};

const FIXTURE = JSON.parse(readFileSync(path.resolve(__dirname, "../fixtures/english-essay-rubric.hash"), "utf8")) as { promptVersion: string; sha256: string };

describe("rubric drift", () => {
  it("the fixture binds this prompt version to the current rubric and concept record", () => {
    const sha = createHash("sha256").update(canonical({ rubric, concepts: englishConceptLines() }), "utf8").digest("hex");
    expect(FIXTURE.promptVersion).toBe(rubric.promptVersion);
    expect(sha).toBe(FIXTURE.sha256);
  });
});

describe("the scoring constants match the approved rubric", () => {
  it("bands", () => {
    expect(BANDS.map((b) => [b.band, b.min, b.max])).toEqual(rubric.bands.map((b) => [b.band, b.min, b.max]));
  });

  it("focus caps and the knowledge-error penalty", () => {
    expect(FOCUS_CAPS.partly).toBe(rubric.questionFocusCaps.partly);
    expect(FOCUS_CAPS.barely).toBe(rubric.questionFocusCaps.barely);
    expect(MAX_DEDUCTION).toBe(rubric.knowledgeErrorPenalty.max);
    expect(KNOWLEDGE_CAP).toBe(rubric.knowledgeErrorPenalty.capAtTwo);
    expect(rubric.knowledgeErrorPenalty.perError).toBe(1);
    expect(rubric.inventedQuoteIsKnowledgeError).toBe(true);
  });

  it("the word range is the app's 800 to 1,200", () => {
    expect(rubric.wordRange).toEqual([800, 1200]);
  });
});
