// The comparative bank's review report (spec 009 FR-032, research R12, task T056): per paper kept and skipped with reasons,
// counts by mark value and by fixed pair or choice, the rubric source with each choice question's pairing, orphan texts,
// and the medians counted for 7 and 8 marks, which MEDIAN_WORDS must match (a median-fallback question for a mark value
// with no median cannot ship).

import { describe, expect, it } from "vitest";

import { MEDIAN_WORDS } from "../../lib/unseen/limits";
import { buildComparativeReport, comparativeMedianProblems, countedMedians, type ComparativeInventoryFile, type ComparativeReportQuestion } from "../../scripts/comparative-report-lib";

const q = (over: Partial<ComparativeReportQuestion>): ComparativeReportQuestion => ({
  id: "y12-english-advanced-comparative-texts.a-q5", paperShort: "A", paperYear: 2024, qNo: 5, maxMarks: 6, kind: "fixed", texts: ["Text 4", "Text 5"], pairing: [],
  suggestedWords: 216, suggestedFrom: "lines", modelOrigin: "school", criteriaOrigin: "school", ...over,
});

const inv = (): ComparativeInventoryFile[] => [
  {
    paper: { short: "Abbotsleigh", year: 2024 },
    questions: [
      { qNo: 1, marks: 4, texts: ["Text 1"], forms: ["poem"], decision: "kept" },
      { qNo: 5, marks: 6, texts: ["Text 5", "Text 1 OR 2"], forms: ["non-fiction", "poem"], decision: "kept", choice: { fixed: ["t5"], from: ["t1", "t2"], pick: 1 } },
    ],
  },
  { paper: { short: "Roseville", year: 2026 }, questions: [{ qNo: 5, marks: 6, texts: ["Text 5", "Text 4"], forms: ["prose-fiction", "visual"], decision: "skipped", reason: "scan_needs_ocr" }] },
  { paper: { short: "Cheltenham Girls", year: 2023 }, questions: [{ qNo: 1, marks: 3, texts: ["Text 1", "Text 2"], forms: ["visual", "visual"], decision: "skipped", reason: "reserved_holdout" }] },
  { paper: { short: "Only Single", year: 2025 }, questions: [{ qNo: 1, marks: 4, texts: ["Text 1"], forms: ["poem"], decision: "kept" }] },
];

describe("the report", () => {
  it("lists, per paper that has a multi-text question, what was kept and skipped with reasons, and leaves out single-text papers and questions", () => {
    const { markdown } = buildComparativeReport({ inventories: inv(), questions: [], unusedTexts: [], promptVersion: "comparative-pilot-1", today: "2026-11-20" });
    expect(markdown).toContain("### Abbotsleigh 2024 — 1 kept, 0 skipped");
    expect(markdown).toContain("- Q5 (6 marks, choice; non-fiction + poem): kept");
    expect(markdown).not.toContain("Q1 (4 marks");
    expect(markdown).toContain("### Roseville 2026 — 0 kept, 1 skipped");
    expect(markdown).toContain("- Q5 (6 marks, fixed pair): skipped — scan_needs_ocr");
    expect(markdown).toContain("reserved_holdout");
    expect(markdown).not.toContain("Only Single");
    expect(markdown).toContain("Total: 1 kept, 2 skipped across 3 paper(s).");
    expect(markdown).toContain("comparative marker prompt comparative-pilot-1");
  });

  it("counts by mark value and by question type, with a box to approve each section", () => {
    const rows = [q({ id: "a1" }), q({ id: "a2", maxMarks: 8, kind: "choice", pairing: ["Text 5", "Text 2"], suggestedWords: 288 }), q({ id: "a3", kind: "choice" })];
    const { markdown } = buildComparativeReport({ inventories: [], questions: rows, unusedTexts: [], promptVersion: "p", today: "d" });
    expect(markdown).toContain("- 6 marks: 2");
    expect(markdown).toContain("- 8 marks: 1");
    expect(markdown).toContain("- fixed pair: 1");
    expect(markdown).toContain("- choice: 2");
    expect(markdown).toContain("- [ ] Approved");
  });

  it("shows the rubric source per question, drafted material as reviewed or NOT reviewed, and a choice question's pairing as one possible pairing", () => {
    const rows = [
      q({ id: "a1", modelOrigin: "drafted", criteriaOrigin: "drafted" }),
      q({ id: "a2", modelOrigin: "drafted", reviewedOn: "2026-11-19", kind: "choice", pairing: ["Text 5", "Text 2"] }),
    ];
    const { markdown } = buildComparativeReport({ inventories: [], questions: rows, unusedTexts: [], promptVersion: "p", today: "d" });
    expect(markdown).toContain("- a1: model drafted, NOT reviewed; criteria drafted");
    expect(markdown).toContain("- a2: model drafted, reviewed 2026-11-19; criteria school");
    expect(markdown).toContain("the model answer's pairing: Text 5 and Text 2 (one possible pairing; any allowed pairing earns full marks)");
  });

  it("lists texts in the shared store that no question of either unit shows", () => {
    const some = buildComparativeReport({ inventories: [], questions: [], unusedTexts: ["zz-t9"], promptVersion: "p", today: "d" }).markdown;
    expect(some).toContain("- zz-t9");
    expect(buildComparativeReport({ inventories: [], questions: [], unusedTexts: [], promptVersion: "p", today: "d" }).markdown).toContain("- none");
  });

  it("reports a skip reason that is not in the fixed list as a problem", () => {
    const bad: ComparativeInventoryFile[] = [{ paper: { short: "X", year: 2025 }, questions: [{ qNo: 5, marks: 6, texts: ["a", "b"], forms: [], decision: "skipped", reason: "vibes" }] }];
    const { problems } = buildComparativeReport({ inventories: bad, questions: [], unusedTexts: [], promptVersion: "p", today: "d" });
    expect(problems.join("\n")).toContain('skip reason "vibes" is not in the fixed list');
  });
});

describe("the medians for 7 and 8 marks", () => {
  it("counts the median per mark value from answer lines only", () => {
    const rows = [q({ maxMarks: 8, suggestedWords: 288 }), q({ maxMarks: 8, suggestedWords: 360 }), q({ maxMarks: 8, suggestedWords: 999, suggestedFrom: "median" })];
    expect(countedMedians(rows).get(8)).toEqual({ median: 324, n: 2 });
  });

  it("asks for MEDIAN_WORDS to be corrected when a counted 7 or 8 mark median differs from it (or is missing)", () => {
    const rows = [q({ maxMarks: 7, suggestedWords: 300 }), q({ maxMarks: 7, suggestedWords: 300 })];
    const msg = comparativeMedianProblems(rows).join("\n");
    expect(MEDIAN_WORDS[7] === 300 || msg.includes("MEDIAN_WORDS[7]")).toBe(true);
    if (MEDIAN_WORDS[7] === undefined) expect(msg).toContain("MEDIAN_WORDS[7] is missing");
  });

  it("is quiet when the table matches, and does not check marks 3 to 6 (spec 008's table, counted over its own papers)", () => {
    const rows = [q({ maxMarks: 6, suggestedWords: 111 }), q({ maxMarks: 3, suggestedWords: 5 })];
    expect(comparativeMedianProblems(rows)).toEqual([]);
  });

  it("a question that falls back to a median for a mark value with no median is a problem, so it cannot ship", () => {
    const rows = [q({ id: "needs-median", maxMarks: 8, suggestedFrom: "median", suggestedWords: 0 })];
    if (MEDIAN_WORDS[8] === undefined) expect(comparativeMedianProblems(rows).join("\n")).toContain("needs-median: its answer lines cannot be counted and there is no median for 8 marks yet");
    else expect(comparativeMedianProblems(rows)).toEqual([]);
  });
});
