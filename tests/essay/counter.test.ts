import { describe, expect, it } from "vitest";

import { essayCounter, scaffoldCounter } from "@/lib/essay/counter";

describe("the essay counter", () => {
  it.each([
    [0, "under", "0 / 600–800 words — 600 more to go", false],
    [412, "under", "412 / 600–800 words — 188 more to go", false],
    [599, "under", "599 / 600–800 words — 1 more to go", false],
    [600, "ready", "600 / 600–800 words", true],
    [712, "ready", "712 / 600–800 words", true],
    [800, "ready", "800 / 600–800 words", true],
    [801, "over", "801 / 800 — cut 1 word", false],
    [836, "over", "836 / 800 — cut 36 words", false],
  ])("%i words", (n, state, text, canSubmit) => {
    expect(essayCounter(n)).toEqual({ state, text, canSubmit });
  });
});

describe("the scaffold counter", () => {
  it("shows the cap and the excess", () => {
    expect(scaffoldCounter(183)).toEqual({ over: false, text: "183 / 250 words" });
    expect(scaffoldCounter(250)).toEqual({ over: false, text: "250 / 250 words" });
    expect(scaffoldCounter(251)).toEqual({ over: true, text: "251 / 250 words, cut 1 word" });
    expect(scaffoldCounter(263)).toEqual({ over: true, text: "263 / 250 words, cut 13 words" });
  });
});
