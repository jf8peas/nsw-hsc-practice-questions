// validateComparativeRules (spec 009 FR-028 to FR-031, research R12, task T015): a synthetic comparative unit
// passes, and each rule has a failing case. The unit is built from two real texts of the shared store, so the
// rules run on genuine content shapes without any comparative question having shipped.

import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { MAX_IMAGE_BYTES } from "@/lib/content-rules";
import { validateComparativeRules } from "@/lib/content-rules-comparative";
import { concepts } from "@/content/units/y12-english-advanced-comparative-texts/concepts";
import { meta } from "@/content/units/y12-english-advanced-comparative-texts/meta";
import { UNITS } from "@/content";
import { storeTexts } from "@/content/units/y12-english-advanced-unseen-texts/store-texts";
import type { AnswerSet, ComparativeKey, ComparativeQuestion, Unit, UnseenText } from "@/lib/types";
import { sourceOf } from "@/lib/unseen/source";
import { COMPARATIVE_SKILL_IDS, comparativeSkillConceptId } from "@/lib/unseen/skills";

const CMP = "y12-english-advanced-comparative-texts";
const TODAY = new Date("2026-11-20T00:00:00Z");
const verbs = { compare: "Show how things are similar or different.", evaluate: "Make a judgement based on criteria." };

const written = storeTexts.filter((t) => t.body.kind !== "image" && t.hscChecked);
const [t1, t2, t3] = written;
const visual = (): UnseenText => ({
  id: "vis-t9", form: "visual", heading: "Text 9 – Image", title: "", author: "", sourceLine: "As printed in a trial paper.",
  body: { kind: "image", image: "vis-t9", alt: "A photograph" }, hscChecked: "2026-11-19",
});

const MODEL = "Both texts present a quiet kind of loss, whereas the first makes it physical and the second makes it social, and each shapes the reader's sympathy through a different technique that this answer names, quotes and weighs against the other in turn.";
const key = (over: Partial<ComparativeKey> = {}): ComparativeKey => ({
  criteria: "6 – Skilful comparison\n5 – Effective comparison\n4 – Sound comparison\n3 – Some comparison\n2 – Limited\n1 – Little",
  notes: "None provided by the school.",
  model: MODEL,
  modelOrigin: "school",
  criteriaOrigin: "school",
  pairing: [t1.id, t2.id],
  ...over,
});

const paper = { school: "Invented", short: "Invented", year: 2026, exam: "Trial" as const, qNo: 5 as const };
const base = (over: Partial<ComparativeQuestion>): ComparativeQuestion => ({
  id: `${CMP}.inv26-q5`, type: "comparative", group: "comparative",
  prompt: "Compare how the two texts represent loss.", maxMarks: 6, verb: "compare",
  suggestedWords: 216, suggestedFrom: "lines", paper, outcome: "EAV-12-01",
  concepts: [comparativeSkillConceptId("compares-texts")], source: sourceOf(paper),
  textIds: [t1.id, t2.id], choice: null, ...over,
});

function unitOf(questions: ComparativeQuestion[], texts: UnseenText[] = [t1, t2, t3]): Unit {
  return { ...meta, concepts: structuredClone(concepts), questions, texts: structuredClone(texts) } as unknown as Unit;
}
const answersFor = (qs: ComparativeQuestion[], k: ComparativeKey = key()): AnswerSet =>
  Object.fromEntries(qs.map((q) => [q.id, { rubric: [], comparative: structuredClone(k) }]));

const fixed = () => base({});
const choice = () =>
  base({ id: `${CMP}.inv26-q6`, textIds: [t1.id, t2.id, t3.id], choice: { fixed: [t1.id], from: [t2.id, t3.id], pick: 1 } });
const good = () => {
  const qs = [fixed(), choice()];
  return { u: unitOf(qs), a: answersFor(qs) };
};
const partners = UNITS.filter((u) => u.id === "y12-english-advanced-unseen-texts");
const run = (u: Unit, a: AnswerSet, size: (n: string) => number | null = () => 1000) =>
  validateComparativeRules(u, a, verbs, partners, TODAY, size).join("\n");

describe("a good comparative unit", () => {
  it("passes (a fixed pair and a choice question)", () => {
    const { u, a } = good();
    expect(validateComparativeRules(u, a, verbs, partners, TODAY, () => 1000)).toEqual([]);
  });
  it("is ignored when the unit has no comparative questions", () => {
    expect(validateComparativeRules(unitOf([]), {}, verbs, partners, TODAY)).toEqual([]);
  });
});

describe("the nine skills", () => {
  it("fails when a skill concept is missing, does not clear after 2, or the draw is not the comparative one", () => {
    const { u, a } = good();
    u.concepts = u.concepts!.slice(1);
    expect(run(u, a)).toMatch(/missing skill concept/);
    const v = good();
    v.u.concepts![0].clearAfter = 3;
    expect(run(v.u, v.a)).toMatch(/clearAfter must be 2/);
    const w = good();
    (w.u as { draw?: unknown }).draw = { kind: "unseen-weighted" };
    expect(run(w.u, w.a)).toMatch(/comparative-weighted/);
  });
  it("fails on a tag that is not one of the nine skills, none, four or a repeat", () => {
    const bad = good();
    (bad.u.questions[0] as ComparativeQuestion).concepts = [`${CMP}.c-vibes`];
    expect(run(bad.u, bad.a)).toMatch(/not one of the nine skills/);
    const none = good();
    (none.u.questions[0] as ComparativeQuestion).concepts = [];
    expect(run(none.u, none.a)).toMatch(/needs 1 to 3 skill tags/);
    const four = good();
    (four.u.questions[0] as ComparativeQuestion).concepts = COMPARATIVE_SKILL_IDS.slice(0, 4).map(comparativeSkillConceptId);
    expect(run(four.u, four.a)).toMatch(/has 4/);
    const dup = good();
    (dup.u.questions[0] as ComparativeQuestion).concepts = [comparativeSkillConceptId("compares-texts"), comparativeSkillConceptId("compares-texts")];
    expect(run(dup.u, dup.a)).toMatch(/repeated skill tag/);
  });
});

describe("the texts and the choice", () => {
  it("fails when a text does not resolve, is repeated, or no question shows it", () => {
    const g = good();
    (g.u.questions[0] as ComparativeQuestion).textIds = [t1.id, "nope"];
    expect(run(g.u, g.a)).toMatch(/text nope not found/);
    const dup = good();
    (dup.u.questions[0] as ComparativeQuestion).textIds = [t1.id, t1.id];
    expect(run(dup.u, dup.a)).toMatch(/repeats a text/);
    const orphan = unitOf([fixed()], [t1, t2, t3]);
    expect(run(orphan, answersFor([fixed()]))).toMatch(new RegExp(`${t3.id}: no question of`));
  });
  it("fails on a fixed pair that does not show exactly two texts", () => {
    const g = good();
    (g.u.questions[0] as ComparativeQuestion).textIds = [t1.id, t2.id, t3.id];
    expect(run(g.u, g.a)).toMatch(/exactly 2 texts/);
  });
  it("fails on an inconsistent choice: overlap, wrong order, pick out of range, fewer than two texts in the answer", () => {
    const overlap = good();
    (overlap.u.questions[1] as ComparativeQuestion).choice = { fixed: [t1.id], from: [t1.id, t2.id], pick: 1 };
    expect(run(overlap.u, overlap.a)).toMatch(/both fixed and choosable/);
    const order = good();
    (order.u.questions[1] as ComparativeQuestion).textIds = [t2.id, t1.id, t3.id];
    expect(run(order.u, order.a)).toMatch(/fixed texts then the choosable texts/);
    const range = good();
    (range.u.questions[1] as ComparativeQuestion).choice = { fixed: [t1.id], from: [t2.id, t3.id], pick: 3 };
    expect(run(range.u, range.a)).toMatch(/choice.pick must be 1 to 2/);
    const small = good();
    (small.u.questions[1] as ComparativeQuestion).textIds = [t2.id, t3.id];
    (small.u.questions[1] as ComparativeQuestion).choice = { fixed: [], from: [t2.id, t3.id], pick: 1 };
    expect(run(small.u, small.a)).toMatch(/at least 2 texts/);
  });
  it("fails on a bad HSC check date or a form that disagrees with the body", () => {
    const g = good();
    g.u.texts![0].hscChecked = "2999-01-01";
    expect(run(g.u, g.a)).toMatch(/hscChecked/);
    const f = good();
    f.u.texts![0].form = "visual";
    expect(run(f.u, f.a)).toMatch(/does not match its body kind/);
  });
});

describe("marks, verb, source and suggested length", () => {
  it("fails on marks outside 3 to 8, a verb with no definition, a bad outcome and a source that is not the paper", () => {
    const g = good();
    const q = g.u.questions[0] as ComparativeQuestion;
    q.maxMarks = 2;
    q.verb = "ponder";
    q.outcome = "EAV-12-09" as never;
    q.source = "Somewhere, 1999";
    const out = run(g.u, g.a);
    expect(out).toMatch(/3 to 8/);
    expect(out).toMatch(/verb "ponder"/);
    expect(out).toMatch(/outcome must be/);
    expect(out).toMatch(/source .* must be/);
  });
  it("fails when lines are not a multiple of 12 or a median is not counted (no median ships on a guess)", () => {
    const g = good();
    (g.u.questions[0] as ComparativeQuestion).suggestedWords = 100;
    expect(run(g.u, g.a)).toMatch(/answer lines × 12/);
    const m = good();
    Object.assign(m.u.questions[0], { suggestedFrom: "median", suggestedWords: 500, maxMarks: 8 });
    expect(run(m.u, m.a)).toMatch(/no median is counted for 8 marks yet/);
  });
});

describe("the key", () => {
  it("fails with no key, empty criteria or notes, a missing band line, a short model answer, one too long to submit", () => {
    const g = good();
    delete g.a[g.u.questions[0].id];
    expect(run(g.u, g.a)).toMatch(/no comparative answer key/);
    const c = good();
    c.a[c.u.questions[0].id].comparative!.criteria = "5 – Effective\n4 – Sound\n3 – Some\n2 – Limited\n1 – Little";
    expect(run(c.u, c.a)).toMatch(/no band line for 6 marks/);
    const n = good();
    n.a[n.u.questions[0].id].comparative!.notes = " ";
    expect(run(n.u, n.a)).toMatch(/notes are empty/);
    const s = good();
    s.a[s.u.questions[0].id].comparative!.model = "Too short.";
    expect(run(s.u, s.a)).toMatch(/at least 40/);
    const l = good();
    (l.u.questions[0] as ComparativeQuestion).suggestedWords = 24;
    expect(run(l.u, l.a)).toMatch(/more than a student could submit/);
  });
  it("fails drafted material with no reviewedOn date, and accepts one with a past date", () => {
    const g = good();
    g.a[g.u.questions[0].id].comparative!.modelOrigin = "drafted";
    expect(run(g.u, g.a)).toMatch(/need a reviewedOn date/);
    g.a[g.u.questions[0].id].comparative!.reviewedOn = "2026-11-19";
    expect(run(g.u, g.a)).not.toMatch(/reviewedOn/);
  });
});

describe("the pairing", () => {
  it("fails with the wrong number of texts, a text not shown, a fixed text missing or a repeat", () => {
    const g = good();
    g.a[g.u.questions[0].id].comparative!.pairing = [t1.id];
    expect(run(g.u, g.a)).toMatch(/the pairing has 1 text/);
    const o = good();
    o.a[o.u.questions[1].id].comparative!.pairing = [t1.id, "elsewhere"];
    expect(run(o.u, o.a)).toMatch(/names a text the question does not show/);
    const f = good();
    f.a[f.u.questions[1].id].comparative!.pairing = [t2.id, t3.id];
    expect(run(f.u, f.a)).toMatch(/must include every fixed text/);
    const d = good();
    d.a[d.u.questions[0].id].comparative!.pairing = [t1.id, t1.id];
    expect(run(d.u, d.a)).toMatch(/repeats a text/);
  });
});

describe("a visual text the question shows, picked or not", () => {
  const withVisual = () => {
    const vis = visual();
    const q = base({ textIds: [t1.id, vis.id], concepts: [comparativeSkillConceptId("compares-texts")] });
    const description = "A grey photograph of an empty chair by a window with the light falling across the floor and a coat left over the back.";
    const hash = createHash("sha256").update(description, "utf8").digest("hex");
    const k = key({ pairing: [t1.id, vis.id], visuals: { [vis.id]: { description, check: { adequate: true, checkedAt: "2026-11-19", promptVersion: "p", model: "m", samples: 1, descriptionHash: hash } } } });
    return { u: unitOf([q], [t1, vis]), a: answersFor([q], k), vis };
  };
  it("passes with an image, a neutral alt, a description and a passed, current check", () => {
    const { u, a } = withVisual();
    expect(validateComparativeRules(u, a, verbs, partners, TODAY, () => 1000)).toEqual([]);
  });
  it("fails with no image file, an oversized image, no description, no check, a failed check, or a changed description", () => {
    const x = withVisual();
    expect(run(x.u, x.a, () => null)).toMatch(/no image file/);
    expect(run(x.u, x.a, () => MAX_IMAGE_BYTES + 1)).toMatch(/at most 300 KB/);
    const none = withVisual();
    delete none.a[none.u.questions[0].id].comparative!.visuals;
    expect(run(none.u, none.a)).toMatch(/no written description for visual text/);
    const noCheck = withVisual();
    delete noCheck.a[noCheck.u.questions[0].id].comparative!.visuals![noCheck.vis.id].check;
    expect(run(noCheck.u, noCheck.a)).toMatch(/description check has not been run/);
    const failed = withVisual();
    failed.a[failed.u.questions[0].id].comparative!.visuals![failed.vis.id].check!.adequate = false;
    expect(run(failed.u, failed.a)).toMatch(/check failed/);
    const changed = withVisual();
    changed.a[changed.u.questions[0].id].comparative!.visuals![changed.vis.id].description += " More.";
    expect(run(changed.u, changed.a)).toMatch(/changed since its check passed/);
  });
});

describe("rule: no key text in a public string", () => {
  it("fails when the model answer repeats a run of the public prompt, the notes repeat the unit description, or the pairing leaks", () => {
    const g = good();
    (g.u.questions[0] as ComparativeQuestion).prompt =
      "Compare how the two texts represent the experience of loss and how each shapes the way a reader responds to it.";
    g.a[g.u.questions[0].id].comparative!.model = `${g.u.questions[0].prompt} ${MODEL}`.replace(/\s+/g, " ");
    expect(run(g.u, g.a)).toMatch(/key text appears in public text/);
    const n = good();
    n.a[n.u.questions[0].id].comparative!.notes = n.u.description;
    expect(run(n.u, n.a)).toMatch(/key text appears in public text/);
  });
  it("does not flag the criteria for restating the question's own wording", () => {
    const g = good();
    g.a[g.u.questions[0].id].comparative!.criteria = `6 – ${g.u.questions[0].prompt} Skilful\n5 – Effective\n4 – Sound\n3 – Some\n2 – Limited\n1 – Little`;
    expect(run(g.u, g.a)).not.toMatch(/key text appears/);
  });
});
