// validateUnseenRules (spec 008 FR-046, research R2): the shipped unit passes, and each rule has a
// failing case. The visual-text rules use a synthetic visual text built from the shipped poem.

import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { answers as realAnswers } from "@/content/units/y12-english-advanced-unseen-texts/answers";
import { MAX_IMAGE_BYTES, validateUnseenRules } from "@/lib/content-rules";
import type { AnswerSet, Unit, UnseenQuestion, UnseenText } from "@/lib/types";

const UNIT_ID = "y12-english-advanced-unseen-texts";
const TODAY = new Date("2026-11-20T00:00:00Z");

const unitOf = (): Unit => structuredClone(UNITS.find((u) => u.id === UNIT_ID)!);
const answersOf = (): AnswerSet => structuredClone(realAnswers);
// the poem question (Fort St 2025 Q1): these rules are exercised on it, whatever the bank's order
const firstQuestion = (u: Unit) => u.questions.find((q): q is UnseenQuestion => q.type === "unseen" && q.id.endsWith(".fs25-q1"))!;
const poemOf = (u: Unit) => u.texts!.find((t) => t.id === firstQuestion(u).textId)!;
const run = (u: Unit, a: AnswerSet, imageSize: (n: string) => number | null = () => 1000) => validateUnseenRules(u, a, TODAY, imageSize).join("\n");

describe("the shipped unit", () => {
  it("passes", () => {
    expect(validateUnseenRules(unitOf(), answersOf(), TODAY, () => 1000)).toEqual([]);
  });

  it("is ignored for a unit with no unseen questions", () => {
    const other = UNITS.find((u) => u.id === "y12-economics-sentence-writing")!;
    expect(validateUnseenRules(other, {}, TODAY)).toEqual([]);
  });
});

describe("rule 1: the source", () => {
  it("fails on a source that is not the paper in the school format", () => {
    const u = unitOf();
    firstQuestion(u).source = "Fort Street High School, 2025 Trial HSC, English Advanced Paper 1, Question 1";
    expect(run(u, answersOf())).toMatch(/source .* must be "Fort St 2025 Trial, Q1"/);
  });
  it("fails on a question number outside 1 to 4 and a year outside 2023 to 2026", () => {
    const u = unitOf();
    const q = firstQuestion(u);
    (q.paper as { qNo: number }).qNo = 5;
    q.paper.year = 2022;
    const out = run(u, answersOf());
    expect(out).toMatch(/paper.qNo must be 1 to 4/);
    expect(out).toMatch(/outside 2023 to 2026/);
  });
});

describe("rule 2: the text", () => {
  it("fails when the text id does not resolve, the HSC check is missing or in the future, or the form disagrees with the body", () => {
    const u = unitOf();
    firstQuestion(u).textId = "nope";
    expect(run(u, answersOf())).toMatch(/text nope not found/);
    const v = unitOf();
    poemOf(v).hscChecked = "";
    expect(run(v, answersOf())).toMatch(/hscChecked/);
    const w = unitOf();
    poemOf(w).hscChecked = "2999-01-01";
    expect(run(w, answersOf())).toMatch(/hscChecked/);
    const x = unitOf();
    poemOf(x).form = "visual";
    expect(run(x, answersOf())).toMatch(/does not match its body kind/);
  });
  it("fails on a text no question points at", () => {
    const u = unitOf();
    u.texts!.push({ ...poemOf(u), id: "orphan" });
    expect(run(u, answersOf())).toMatch(/orphan: no question points at this text/);
  });
});

describe("rule 3: skill tags", () => {
  it("fails with none, four, a repeat or a tag that is not a skill", () => {
    const none = unitOf();
    firstQuestion(none).concepts = [];
    expect(run(none, answersOf())).toMatch(/needs 1 to 3 skill tags/);
    const four = unitOf();
    const q = firstQuestion(four);
    q.concepts = [...unitOf().concepts!.slice(0, 4).map((c) => c.id)];
    expect(run(four, answersOf())).toMatch(/needs 1 to 3 skill tags, has 4/);
    const dup = unitOf();
    const d = firstQuestion(dup);
    d.concepts = [d.concepts[0], d.concepts[0]];
    expect(run(dup, answersOf())).toMatch(/repeated skill tag/);
    const bad = unitOf();
    firstQuestion(bad).concepts = [`${UNIT_ID}.c-vibes`];
    expect(run(bad, answersOf())).toMatch(/not one of the seven skills/);
  });
  it("fails when a skill concept is missing or does not clear after 2", () => {
    const u = unitOf();
    u.concepts![0].clearAfter = 3;
    expect(run(u, answersOf())).toMatch(/clearAfter must be 2/);
    const v = unitOf();
    v.concepts = v.concepts!.slice(1);
    expect(run(v, answersOf())).toMatch(/missing skill concept/);
  });
});

describe("rule 4: marks, parts, verb, outcome", () => {
  it("fails on bad marks, parts that do not add up, an undefined verb and a bad outcome", () => {
    const u = unitOf();
    const q = firstQuestion(u);
    q.maxMarks = 9;
    expect(run(u, answersOf())).toMatch(/maxMarks must be a whole number from 1 to 6/);
    const v = unitOf();
    firstQuestion(v).parts = [{ label: "a", text: "x", marks: 1 }];
    expect(run(v, answersOf())).toMatch(/parts marks do not add up/);
    const w = unitOf();
    firstQuestion(w).verb = "ponder";
    expect(run(w, answersOf())).toMatch(/verb "ponder" has no definition/);
    const x = unitOf();
    (firstQuestion(x) as { outcome: string }).outcome = "EAV-12-09";
    expect(run(x, answersOf())).toMatch(/outcome must be/);
  });
});

describe("rule 5: the suggested length", () => {
  it("fails on a missing length, lines that are not a multiple of 12, and a wrong median", () => {
    const u = unitOf();
    firstQuestion(u).suggestedWords = 0;
    expect(run(u, answersOf())).toMatch(/suggestedWords must be set/);
    const v = unitOf();
    firstQuestion(v).suggestedWords = 200;
    expect(run(v, answersOf())).toMatch(/answer lines × 12/);
    const w = unitOf();
    const q = firstQuestion(w);
    q.suggestedFrom = "median";
    q.suggestedWords = 200;
    expect(run(w, answersOf())).toMatch(/must be the median 192 for 3 marks/);
  });
});

describe("rule 6: the key", () => {
  const id = () => firstQuestion(unitOf()).id;
  it("fails with no key, empty criteria, a missing band line, empty notes and an unusable model answer", () => {
    const none = answersOf();
    delete none[id()];
    expect(run(unitOf(), none)).toMatch(/no unseen answer key/);
    const empty = answersOf();
    empty[id()].unseen!.criteria = " ";
    expect(run(unitOf(), empty)).toMatch(/criteria are empty/);
    const band = answersOf();
    band[id()].unseen!.criteria = "3 – Provides effective analysis.\n2 – Provides analysis.";
    expect(run(unitOf(), band)).toMatch(/no band line for 1 mark/);
    const notes = answersOf();
    notes[id()].unseen!.notes = "";
    expect(run(unitOf(), notes)).toMatch(/notes are empty/);
    const short = answersOf();
    short[id()].unseen!.model = "Too short to be a model answer.";
    expect(run(unitOf(), short)).toMatch(/at least 40/);
    const long = answersOf();
    long[id()].unseen!.model = Array.from({ length: 250 }, () => "word").join(" ");
    expect(run(unitOf(), long)).toMatch(/more than a student could submit \(244\)/);
  });
});

describe("rule 7: drafted material must be reviewed", () => {
  it("fails for a drafted model answer with no reviewedOn date, and passes once it is reviewed", () => {
    const a = answersOf();
    const id = firstQuestion(unitOf()).id;
    a[id].unseen!.modelOrigin = "drafted";
    expect(run(unitOf(), a)).toMatch(/need a reviewedOn date/);
    a[id].unseen!.reviewedOn = "2026-11-19";
    expect(run(unitOf(), a)).toBe("");
    a[id].unseen!.reviewedOn = "2999-01-01";
    expect(run(unitOf(), a)).toMatch(/need a reviewedOn date/);
  });
});

/** The shipped poem turned into a visual text with a description and a passing check. */
function visual(over: { alt?: string; description?: string; adequate?: boolean; hashOf?: string } = {}) {
  const u = unitOf();
  const a = answersOf();
  const q = firstQuestion(u);
  const text = u.texts!.find((t) => t.id === q.textId)!;
  const description = over.description ?? "A black and white drawing of a crowded round banquet table seen from above, with cut-off arms and bowls.";
  (text as UnseenText).form = "visual";
  (text as UnseenText).body = { kind: "image", image: text.id, alt: over.alt ?? "Text 1 - Image: a black and white line drawing" };
  const hash = createHash("sha256").update(over.hashOf ?? description, "utf8").digest("hex");
  a[q.id].unseen!.visual = {
    description,
    check: { adequate: over.adequate ?? true, checkedAt: "2026-11-19", promptVersion: "unseen-pilot-4", model: "m", samples: 3, descriptionHash: hash },
  };
  return { u, a, textId: text.id };
}

describe("rule 8: a visual text", () => {
  it("passes with an image in the size limit, a neutral alt, a description and a current passed check", () => {
    const { u, a, textId } = visual();
    expect(run(u, a, (n) => (n === textId ? 120_000 : 1000))).toBe("");
  });
  it("fails with no image file, an image over the size limit, or an empty or over-long alt", () => {
    const { u, a } = visual();
    expect(run(u, a, () => null)).toMatch(/no image file/);
    expect(run(u, a, () => MAX_IMAGE_BYTES + 1)).toMatch(/at most 300 KB/);
    const empty = visual({ alt: " " });
    expect(run(empty.u, empty.a, () => 1)).toMatch(/alt must be a short neutral label/);
    const long = visual({ alt: "x".repeat(251) });
    expect(run(long.u, long.a, () => 1)).toMatch(/alt must be a short neutral label/);
  });
  it("fails when alt repeats the description", () => {
    const d = "A round table seen from above, crowded with plates, bowls, glasses and chopsticks.";
    const { u, a } = visual({ description: d, alt: d });
    expect(run(u, a, () => 1)).toMatch(/alt shares a 40-character run with the description/);
  });
  it("fails with no description, no check, a failed check, or a description edited since it passed", () => {
    const none = visual();
    delete none.a[firstQuestion(none.u).id].unseen!.visual;
    expect(run(none.u, none.a, () => 1)).toMatch(/no written description/);
    const noCheck = visual();
    delete noCheck.a[firstQuestion(noCheck.u).id].unseen!.visual!.check;
    expect(run(noCheck.u, noCheck.a, () => 1)).toMatch(/description check has not been run/);
    const failed = visual({ adequate: false });
    expect(run(failed.u, failed.a, () => 1)).toMatch(/the description check failed/);
    const edited = visual({ hashOf: "an older description" });
    expect(run(edited.u, edited.a, () => 1)).toMatch(/description changed since its check passed/);
  });
});

describe("rule 9: key text in public strings", () => {
  it("fails when a model-answer run appears in the question, a part, the alt, a concept or the guide", () => {
    const id = firstQuestion(unitOf()).id;
    const model = realAnswers[id].unseen!.model;
    const run60 = model.slice(10, 90);
    const q = unitOf();
    firstQuestion(q).prompt += " " + run60;
    expect(run(q, answersOf())).toMatch(/key text appears in public text/);
    const c = unitOf();
    c.concepts![0].description = run60.slice(0, 60);
    expect(run(c, answersOf())).toMatch(/key text appears in public text/);
    const g = unitOf();
    g.guide!.items[0].text += " " + run60;
    expect(run(g, answersOf())).toMatch(/key text appears in public text/);
  });
  it("fails when the criteria or notes appear in the unit description", () => {
    const id = firstQuestion(unitOf()).id;
    const u = unitOf();
    u.description += " " + realAnswers[id].unseen!.notes.slice(0, 80);
    expect(run(u, answersOf())).toMatch(/key text appears in public text/);
  });
  it("allows the criteria to share the question's own wording and the model to quote the stimulus", () => {
    expect(validateUnseenRules(unitOf(), answersOf(), TODAY, () => 1000)).toEqual([]);
  });
  it("lets the criteria restate the whole prompt (as school criteria do) but still stops the notes and model doing so", () => {
    const id = firstQuestion(unitOf()).id;
    const prompt = "How does the poet use the tide to show the weight of remembering across a whole life?";
    const q = unitOf();
    firstQuestion(q).prompt = prompt;
    const ok = answersOf();
    ok[id].unseen!.criteria = `3 – Provides effective analysis of ${prompt.slice(0, -1).toLowerCase()}`;
    expect(run(q, ok)).not.toMatch(/key text appears in public text/);
    const bad = answersOf();
    bad[id].unseen!.notes = `- ${prompt.toLowerCase()}`;
    expect(run(q, bad)).toMatch(/key text appears in public text/);
  });
});

describe("rule 10: duplicate ids", () => {
  it("fails on two texts with one id", () => {
    const u = unitOf();
    u.texts!.push({ ...poemOf(u) });
    expect(run(u, answersOf())).toMatch(/duplicate text id/);
  });
});
