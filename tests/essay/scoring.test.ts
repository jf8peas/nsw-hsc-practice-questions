import { describe, expect, it } from "vitest";

import {
  BANDS,
  ONE_ECONOMY_CAP,
  WRONG_FIGURE_WHY,
  applyOneEconomyCap,
  clampToBand,
  finalMark,
  outcomesFrom,
  quoteInText,
  scrubFlagWhy,
} from "@/lib/essay/scoring";

describe("clamping a mark into its band", () => {
  it("raises and lowers a mark outside its own band", () => {
    expect(clampToBand(15, 1)).toBe(17);
    expect(clampToBand(20, 3)).toBe(12);
    expect(clampToBand(11, 3)).toBe(11);
    expect(clampToBand(0, 5)).toBe(1);
  });

  it("covers marks 1 to 20 with five bands", () => {
    const covered = new Set<number>();
    for (const b of BANDS) for (let m = b.min; m <= b.max; m++) covered.add(m);
    expect([...covered].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
});

describe("the one-economy cap", () => {
  it("caps a two-economy answer that does not treat both at 12", () => {
    expect(ONE_ECONOMY_CAP).toBe(12);
    expect(applyOneEconomyCap(19, "both", false)).toBe(12);
    expect(applyOneEconomyCap(10, "both", false)).toBe(10);
    expect(applyOneEconomyCap(19, "both", true)).toBe(19);
  });

  it("never applies to one-economy essays", () => {
    expect(applyOneEconomyCap(19, "china", false)).toBe(19);
    expect(applyOneEconomyCap(19, "nepal", false)).toBe(19);
  });

  it("reports capped only when the cap lowered the mark", () => {
    expect(finalMark(19, 1, "both", false)).toEqual({ final: 12, clamped: 19, capped: true });
    expect(finalMark(10, 3, "both", false)).toEqual({ final: 10, clamped: 10, capped: false });
    expect(finalMark(15, 1, "both", true)).toEqual({ final: 17, clamped: 17, capped: false });
    expect(finalMark(15, 1, "china", false)).toEqual({ final: 17, clamped: 17, capped: false });
  });
});

describe("flagged figures", () => {
  it("finds a quote in the essay ignoring case, spacing and curly quotes", () => {
    expect(quoteInText("GDP was $90   trillion", "China’s GDP was $90 trillion in 2020.")).toBe(true);
    expect(quoteInText("China’s GDP", "china's gdp grew")).toBe(true);
    expect(quoteInText("not here", "something else")).toBe(false);
    expect(quoteInText("", "anything")).toBe(false);
  });

  it("replaces a reason that gives a number the quote did not contain", () => {
    expect(scrubFlagWhy("GDP was $90 trillion", "It was actually about 18 trillion")).toBe(WRONG_FIGURE_WHY);
    expect(scrubFlagWhy("GDP was $90 trillion", "")).toBe(WRONG_FIGURE_WHY);
  });

  it("keeps a reason whose numbers are all in the quote", () => {
    expect(scrubFlagWhy("GDP was $90 trillion in 2020", "$90 trillion is far too high for 2020")).toBe(
      "$90 trillion is far too high for 2020",
    );
    expect(scrubFlagWhy("poverty fell", "Poverty did not fall that fast.")).toBe("Poverty did not fall that fast.");
  });
});

describe("concept outcomes", () => {
  it("lists gaps as misses in the marker's order, then used-well as correct", () => {
    expect(
      outcomesFrom([{ conceptId: "u.c-a", detail: "x" }, { conceptId: "u.c-b", detail: "y" }], ["u.c-c", "u.c-d"]),
    ).toEqual([
      { conceptId: "u.c-a", correct: false },
      { conceptId: "u.c-b", correct: false },
      { conceptId: "u.c-c", correct: true },
      { conceptId: "u.c-d", correct: true },
    ]);
  });

  it("never lists an id as used well when it is also a gap", () => {
    expect(outcomesFrom([{ conceptId: "u.c-a", detail: "x" }], ["u.c-a", "u.c-b"])).toEqual([
      { conceptId: "u.c-a", correct: false },
      { conceptId: "u.c-b", correct: true },
    ]);
  });
});
