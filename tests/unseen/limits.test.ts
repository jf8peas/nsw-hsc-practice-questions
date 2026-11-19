import { describe, expect, it } from "vitest";

import { MEDIAN_WORDS, MIN_WORDS, lengthNote, lengthState, limitsFor } from "@/lib/unseen/limits";

describe("limitsFor", () => {
  it("allows 20% over the suggested length, rounded down", () => {
    expect(limitsFor(204)).toEqual({ min: 20, suggested: 204, max: 244 });
    expect(limitsFor(288).max).toBe(345);
    expect(limitsFor(216).max).toBe(259);
  });

  it("has no floating-point error at exact multiples", () => {
    expect(limitsFor(240).max).toBe(288);
    expect(limitsFor(205).max).toBe(246);
    expect(limitsFor(100).max).toBe(120);
  });
});

describe("lengthState", () => {
  it("is short under the minimum and ok at the minimum", () => {
    expect(lengthState(0, 204)).toBe("short");
    expect(lengthState(MIN_WORDS - 1, 204)).toBe("short");
    expect(lengthState(MIN_WORDS, 204)).toBe("ok");
  });

  it("is ok up to the suggested length, then warns, then blocks", () => {
    expect(lengthState(204, 204)).toBe("ok");
    expect(lengthState(205, 204)).toBe("warn");
    expect(lengthState(244, 204)).toBe("warn");
    expect(lengthState(245, 204)).toBe("over");
  });
});

describe("lengthNote", () => {
  it("names the reason Submit is disabled or the warning", () => {
    expect(lengthNote(10, 204)).toBe("Write at least 20 words before you submit.");
    expect(lengthNote(150, 204)).toBeNull();
    expect(lengthNote(214, 204)).toBe("About 10 words over the suggested length. Tighten it if you can.");
    expect(lengthNote(250, 204)).toBe("6 words over the limit. Cut it to submit.");
  });
});

describe("MEDIAN_WORDS", () => {
  it("has a positive whole number for every mark value 1 to 6 (a median of an even count can fall between two line counts)", () => {
    for (const marks of [1, 2, 3, 4, 5, 6]) {
      const words = MEDIAN_WORDS[marks];
      expect(words, `marks ${marks}`).toBeGreaterThan(0);
      expect(Number.isInteger(words)).toBe(true);
    }
  });

  it("holds the medians the review report counts over the bank (2 and 6 marks rest on one paper each)", () => {
    expect(MEDIAN_WORDS).toEqual({ 1: 72, 2: 216, 3: 192, 4: 276, 5: 432, 6: 684 });
  });
});
