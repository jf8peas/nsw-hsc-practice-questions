// The review report's pure half (spec 008 R2): kept and skipped per paper with reasons, counts by form
// and mark value, rubric sources, and the MEDIAN_WORDS check that only looks at counted data.

import { describe, expect, it } from "vitest";

import { buildReport, medianProblems, type InventoryFile, type ReportQuestion } from "../../scripts/unseen-report-lib";

const q = (over: Partial<ReportQuestion>): ReportQuestion => ({
  id: "u.a-q1", paperShort: "Alpha", paperYear: 2025, qNo: 1, maxMarks: 3, form: "poem", suggestedWords: 192, suggestedFrom: "lines",
  modelOrigin: "school", criteriaOrigin: "school", ...over,
});

const inventory: InventoryFile = {
  paper: { short: "Alpha", year: 2025 },
  questions: [
    { qNo: 1, marks: 3, texts: ["Text 1"], forms: ["poem"], decision: "kept" },
    { qNo: 2, marks: 4, texts: ["Text 2"], forms: ["prose-fiction"], decision: "skipped", reason: "text_illegible" },
    { qNo: 5, marks: 8, texts: ["Text 1", "Text 2"], forms: [], decision: "skipped", reason: "two_or_more_texts" },
  ],
};

const base = { imagesBytes: 204800, promptVersion: "unseen-pilot-4", today: "2026-11-19" };

describe("buildReport", () => {
  it("lists kept and skipped questions per paper with their reasons", () => {
    const { markdown, problems } = buildReport({ ...base, inventories: [inventory], questions: [q({})] });
    expect(problems).toEqual([]);
    expect(markdown).toContain("### Alpha 2025 — 1 kept, 2 skipped");
    expect(markdown).toContain("Q2 (4 marks): skipped — text_illegible");
    expect(markdown).toContain("- poem: 1");
    expect(markdown).toContain("- 3 marks: 1");
    expect(markdown).toContain("folder size: 200 KB");
  });

  it("marks a drafted, unreviewed model answer", () => {
    const { markdown } = buildReport({ ...base, inventories: [], questions: [q({ modelOrigin: "drafted" }), q({ id: "u.a-q2", modelOrigin: "drafted", reviewedOn: "2026-11-20" })] });
    expect(markdown).toContain("u.a-q1: model drafted, NOT reviewed");
    expect(markdown).toContain("u.a-q2: model drafted, reviewed 2026-11-20");
  });

  it("reports a skip reason outside the fixed list", () => {
    const bad: InventoryFile = { ...inventory, questions: [{ qNo: 3, marks: 3, texts: [], forms: [], decision: "skipped", reason: "because" }] };
    const { problems } = buildReport({ ...base, inventories: [bad], questions: [] });
    expect(problems[0]).toContain("not in the fixed list");
  });
});

describe("medianProblems", () => {
  it("passes when the counted median matches MEDIAN_WORDS", () => {
    expect(medianProblems([q({ suggestedWords: 192 }), q({ id: "x", suggestedWords: 192 })])).toEqual([]);
  });

  it("fails when a mark value with counted data differs", () => {
    expect(medianProblems([q({ suggestedWords: 180 })])[0]).toContain("MEDIAN_WORDS[3] is 192");
  });

  it("does not check mark values with no counted data, nor questions on the median fallback", () => {
    expect(medianProblems([q({ maxMarks: 5, suggestedWords: 999, suggestedFrom: "median" })])).toEqual([]);
  });
});
