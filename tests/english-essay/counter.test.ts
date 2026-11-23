import { describe, expect, it } from "vitest";

import { ESSAY_MAX, ESSAY_MAX_CHARS, ESSAY_MIN, checkEssayLength, englishEssayCounter } from "@/lib/english-essay/counter";
import { countWords } from "@/lib/wordcount";

describe("englishEssayCounter", () => {
  it("shows the exact wording and submit state at the four boundaries", () => {
    expect(englishEssayCounter(799)).toEqual({ state: "under", text: "799 / 800–1,200 words — 1 more to go", canSubmit: false });
    expect(englishEssayCounter(800)).toEqual({ state: "ready", text: "800 / 800–1,200 words", canSubmit: true });
    expect(englishEssayCounter(1200)).toEqual({ state: "ready", text: "1,200 / 800–1,200 words", canSubmit: true });
    expect(englishEssayCounter(1201)).toEqual({ state: "over", text: "1,201 / 1,200 — cut 1 word", canSubmit: false });
  });

  it("handles plural forms, thousands separators and an empty essay", () => {
    expect(englishEssayCounter(0).text).toBe("0 / 800–1,200 words — 800 more to go");
    expect(englishEssayCounter(1210).text).toBe("1,210 / 1,200 — cut 10 words");
    expect(englishEssayCounter(1).text).toBe("1 / 800–1,200 words — 799 more to go");
    expect(ESSAY_MIN).toBe(800);
    expect(ESSAY_MAX).toBe(1200);
  });
});

describe("checkEssayLength (the server's rule, using the shared countWords)", () => {
  const essay = (n: number) => Array.from({ length: n }, () => "w").join(" ");

  it("accepts 800 to 1,200 words by the shared counter", () => {
    expect(checkEssayLength(essay(800))).toEqual({ ok: true, words: 800 });
    expect(checkEssayLength(essay(1200))).toEqual({ ok: true, words: 1200 });
    expect(countWords(essay(1000))).toBe(1000);
  });

  it("refuses short, long, empty, whitespace-only, non-string and over-12,000-character essays", () => {
    expect(checkEssayLength(essay(799))).toEqual({ ok: false, error: "essay_too_short", words: 799 });
    expect(checkEssayLength(essay(1201))).toEqual({ ok: false, error: "essay_too_long", words: 1201 });
    expect(checkEssayLength("")).toMatchObject({ ok: false, error: "invalid_request" });
    expect(checkEssayLength("  \n ")).toMatchObject({ ok: false, error: "invalid_request" });
    expect(checkEssayLength(42)).toMatchObject({ ok: false, error: "invalid_request" });
    const dense = "a".repeat(ESSAY_MAX_CHARS + 1);
    expect(checkEssayLength(dense)).toMatchObject({ ok: false, error: "essay_too_long" });
  });
});
