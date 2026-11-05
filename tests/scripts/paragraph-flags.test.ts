// Exporting flagged answers as labelled test cases (spec 007 FR-030, research R8): an unlabelled
// "field" case with no student identity, no duplicates, the frozen India set untouched, and the
// regression script refusing an unlabelled case (skipped where Python or the gitignored pilot file is absent).

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { decidingTry, noteFor } from "../../scripts/paragraph-flags";
import { CASE_KEYS, exportFieldCases, type PilotEssay, type PilotFile } from "../../scripts/paragraph-field-cases";
import type { ParagraphPhaseRow, ParagraphVerdicts } from "@/lib/db/schema";

const Q = (part: number) => `y12-economics-paragraph-writing.e01p${part}`;
const india: PilotEssay = {
  id: "in", set: "holdout", economy: "India", type: "emerging", question: "q", directiveVerb: "evaluate", strategy: "s",
  brief: {}, sources: [], models: {}, markingNotes: {},
  cases: [{ id: "in-topic-strong", part: "topic", text: "India answer", fails: [], ambiguous: [] }],
};
const base = (): PilotFile => ({ essays: [structuredClone(india)] });

describe("exportFieldCases", () => {
  it("adds an unlabelled field case under a field essay built from the content key", () => {
    const out = exportFieldCases(base(), [{ questionId: Q(5), text: "Faster growth and lower poverty.", note: "flagged by a student." }]);
    expect(out.added).toBe(1);
    const field = out.file.essays.find((e) => e.id === "field-e01")!;
    expect(field.set).toBe("field");
    expect(field.economy).toBe("Vietnam");
    expect(field.directiveVerb).toBe("evaluate");
    expect(Object.keys(field.models)).toEqual(["topic", "mechanism", "evidence", "evaluation", "link"]);
    expect(field.cases).toHaveLength(1);
    expect(field.cases[0]).toMatchObject({ part: "link", text: "Faster growth and lower poverty.", fails: [], needsLabel: true });
  });

  it("carries the student's writing and nothing that identifies them", () => {
    const out = exportFieldCases(base(), [{ questionId: Q(3), text: "Some writing.", note: "flagged by a student. Marker: (a) met." }]);
    const c = out.file.essays.find((e) => e.id === "field-e01")!.cases[0];
    expect(Object.keys(c).sort()).toEqual([...CASE_KEYS].filter((k) => k in c).sort());
    const text = JSON.stringify(out.file.essays.find((e) => e.id === "field-e01"));
    expect(text).not.toMatch(/email|userId|user_id|attemptId|attempt_id|googleSub/i);
    expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i); // no uuid
    expect(text).not.toMatch(/\b20\d\d-\d\d-\d\dT/); // no timestamp
  });

  it("leaves the frozen holdout set untouched and skips duplicates", () => {
    const first = exportFieldCases(base(), [{ questionId: Q(1), text: "A topic sentence.", note: "n" }]);
    expect(first.file.essays.find((e) => e.id === "in")).toEqual(india);
    const again = exportFieldCases(first.file, [{ questionId: Q(1), text: "  A TOPIC  sentence. ", note: "n" }, { questionId: Q(2), text: "Mechanism text.", note: "n" }]);
    expect(again.added).toBe(1);
    expect(again.skipped).toBe(1);
    const ids = again.file.essays.flatMap((e) => e.cases.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("does not mutate its input and skips ids that are not paragraph questions", () => {
    const file = base();
    const copy = structuredClone(file);
    const out = exportFieldCases(file, [{ questionId: "y11-physics-preliminary.q1", text: "x", note: "n" }]);
    expect(file).toEqual(copy);
    expect(out).toMatchObject({ added: 0, skipped: 1 });
  });
});

describe("the try that is exported", () => {
  const v = (a: boolean): ParagraphVerdicts => ({ a: { met: a, reason: "r" }, b: { met: true, reason: "r" }, c: { met: true, reason: "r" }, d: { met: true, reason: "r" } });
  const row = (over: Partial<ParagraphPhaseRow>) => ({ ending: "corrected", phase1Text: "first", phase1Mark: 3, phase1Verdicts: v(false), phase2Text: "second", phase2Mark: 3, phase2Verdicts: v(true), ...over }) as ParagraphPhaseRow;
  it("is the correction when it scored at least as well, else the first try", () => {
    expect(decidingTry(row({})).text).toBe("second");
    expect(decidingTry(row({ phase2Mark: 2 })).text).toBe("first");
    expect(decidingTry(row({ ending: "no_correction", phase2Text: null, phase2Mark: null, phase2Verdicts: null })).text).toBe("first");
  });
  it("notes the marker's verdicts and the prompt version, never an id", () => {
    const n = noteFor(v(false), "round 5 (4 Nov 2026)");
    expect(n).toContain("(a) not met");
    expect(n).toContain("round 5 (4 Nov 2026)");
  });
});

describe("the regression script refuses an unlabelled case", () => {
  const python = spawnSync("python", ["--version"], { encoding: "utf8" });
  it.skipIf(python.status !== 0 || !fs.existsSync(path.resolve("resources/topic010/pilot-essays.json")))("python scripts/pilot-paragraph-marker.py --check fails while a case needsLabel", () => {
    const real = JSON.parse(fs.readFileSync(path.resolve("resources/topic010/pilot-essays.json"), "utf8")) as PilotFile;
    const out = exportFieldCases(real, [{ questionId: Q(4), text: "A brand new unlabelled evaluation.", note: "n" }]);
    const tmp = path.join(os.tmpdir(), `pilot-${process.pid}.json`);
    fs.writeFileSync(tmp, JSON.stringify(out.file));
    try {
      const res = spawnSync("python", ["scripts/pilot-paragraph-marker.py", "--check", "--data", tmp], { encoding: "utf8" });
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("needsLabel");
      // labelled, it passes the data check
      const labelled = structuredClone(out.file);
      for (const e of labelled.essays) for (const c of e.cases) if (c.needsLabel) { c.needsLabel = false; c.fails = ["a"]; }
      fs.writeFileSync(tmp, JSON.stringify(labelled));
      expect(spawnSync("python", ["scripts/pilot-paragraph-marker.py", "--check", "--data", tmp], { encoding: "utf8" }).stdout).not.toContain("needsLabel");
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  });
});
