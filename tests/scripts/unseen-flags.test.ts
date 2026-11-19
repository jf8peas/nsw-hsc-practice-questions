// Exporting flagged answers as labelled test cases (spec 008 FR-036, research R11): an unlabelled "field"
// case under a field question built from the bank key, with no student identity and no duplicates, the
// frozen holdout set untouched, the try that decided the mark, and the regression script refusing an
// unlabelled case (skipped where Python or the gitignored pilot file is absent).

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getAnswer } from "@/content/answers";
import type { SkillVerdicts, UnseenPhaseRow } from "@/lib/db/schema";
import { SKILL_IDS } from "@/lib/unseen/skills";

import { CASE_KEYS, decidingTry, exportFieldCases, markerInputFor, noteFor, type PilotFile, type PilotQuestion } from "../../scripts/unseen-field-cases";

const UNIT = "y12-english-advanced-unseen-texts";
const POEM = `${UNIT}.fs25-q1`;
const VISUAL = `${UNIT}.fs23-q1`;

const holdout: PilotQuestion = {
  id: "chg23-q2", set: "holdout", anchors: [], source: "s", marks: 4, questionHeading: "h", question: "q", directive: "analyse",
  textForm: "poem", visual: false, text: "t", criteria: "c", notes: "n", suggestedWords: 288,
  cases: [{ id: "chg23-q2-a", origin: "authored", expectMark: [3, 3], expectMissed: [], answer: "A holdout answer." }],
};
const base = (): PilotFile => ({ questions: [structuredClone(holdout)] });
const GOOD = "Hostovsky shows that happiness is found in small things, using plain speech to make the reader feel it.";

describe("exportFieldCases", () => {
  it("adds an unlabelled student case under a field question built from the key, with the model answer as the anchor", () => {
    const out = exportFieldCases(base(), [{ questionId: POEM, text: GOOD, note: "flagged by a student." }]);
    expect(out.added).toBe(1);
    const field = out.file.questions.find((q) => q.id === "field-fs25-q1")!;
    expect(field.set).toBe("field");
    expect(field.marks).toBe(3);
    expect(field.criteria).toBe(getAnswer(POEM)!.unseen!.criteria);
    expect(field.anchors).toEqual(["field-fs25-q1-model"]);
    expect(field.cases[0]).toMatchObject({ id: "field-fs25-q1-model", expectMark: [3, 3], answer: getAnswer(POEM)!.unseen!.model });
    expect(field.cases[1]).toMatchObject({ origin: "student (flagged)", answer: GOOD, needsLabel: true });
    expect(field.cases[1].expectMark).toBeUndefined();
  });

  it("uses the app's rendering of the text, and the description for a visual text", () => {
    const out = exportFieldCases(base(), [{ questionId: POEM, text: GOOD, note: "n" }, { questionId: VISUAL, text: GOOD + " Also.", note: "n" }]);
    const poem = out.file.questions.find((q) => q.id === "field-fs25-q1")!;
    expect(poem.text).toBe(markerInputFor(POEM, "x").text);
    const visual = out.file.questions.find((q) => q.id === "field-fs23-q1")!;
    expect(visual.visual).toBe(true);
    expect(visual.text).toBe(getAnswer(VISUAL)!.unseen!.visual!.description);
  });

  it("carries the student's writing and nothing that identifies them", () => {
    const out = exportFieldCases(base(), [{ questionId: POEM, text: GOOD, note: "flagged by a student. Marker: 2/3, missed apt-evidence." }]);
    const c = out.file.questions.find((q) => q.id === "field-fs25-q1")!.cases[1];
    expect(Object.keys(c).sort()).toEqual([...CASE_KEYS].filter((k) => k in c).sort());
    const text = JSON.stringify(c);
    expect(text).not.toMatch(/email|userId|user_id|attemptId|attempt_id/i);
    expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(text).not.toMatch(/\b20\d\d-\d\d-\d\dT/);
  });

  it("leaves the holdout set untouched, skips duplicates and non-unseen ids, and does not mutate its input", () => {
    const file = base();
    const copy = structuredClone(file);
    const first = exportFieldCases(file, [{ questionId: POEM, text: GOOD, note: "n" }]);
    expect(file).toEqual(copy);
    expect(first.file.questions.find((q) => q.id === "chg23-q2")).toEqual(holdout);
    const again = exportFieldCases(first.file, [
      { questionId: POEM, text: `  ${GOOD.toUpperCase()}  `, note: "n" },
      { questionId: "y11-physics-preliminary.q1", text: "x", note: "n" },
      { questionId: POEM, text: GOOD + " A new one.", note: "n" },
    ]);
    expect(again).toMatchObject({ added: 1, skipped: 2 });
    const ids = again.file.questions.flatMap((q) => q.cases.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("the try that is exported", () => {
  const v = (missed: string[]): SkillVerdicts => Object.fromEntries(SKILL_IDS.map((id) => [id, { met: !missed.includes(id), reason: "r" }])) as SkillVerdicts;
  const row = (over: Partial<UnseenPhaseRow>) =>
    ({ ending: "retried", try1Text: "first", try1Mark: 1, try1Verdicts: v(["apt-evidence"]), try2Text: "second", try2Mark: 2, try2Verdicts: v([]), ...over }) as UnseenPhaseRow;

  it("is the retry when it scored at least as well, else the first try", () => {
    expect(decidingTry(row({})).text).toBe("second");
    expect(decidingTry(row({ try1Mark: 2 })).text).toBe("second");
    expect(decidingTry(row({ try1Mark: 3 })).text).toBe("first");
    expect(decidingTry(row({ ending: "declined", try2Text: null, try2Mark: null, try2Verdicts: null })).text).toBe("first");
  });

  it("notes the marks, the missed skills and the prompt version, never an id", () => {
    const n = noteFor(v(["apt-evidence", "succinct"]), 2, 3, "unseen-pilot-4");
    expect(n).toContain("2/3");
    expect(n).toContain("missed apt-evidence, succinct");
    expect(n).toContain("unseen-pilot-4");
    expect(noteFor(v([]), 3, 3, null)).toContain("met every skill");
  });
});

describe("the regression script refuses an unlabelled case", () => {
  const python = spawnSync("python", ["--version"], { encoding: "utf8" });
  const pilot = path.resolve("resources/english-unseen/pilot-questions.json");
  it.skipIf(python.status !== 0 || !fs.existsSync(pilot))("python scripts/pilot-unseen-marker.py --check fails while a case needsLabel", () => {
    const real = JSON.parse(fs.readFileSync(pilot, "utf8")) as PilotFile;
    const out = exportFieldCases(real, [{ questionId: POEM, text: "A brand new unlabelled answer about the poem that is easily long enough to pass the twenty word minimum.", note: "n" }]);
    const tmp = path.join(os.tmpdir(), `unseen-pilot-${process.pid}.json`);
    fs.writeFileSync(tmp, JSON.stringify(out.file));
    try {
      const res = spawnSync("python", ["scripts/pilot-unseen-marker.py", "--check", "--set", "all", "--data", tmp], { encoding: "utf8" });
      expect(res.status).toBe(1);
      expect(res.stdout).toContain("needsLabel");
      // labelled, it passes the data check
      const labelled = structuredClone(out.file);
      for (const q of labelled.questions) for (const c of q.cases) if (c.needsLabel) { c.needsLabel = false; c.expectMark = [2, 3]; c.expectMissed = []; }
      fs.writeFileSync(tmp, JSON.stringify(labelled));
      expect(spawnSync("python", ["scripts/pilot-unseen-marker.py", "--check", "--set", "all", "--data", tmp], { encoding: "utf8" }).stdout).not.toContain("needsLabel");
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  });
});
