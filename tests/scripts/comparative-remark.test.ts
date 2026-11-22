// The comparative unit's offline revision loop (spec 009 FR-027, tasks T049 and T050): a sample of real first tries from
// every mark band is re-markable by a stronger model; disagreements become unlabelled "field" cases in the pilot
// format (several texts, the choice, each answer's pick) with no student identity and no duplicates; the marker input
// is built as the app builds it (only picked texts); the re-mark never touches a daily-limit slot. Content is mocked.

import fs from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UnseenPhaseRow } from "@/lib/db/schema";
import { COMPARATIVE_SKILL_IDS } from "@/lib/unseen/skills";

import { CHOICE_Q, FIXED_Q, KEY, TEXTS, choiceQuestion, fixedQuestion } from "../helpers/comparative";

type Field = typeof import("../../scripts/comparative-field-cases");
let F: Field;

beforeEach(async () => {
  vi.resetModules();
  vi.doMock("@/content/units/y12-english-advanced-comparative-texts/questions", () => ({ questions: [fixedQuestion, choiceQuestion] }));
  vi.doMock("@/content/units/y12-english-advanced-comparative-texts/keys", () => ({ keys: { [FIXED_Q]: { ...KEY, pairing: [TEXTS.A, TEXTS.V] }, [CHOICE_Q]: KEY } }));
  F = await import("../../scripts/comparative-field-cases");
});
afterEach(() => {
  vi.doUnmock("@/content/units/y12-english-advanced-comparative-texts/questions");
  vi.doUnmock("@/content/units/y12-english-advanced-comparative-texts/keys");
});

const GOOD = "The poem measures waiting in sound whereas the image measures it in light, and each leaves the waiting person out of the frame.";
const empty = () => ({ questions: [] as import("../../scripts/comparative-field-cases").ComparativePilotQuestion[] });

describe("the field question", () => {
  it("is built from the key: all texts with headings (a visual as its description), the choice, and the model answer as the anchor", () => {
    const q = F.comparativeFieldQuestionFor("test-choice");
    expect(q).toMatchObject({ id: "field-test-choice", set: "field", marks: 6, directive: "compare", anchors: ["field-test-choice-model"] });
    expect(q.choice).toEqual(choiceQuestion.choice);
    expect(q.texts.map((t) => t.id)).toEqual(choiceQuestion.textIds);
    expect(q.texts.find((t) => t.id === TEXTS.V)).toMatchObject({ visual: true });
    expect(q.criteria).toBe(KEY.criteria);
    // the model answer's pick is the pairing's choosable text
    expect(q.cases[0]).toMatchObject({ id: "field-test-choice-model", answer: KEY.model, pick: [TEXTS.B], expectMark: [6, 6], allSkillsMet: true });
  });
  it("a fixed pair has no choice and no pick", () => {
    const q = F.comparativeFieldQuestionFor("test-fixed");
    expect(q.choice).toBeNull();
    expect(q.cases[0].pick).toBeUndefined();
  });
});

describe("exportComparativeFieldCases", () => {
  it("adds an unlabelled case with the pick and no identity", () => {
    const out = F.exportComparativeFieldCases(empty(), [{ questionId: CHOICE_Q, text: GOOD, pick: [TEXTS.V], note: "first try." }]);
    expect(out.added).toBe(1);
    const c = out.file.questions[0].cases.find((x) => x.needsLabel)!;
    expect(c).toMatchObject({ origin: "student (first try)", needsLabel: true, pick: [TEXTS.V], answer: GOOD });
    expect(Object.keys(c).every((k) => (F.COMPARATIVE_CASE_KEYS as readonly string[]).includes(k))).toBe(true);
    expect(JSON.stringify(out.file)).not.toMatch(/user|email|attempt|@/i);
  });

  it("skips a duplicate (same question, text and pick) but keeps the same text with a different pick", () => {
    const first = F.exportComparativeFieldCases(empty(), [{ questionId: CHOICE_Q, text: GOOD, pick: [TEXTS.B], note: "n" }]);
    const dup = F.exportComparativeFieldCases(first.file, [{ questionId: CHOICE_Q, text: `  ${GOOD}  `, pick: [TEXTS.B], note: "n" }]);
    expect(dup).toMatchObject({ added: 0, skipped: 1 });
    const other = F.exportComparativeFieldCases(first.file, [{ questionId: CHOICE_Q, text: GOOD, pick: [TEXTS.V], note: "n" }]);
    expect(other.added).toBe(1);
  });

  it("skips a question that is not in the bank or not a comparative question, and does not change its input", () => {
    const input = empty();
    const before = JSON.stringify(input);
    const out = F.exportComparativeFieldCases(input, [
      { questionId: "y12-english-advanced-comparative-texts.gone-q1", text: GOOD, note: "n" },
      { questionId: "y12-english-advanced-unseen-texts.fs25-q1", text: GOOD, note: "n" },
    ]);
    expect(out).toMatchObject({ added: 0, skipped: 2 });
    expect(JSON.stringify(input)).toBe(before);
  });

  it("writes cases the pilot script's data check accepts once labelled (fields the --unit comparative reader needs)", () => {
    const out = F.exportComparativeFieldCases(empty(), [{ questionId: FIXED_Q, text: GOOD, note: "n" }]);
    const q = out.file.questions[0];
    for (const k of ["id", "marks", "question", "directive", "choice", "texts", "criteria", "notes", "suggestedWords", "cases"]) expect(q).toHaveProperty(k);
    for (const t of q.texts) expect(Object.keys(t).sort()).toEqual(["heading", "id", "text", "textForm", "visual"]);
  });
});

describe("the marker input", () => {
  it("is built as the app builds it: only the fixed text and the picked one, a picked visual as its description", () => {
    const input = F.comparativeMarkerInputFor(CHOICE_Q, GOOD, [TEXTS.V]);
    expect(input.texts?.map((t) => t.visual)).toEqual([false, true]);
    expect(input.texts).toHaveLength(2);
    expect(input.modelAnswer).toBe(KEY.model);
    expect(input.maxMarks).toBe(6);
    expect(input.answer).toBe(GOOD);
  });
  it("refuses a choice question with no valid pick and a question no longer in the bank", () => {
    expect(() => F.comparativeMarkerInputFor(CHOICE_Q, GOOD, undefined)).toThrow();
    expect(() => F.comparativeMarkerInputFor(CHOICE_Q, GOOD, ["nope"])).toThrow();
    expect(() => F.comparativeMarkerInputFor("y12-english-advanced-comparative-texts.gone", GOOD, [])).toThrow();
  });
  it("a fixed pair sends both texts whatever the pick", () => {
    expect(F.comparativeMarkerInputFor(FIXED_Q, GOOD, undefined).texts).toHaveLength(2);
  });
});

describe("the try that decided the mark, and the note", () => {
  const verdicts = Object.fromEntries(COMPARATIVE_SKILL_IDS.map((id) => [id, { met: id !== "compares-texts", reason: "r" }]));
  const row = (over: Partial<UnseenPhaseRow>) =>
    ({ ending: "retried", try1Text: "first", try1Mark: 3, try1Verdicts: verdicts, try2Text: "second", try2Mark: 4, try2Verdicts: verdicts, ...over }) as unknown as UnseenPhaseRow;
  it("is the retry when it scored at least as well, else the first try", () => {
    expect(F.comparativeDecidingTry(row({})).text).toBe("second");
    expect(F.comparativeDecidingTry(row({ try2Mark: 2 })).text).toBe("first");
    expect(F.comparativeDecidingTry(row({ ending: "declined", try2Text: null })).text).toBe("first");
  });
  it("names the missed skills, comparison skills included, and the prompt version, without an id", () => {
    const note = F.comparativeNoteFor(verdicts as never, 3, 6, "comparative-pilot-1");
    expect(note).toContain("missed compares-texts");
    expect(note).toContain("comparative-pilot-1");
  });
});

describe("the remark script", () => {
  const src = fs.readFileSync(path.resolve(__dirname, "../../scripts/unseen-remark.ts"), "utf8");
  it("takes --unit comparative, reads only the comparative unit's phase rows, uses the comparative prompt and nine skills", () => {
    expect(src).toContain("--unit");
    expect(src).toContain("COMPARATIVE_UNIT_ID");
    expect(src).toContain("comparativeRubric");
    expect(src).toContain("COMPARATIVE_SKILL_IDS");
    expect(src).toContain("pilot-comparative.json");
  });
  it("never reserves a slot or touches daily usage, so a re-mark never counts against a student's day", () => {
    expect(src).not.toMatch(/reserveAiSlot|dailyAiUsage|aiUsedToday/);
  });
});
