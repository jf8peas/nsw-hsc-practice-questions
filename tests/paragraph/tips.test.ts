import { describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { answers } from "@/content/units/y12-economics-paragraph-writing/answers";
import { conceptProgress, type ConceptResult } from "@/lib/concepts/progress";
import { PARTS, PART_ORDER, TIPS, tipConceptId } from "@/lib/paragraph/parts";
import { buildVerdicts, conceptOutcomes, lostTipSlugs, type RawMarkerVerdicts } from "@/lib/paragraph/scoring";
import { lostTipSlugsFromViews } from "@/lib/paragraph/views";
import type { ParagraphQuestion } from "@/lib/types";

const UNIT = UNITS.find((u) => u.id === "y12-economics-paragraph-writing")!;

describe("tip cards never contain model text (every shipped essay)", () => {
  const essays = [...new Set(Object.values(answers).map((a) => a.paragraph!.essay))];
  // every string a tip card can show: criterion names, tips, application lines, the 17 tip texts
  const cardStrings = [
    ...PART_ORDER.flatMap((p) =>
      (["a", "b", "c", "d"] as const).flatMap((k) => [PARTS[p].criteria[k].short, PARTS[p].criteria[k].tip, PARTS[p].criteria[k].apply]),
    ),
    ...TIPS.map((t) => t.description),
  ];
  const keyTexts = (e: (typeof essays)[number]) => [
    ...Object.values(e.models),
    ...Object.values(e.markingNotes),
    e.brief.argument,
    e.brief.counterpoint,
    ...e.brief.chainSteps,
    ...e.brief.facts,
    ...e.brief.limitation,
  ];
  it("has no 30-character run of any model part, note or brief sentence in any card string", () => {
    for (const e of essays) {
      for (const k of keyTexts(e)) {
        for (let s = 0; s + 30 <= k.length; s += 3) {
          const run = k.slice(s, s + 30).toLowerCase();
          for (const c of cardStrings) expect(c.toLowerCase(), `${e.essayId}: "${run}"`).not.toContain(run);
        }
      }
    }
  });
  it("there are exactly 17 tips: 15 part tips clearing after 2, two all-parts tips clearing after 3, and no connectors tip", () => {
    expect(TIPS).toHaveLength(17);
    expect(TIPS.filter((t) => t.clearAfter === 2)).toHaveLength(15);
    expect(TIPS.filter((t) => t.clearAfter === 3).map((t) => t.slug)).toEqual(["all-precise", "all-concise"]);
    expect(UNIT.concepts).toHaveLength(17);
    expect(JSON.stringify(UNIT.concepts)).not.toMatch(/connector/i);
  });
});

describe("the tips a set of criteria loses", () => {
  const raw = (o: Partial<{ a: boolean; b: boolean; c: boolean; p: boolean; n: boolean }> = {}): RawMarkerVerdicts => ({
    a: { met: o.a ?? true, reason: "" }, b: { met: o.b ?? true, reason: "" }, c: { met: o.c ?? true, reason: "" },
    conventions: { reason: "", preciseLanguage: o.p ?? true, noPadding: o.n ?? true }, feedback: "f",
  });
  it("matches between the stored verdicts and the views the browser holds", () => {
    const v = buildVerdicts(raw({ b: false, p: false }), 95, 90);
    const views = (["a", "b", "c", "d"] as const).map((key) => ({ key, met: v[key].met, reason: "", ...(v[key].subs ? { subs: v[key].subs } : {}) }));
    expect(lostTipSlugsFromViews("evaluation", views)).toEqual(lostTipSlugs("evaluation", v));
    expect(lostTipSlugs("evaluation", v)).toEqual(["evaluation-b", "all-precise", "all-concise"]);
  });
});

describe("clearing: part tips after 2, all-parts tips after 3, phase 1 only", () => {
  const evidenceQ = UNIT.questions.find((q) => (q as ParagraphQuestion).part === 3)!;
  let n = 0;
  const result = (outcomes: ReturnType<typeof conceptOutcomes>, q = evidenceQ.id): ConceptResult => ({
    id: `r${++n}`, questionId: q, marks: 3, max: 4, answeredAt: new Date(2026, 10, 1, 9, n), conceptOutcomes: outcomes,
  });
  const missB = () => conceptOutcomes("evidence", buildVerdicts({ a: { met: true, reason: "" }, b: { met: false, reason: "" }, c: { met: true, reason: "" }, conventions: { reason: "", preciseLanguage: true, noPadding: true }, feedback: "f" }, 10, 80));
  const allMet = () => conceptOutcomes("evidence", buildVerdicts({ a: { met: true, reason: "" }, b: { met: true, reason: "" }, c: { met: true, reason: "" }, conventions: { reason: "", preciseLanguage: true, noPadding: true }, feedback: "f" }, 10, 80));
  const states = (rs: ConceptResult[]) => Object.fromEntries(conceptProgress(UNIT, rs).map((s) => [s.conceptId, s.count]));
  const evB = tipConceptId("evidence-b");

  it("a missed part tip starts at 2, drops to 1 after one correct first try and clears after two", () => {
    expect(states([result(missB())])[evB]).toBe(2);
    expect(states([result(missB()), result(allMet())])[evB]).toBe(1);
    expect(states([result(missB()), result(allMet()), result(allMet())])[evB]).toBeUndefined();
  });

  it("a missed all-parts tip starts at 3 and clears after three correct first tries (at any part)", () => {
    const missPrecise = conceptOutcomes("topic", buildVerdicts({ a: { met: true, reason: "" }, b: { met: true, reason: "" }, c: { met: true, reason: "" }, conventions: { reason: "", preciseLanguage: false, noPadding: true }, feedback: "f" }, 10, 40));
    const topicQ = UNIT.questions[0].id;
    const id = tipConceptId("all-precise");
    expect(states([result(missPrecise, topicQ)])[id]).toBe(3);
    expect(states([result(missPrecise, topicQ), result(allMet()), result(allMet())])[id]).toBe(1);
    expect(states([result(missPrecise, topicQ), result(allMet()), result(allMet()), result(allMet())])[id]).toBeUndefined();
  });

  it("a miss resets the count; nothing is tracked until a tip is missed", () => {
    expect(states([result(allMet())])).toEqual({});
    expect(states([result(missB()), result(allMet()), result(missB())])[evB]).toBe(2);
  });

  it("only the first try is stored as outcomes, so a tip fixed in the correction still counts as missed", () => {
    // the grade handler stores conceptOutcomes(part, phase1 verdicts); the correction never adds any
    expect(states([result(missB())])[evB]).toBe(2);
  });
});
