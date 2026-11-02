import { describe, expect, it } from "vitest";

import { countWords } from "@/lib/wordcount";

describe("countWords (spec 005 FR-043)", () => {
  it("counts whitespace-separated tokens", () => {
    expect(countWords("a b c")).toBe(3);
  });

  it("treats hyphenated words as one word each", () => {
    expect(countWords("well-being is one word")).toBe(4);
  });

  it("treats numbers as one word each", () => {
    expect(countWords("the year 2027 is one number")).toBe(6);
  });

  it("returns 0 for empty or whitespace-only text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  it("is the same rule the server marker uses (single shared module)", () => {
    // the client's live counter imports the same lib/wordcount.ts as lib/grading.server.ts
    const text = "A tariff makes imports dearer, so consumers buy more from domestic producers.";
    expect(countWords(text)).toBe(text.split(/\s+/).length);
  });
});
