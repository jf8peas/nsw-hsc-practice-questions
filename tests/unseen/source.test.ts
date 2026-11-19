import { describe, expect, it } from "vitest";

import { paperLabel, sourceOf } from "@/lib/unseen/source";

const paper = { school: "Fort Street High School", short: "Fort St", year: 2025, exam: "Trial", qNo: 1 } as const;

describe("sourceOf", () => {
  it("names the school, year, paper type and question number", () => {
    expect(sourceOf(paper)).toBe("Fort St 2025 Trial, Q1");
  });

  it("names a half-yearly paper as such", () => {
    expect(sourceOf({ ...paper, exam: "Half-yearly", qNo: 3 })).toBe("Fort St 2025 Half-yearly, Q3");
  });
});

describe("paperLabel", () => {
  it("is the short label used in past-attempt names", () => {
    expect(paperLabel(paper)).toBe("Fort St 2025 · Q1");
  });
});
