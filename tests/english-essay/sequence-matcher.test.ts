import { describe, expect, it } from "vitest";

import { sequenceRatio } from "@/lib/english-essay/sequence-matcher";

// Golden ratios from CPython's difflib.SequenceMatcher(None, a, b).ratio() (the pilot's near-match measure), computed once
// with Python 3 and pasted here. Invented text only.

describe("sequenceRatio matches CPython's SequenceMatcher", () => {
  it.each([
    ["abcd", "bcde", 0.75],
    ["", "", 1],
    ["a", "", 0],
    ["the lantern trembled in the salt wind", "the lantern trembles in the salt wind", 0.972972972972973],
    ["the moon repaired every sorrow", "the moon is a patient clerk", 0.5614035087719298],
    ["private eye", "private i", 0.8],
    ["a".repeat(10) + "b".repeat(5), "b".repeat(5) + "a".repeat(10), 0.6666666666666666],
    ["hello world", "world hello", 0.45454545454545453],
  ])("%j vs %j", (a, b, want) => {
    expect(sequenceRatio(a, b)).toBeCloseTo(want, 12);
  });

  it("applies the autojunk popular-element rule when the second sequence has 200 or more elements", () => {
    // 'a' occurs in more than 1% + 1 of b, so it is dropped from the index and only extends a found match
    expect(sequenceRatio("x" + "a".repeat(250) + "y", "a".repeat(250) + "xy")).toBeCloseTo(0.007936507936507936, 12);
    expect(sequenceRatio("ab".repeat(120), "ba".repeat(110) + "aab")).toBe(0);
  });

  it("does not apply the rule below 200 elements", () => {
    expect(sequenceRatio("x" + "a".repeat(100) + "y", "a".repeat(100) + "xy")).toBeGreaterThan(0.4);
  });

  it("iterates Unicode code points like Python, not UTF-16 units", () => {
    // Python: SequenceMatcher(None, "😀ab", "😀cb").ratio() == 2*2/6
    expect(sequenceRatio("😀ab", "😀cb")).toBeCloseTo(4 / 6, 12);
  });
});
