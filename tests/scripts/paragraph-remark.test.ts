// The offline re-mark of full-mark answers (spec 007 FR-031): the sample fills the known leniency
// patterns first, only leniency counts as a disagreement, the model must differ from the marker,
// and the script can never touch a student's daily allowance.

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { checkRemarkModels, compareVerdicts, pickSample, LENIENCY_PATTERNS, type SampleRow } from "../../scripts/paragraph-remark-lib";
import type { ParagraphVerdicts } from "@/lib/db/schema";

const v = (met: string): ParagraphVerdicts =>
  Object.fromEntries((["a", "b", "c", "d"] as const).map((k) => [k, { met: met.includes(k), reason: "r" }])) as ParagraphVerdicts;
const row = (part: number, text = `t${part}`, met = "abcd"): SampleRow => ({ questionId: `y12-economics-paragraph-writing.e01p${part}`, part, text, verdicts: v(met) });
const bank = (): SampleRow[] =>
  [1, 2, 3, 4, 5].flatMap((p) => Array.from({ length: 12 }, (_, i) => row(p, `p${p}-${i}`)));

describe("pickSample", () => {
  it("fills the sample from the leniency-pattern parts first (Link, Topic, Mechanism)", () => {
    const s = pickSample(bank(), 9, true);
    expect(s).toHaveLength(9);
    expect(new Set(s.map((r) => r.part))).toEqual(new Set([1, 2, 5]));
    expect(s.filter((r) => r.part === 5)).toHaveLength(3);
  });
  it("tops up with the other parts once the priority parts run out", () => {
    const s = pickSample(bank(), 40, true);
    expect(s).toHaveLength(40);
    expect(s.filter((r) => [1, 2, 5].includes(r.part))).toHaveLength(36);
    expect(s.some((r) => r.part === 3 || r.part === 4)).toBe(true);
  });
  it("is reproducible and never returns more than exist", () => {
    expect(pickSample(bank(), 20, true)).toEqual(pickSample(bank(), 20, true));
    expect(pickSample([row(1)], 10)).toHaveLength(1);
  });
  it("can sample without the priority", () => {
    expect(pickSample(bank(), 20, false)).toHaveLength(20);
  });
});

describe("compareVerdicts", () => {
  it("counts only a criterion the app credited and the stronger model refused (leniency)", () => {
    const d = compareVerdicts(row(5), { a: false, b: true, c: true, d: true });
    expect(d?.lenient).toEqual(["a"]);
    expect(d?.pattern).toBe(LENIENCY_PATTERNS[0].label);
    expect(d?.note).toContain("(a) app met / stronger not met");
  });
  it("matches the three known patterns by part and criterion", () => {
    expect(compareVerdicts(row(1), { a: true, b: false, c: true, d: true })?.pattern).toMatch(/Topic \(b\)/);
    expect(compareVerdicts(row(2), { a: true, b: true, c: false, d: true })?.pattern).toMatch(/Mechanism \(c\)/);
    expect(compareVerdicts(row(3), { a: false, b: true, c: true, d: true })?.pattern).toBeUndefined();
  });
  it("is not a disagreement when the stronger model is stricter only where the app already said not met, or agrees", () => {
    expect(compareVerdicts(row(5), { a: true, b: true, c: true, d: true })).toBeNull();
    expect(compareVerdicts(row(5, "t", "bcd"), { a: false, b: true, c: true, d: true })).toBeNull();
    expect(compareVerdicts(row(5, "t", "bcd"), { a: true, b: true, c: true, d: true })).toBeNull(); // a stricter app is a false dock, not leniency
  });
});

describe("the models", () => {
  it("refuses an unset REMARK_MODEL and one equal to the marker", () => {
    expect(checkRemarkModels(undefined, "deepseek/deepseek-chat")).toMatch(/not set/);
    expect(checkRemarkModels("deepseek/deepseek-chat", "deepseek/deepseek-chat")).toMatch(/same as the marker/);
    expect(checkRemarkModels("anthropic/some-stronger-model", "deepseek/deepseek-chat")).toBeNull();
  });
});

describe("the script never counts against a student's allowance", () => {
  it("does not reference the usage table, the reserve helper or the rate limiters", () => {
    const src = fs.readFileSync(path.resolve("scripts/paragraph-remark.ts"), "utf8");
    expect(src).not.toMatch(/reserveAiSlot|usage\.server|dailyAiUsage|ratelimit\.server|checkUserRateLimit/);
    expect(src).toMatch(/NEVER touches/);
  });
});
