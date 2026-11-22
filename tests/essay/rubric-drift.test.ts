import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { GLOSSARY } from "@/content/glossary";
import concepts from "@/lib/essay/concepts.json";
import rubric from "@/lib/essay/rubric.json";
import { BANDS, CRITERIA_IDS, MAX_GAPS, ONE_ECONOMY_CAP, VERDICTS } from "@/lib/essay/scoring";

describe("rubric.json against the app's constants", () => {
  it("has the AT1 bands the scoring module hard-codes (the prompt file stays server-only)", () => {
    expect(rubric.bands.map((b) => ({ band: b.band, min: b.min, max: b.max }))).toEqual(BANDS);
    expect(rubric.bands.find((b) => b.band === 3)!.max).toBe(ONE_ECONOMY_CAP);
  });

  it("has the five criteria, four verdicts and gap cap the parser expects", () => {
    expect(Object.keys(rubric.criteria)).toEqual([...CRITERIA_IDS]);
    expect(rubric.verdicts).toEqual([...VERDICTS]);
    expect(rubric.maxGaps).toBe(MAX_GAPS);
  });

  it("carries a meaning for every directive verb the essays use, matching the glossary", () => {
    for (const verb of ["assess", "evaluate", "explain", "analyse", "discuss"]) {
      const meaning = (rubric.verbMeanings as Record<string, string>)[verb];
      expect(meaning, verb).toBeTruthy();
      expect(`${meaning}.`).toBe(GLOSSARY[verb]);
    }
  });

  it("keeps the concept list out of the prompt file (it is public, the prompt is not)", () => {
    expect("concepts" in rubric).toBe(false);
    expect(Object.keys(concepts)).toHaveLength(26);
  });

  it("has a golden prompt for the pilot to compare", () => {
    const golden = fs.readFileSync(path.resolve(__dirname, "../fixtures/essay-golden-prompt.txt"), "utf8");
    expect(golden).toContain("Essay question:");
    // written by `python scripts/pilot-essay-marker.py --write-golden`; prompt.test.ts compares it with the app's prompt
    expect(rubric.promptVersion).toMatch(/^essay-pilot-\d+$/);
  });
});
