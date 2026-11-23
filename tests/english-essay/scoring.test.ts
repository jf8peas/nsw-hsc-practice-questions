import { describe, expect, it } from "vitest";

import { bandOfMark, dedupeMarkerErrors, englishFinalMark, mergeKnowledgeErrors, quotesOverlap } from "@/lib/english-essay/scoring";
import type { EnglishKnowledgeError, EnglishQuoteResult } from "@/lib/english-essay/types";

// Independent expectations (data-model §7.3): written out here as plain arithmetic, not by calling the module.

const BAND_RANGES: Record<number, [number, number]> = { 1: [17, 20], 2: [13, 16], 3: [9, 12], 4: [5, 8], 5: [1, 4] };
const bandOf = (m: number) => Number(Object.entries(BAND_RANGES).find(([, [lo, hi]]) => m >= lo && m <= hi)![0]);

function expected(raw: number, band: number, errors: number, focus: "fully" | "partly" | "barely") {
  const [lo, hi] = BAND_RANGES[band]!;
  let m = Math.min(Math.max(raw, lo), hi); // clamp
  m -= Math.min(errors, 2); // deduct, at most two
  if (errors >= 2) m = Math.min(m, 16); // knowledge cap
  if (focus === "partly") m = Math.min(m, 12);
  if (focus === "barely") m = Math.min(m, 10);
  m = Math.max(m, 1);
  return { finalMark: m, finalBand: bandOf(m) };
}

describe("englishFinalMark: the 300-case matrix", () => {
  const cases: Array<[number, number, number, "fully" | "partly" | "barely"]> = [];
  for (const band of [1, 2, 3, 4, 5]) {
    const [lo, hi] = BAND_RANGES[band]!;
    for (const raw of [lo - 1, lo, lo + 1, hi, hi + 1]) {
      for (const errors of [0, 1, 2, 3]) {
        for (const focus of ["fully", "partly", "barely"] as const) cases.push([Math.min(Math.max(raw, 0), 20), band, errors, focus]);
      }
    }
  }

  it("covers 5 bands x 5 raw positions x 4 error counts x 3 focus levels", () => {
    expect(cases).toHaveLength(300);
  });

  it.each(cases)("raw %i, band %i, %i errors, %s", (raw, band, errors, focus) => {
    const got = englishFinalMark({ rawMark: raw, band, errorCount: errors, focus });
    const want = expected(raw, band, errors, focus);
    expect(got.finalMark).toBe(want.finalMark);
    expect(got.finalBand).toBe(want.finalBand);
    expect(got.deduction).toBe(Math.min(errors, 2));
    expect(got.knowledgeCapApplied).toBe(errors >= 2);
    expect(got.focusCap).toBe(focus === "partly" ? 12 : focus === "barely" ? 10 : null);
    expect(got.capped).toBe(got.finalMark < got.clampedMark);
  });
});

describe("englishFinalMark: the worked examples", () => {
  const f = (raw: number, band: number, errors: number, focus: "fully" | "partly" | "barely") => {
    const r = englishFinalMark({ rawMark: raw, band, errorCount: errors, focus });
    return [r.finalMark, r.finalBand];
  };
  it("matches the data-model table", () => {
    expect(f(15, 1, 0, "fully")).toEqual([17, 1]); // clamp up
    expect(f(20, 3, 0, "fully")).toEqual([12, 3]); // clamp down
    expect(f(19, 1, 1, "fully")).toEqual([18, 1]);
    expect(f(19, 1, 2, "fully")).toEqual([16, 2]); // deduction then cap 16
    expect(f(17, 1, 3, "fully")).toEqual([15, 2]); // deduction capped at two
    expect(f(19, 1, 1, "partly")).toEqual([12, 3]);
    expect(f(19, 1, 2, "barely")).toEqual([10, 3]);
    expect(f(18, 1, 2, "partly")).toEqual([12, 3]);
    expect(f(13, 2, 1, "partly")).toEqual([12, 3]);
    expect(f(11, 3, 1, "barely")).toEqual([10, 3]);
    expect(f(2, 5, 3, "fully")).toEqual([1, 5]); // minimum 1
  });

  it("clamps a raw mark of 0 up into the selected band, never below 1", () => {
    expect(englishFinalMark({ rawMark: 0, band: 4, errorCount: 0, focus: "fully" }).finalMark).toBe(5);
    expect(englishFinalMark({ rawMark: 0, band: 5, errorCount: 3, focus: "barely" }).finalMark).toBe(1);
  });

  it("keeps the marker's band out of the result: the final band is the band of the final mark", () => {
    const r = englishFinalMark({ rawMark: 19, band: 1, errorCount: 2, focus: "barely" });
    expect(r.finalBand).toBe(3);
    expect(bandOfMark(10)).toBe(3);
    expect(bandOfMark(17)).toBe(1);
    expect(bandOfMark(1)).toBe(5);
  });
});

describe("knowledge-error deduplication", () => {
  const essay = 'He says "the tide forgets" twice. Later: "the tide forgets" again. Also "the moon is a clerk".';

  it("drops marker errors whose quote is not in the essay or whose reason is empty", () => {
    const out = dedupeMarkerErrors(
      [
        { quote: "the tide forgets", why: "a" },
        { quote: "not in the essay at all", why: "b" },
        { quote: "the moon is a clerk", why: "  " },
      ],
      essay,
    );
    expect(out.map((e) => e.quote)).toEqual(["the tide forgets"]);
    expect(out[0]!.source).toBe("marker");
  });

  it("counts one underlying mistake once: a repeated quote or a repeated reason", () => {
    const out = dedupeMarkerErrors(
      [
        { quote: "The tide  forgets", why: "first wording" },
        { quote: "the tide forgets", why: "reworded explanation" }, // same quote
        { quote: "the moon is a clerk", why: "FIRST wording" }, // same reason (case/space-insensitive)
      ],
      essay,
    );
    expect(out).toHaveLength(1);
  });

  it("counts two different underlying mistakes twice", () => {
    const out = dedupeMarkerErrors(
      [
        { quote: "the tide forgets", why: "one mistake" },
        { quote: "the moon is a clerk", why: "another mistake" },
      ],
      essay,
    );
    expect(out).toHaveLength(2);
  });

  const nf = (quote: string): EnglishQuoteResult => ({ quote, status: "not-found", ratio: 0.2 });

  it("appends unique not-found quotations after the marker errors, in order", () => {
    const marker: EnglishKnowledgeError[] = [{ quote: "alpha beta gamma", why: "x", source: "marker" }];
    const out = mergeKnowledgeErrors(marker, [nf("delta epsilon zeta"), nf("Delta, epsilon zeta!"), nf("eta theta iota")]);
    expect(out.map((e) => [e.quote, e.source])).toEqual([
      ["alpha beta gamma", "marker"],
      ["delta epsilon zeta", "quote-check"],
      ["eta theta iota", "quote-check"],
    ]);
  });

  it("does not add a not-found error that overlaps a marker error, in either direction", () => {
    const wide: EnglishKnowledgeError[] = [{ quote: "He said that the moon repaired every sorrow before dawn.", why: "x", source: "marker" }];
    expect(mergeKnowledgeErrors(wide, [nf("the moon repaired every sorrow")])).toHaveLength(1);
    const narrow: EnglishKnowledgeError[] = [{ quote: "the moon repaired every sorrow", why: "x", source: "marker" }];
    expect(mergeKnowledgeErrors(narrow, [nf("He said that the moon repaired every sorrow before dawn")])).toHaveLength(1);
    expect(quotesOverlap("“The moon”, repaired", "the moon repaired")).toBe(true);
    expect(quotesOverlap("one two three", "four five six")).toBe(false);
    expect(quotesOverlap("", "anything")).toBe(false);
  });

  it("near, other-source and ok results add nothing and cost nothing", () => {
    const results: EnglishQuoteResult[] = [
      { quote: "q one two", status: "near", correct: "q one too", ratio: 0.9 },
      { quote: "q three four", status: "other-source" },
      { quote: "q five six", status: "ok" },
    ];
    expect(mergeKnowledgeErrors([], results)).toEqual([]);
  });
});
