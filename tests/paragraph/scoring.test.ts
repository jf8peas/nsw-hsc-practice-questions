import { describe, expect, it } from "vitest";

import {
  buildVerdicts,
  conceptOutcomes,
  lostCriteria,
  lostTipSlugs,
  markOf,
  phase2Mark,
  recordedMark,
  verdictsFromTicks,
  type RawMarkerVerdicts,
} from "@/lib/paragraph/scoring";

const raw = (over: Partial<{ a: boolean; b: boolean; c: boolean; precise: boolean; padding: boolean }> = {}): RawMarkerVerdicts => ({
  a: { met: over.a ?? true, reason: "ra" },
  b: { met: over.b ?? true, reason: "rb" },
  c: { met: over.c ?? true, reason: "rc" },
  conventions: { reason: "rd", preciseLanguage: over.precise ?? true, noPadding: over.padding ?? true },
  feedback: "fb",
});

describe("buildVerdicts and markOf", () => {
  it("marks the number of met criteria", () => {
    expect(markOf(buildVerdicts(raw(), 30, 40))).toBe(4);
    expect(markOf(buildVerdicts(raw({ b: false }), 30, 40))).toBe(3);
    expect(markOf(buildVerdicts(raw({ a: false, c: false }), 30, 40))).toBe(2);
    expect(markOf(buildVerdicts(raw({ a: false, b: false, c: false, precise: false }), 30, 40))).toBe(0);
  });

  it("criterion d needs precise language, no padding AND the word limit", () => {
    expect(buildVerdicts(raw({ precise: false }), 30, 40).d.met).toBe(false);
    expect(buildVerdicts(raw({ padding: false }), 30, 40).d.met).toBe(false);
    expect(buildVerdicts(raw(), 40, 40).d.met).toBe(true);
  });

  it("over the limit loses d in code, keeps the model's other halves, and names the limit", () => {
    const v = buildVerdicts(raw(), 95, 90);
    expect(v.d.met).toBe(false);
    expect(v.d.subs).toEqual({ preciseLanguage: true, noPadding: true, withinLimit: false });
    expect(v.d.reason).toContain("90-word limit");
    expect(v.d.reason).toContain("95");
    expect(markOf(v)).toBe(3);
  });
});

describe("phase 2 cap and recorded mark", () => {
  it("caps the correction at 3 even when all four criteria are met", () => {
    expect(phase2Mark(4)).toBe(3);
    expect(phase2Mark(2)).toBe(2);
  });
  it("records the higher of the two tries", () => {
    expect(recordedMark(2, 3)).toBe(3);
    expect(recordedMark(3, 2)).toBe(3);
    expect(recordedMark(3, 3)).toBe(3);
    expect(recordedMark(4, undefined)).toBe(4);
    expect(recordedMark(1, 0)).toBe(1);
  });
});

describe("lost criteria and tips", () => {
  it("lists lost criteria in order and the tips for the failed halves of d", () => {
    const v = buildVerdicts(raw({ b: false, padding: false }), 30, 40);
    expect(lostCriteria(v)).toEqual(["b", "d"]);
    expect(lostTipSlugs("evidence", v)).toEqual(["evidence-b", "all-concise"]);
  });
  it("over the limit costs the concise tip only", () => {
    expect(lostTipSlugs("link", buildVerdicts(raw(), 60, 45))).toEqual(["all-concise"]);
  });
});

describe("concept outcomes (phase 1 only)", () => {
  it("gives five outcomes: a, b, c tips and both all-parts tips", () => {
    const out = conceptOutcomes("evidence", buildVerdicts(raw({ b: false, precise: false }), 30, 80));
    expect(out).toEqual([
      { conceptId: "y12-economics-paragraph-writing.c-evidence-a", correct: true },
      { conceptId: "y12-economics-paragraph-writing.c-evidence-b", correct: false },
      { conceptId: "y12-economics-paragraph-writing.c-evidence-c", correct: true },
      { conceptId: "y12-economics-paragraph-writing.c-all-precise", correct: false },
      { conceptId: "y12-economics-paragraph-writing.c-all-concise", correct: true },
    ]);
  });
  it("self-mark ticks: a d tick covers both all-parts tips", () => {
    const v = verdictsFromTicks({ a: true, b: false, c: true, d: true });
    expect(markOf(v)).toBe(3);
    const out = conceptOutcomes("topic", v);
    expect(out.map((o) => o.correct)).toEqual([true, false, true, true, true]);
    const none = conceptOutcomes("topic", verdictsFromTicks({ a: false, b: false, c: false, d: false }));
    expect(none.every((o) => !o.correct)).toBe(true);
  });
});
