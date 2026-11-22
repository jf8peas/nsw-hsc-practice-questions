// spec 009 research R7/R9, task T016: the comparative unit exists for the app only once it has questions, so
// with the bank held back it has no card, no unit page and no API; and it shares skill progress with spec 008's.

import { describe, expect, it } from "vitest";

import { UNITS, getUnit } from "@/content";
import { questions } from "@/content/units/y12-english-advanced-comparative-texts/questions";

const CMP = "y12-english-advanced-comparative-texts";
const UNSEEN = "y12-english-advanced-unseen-texts";

describe("the comparative unit is registered only when it has questions", () => {
  it("is in the registry exactly when its bank is released", () => {
    expect(UNITS.some((u) => u.id === CMP)).toBe(questions.length > 0);
    expect(getUnit(CMP) !== undefined).toBe(questions.length > 0);
  });

  it("shares skill progress both ways with the unseen-text unit", async () => {
    const { meta } = await import("@/content/units/y12-english-advanced-comparative-texts/meta");
    expect(meta.sharesProgressWith).toEqual([UNSEEN]);
    expect(getUnit(UNSEEN)?.sharesProgressWith).toEqual([CMP]);
  });

  it("lists nine skill concepts: spec 008's seven by its ids, then the two of its own", async () => {
    const { concepts } = await import("@/content/units/y12-english-advanced-comparative-texts/concepts");
    expect(concepts).toHaveLength(9);
    expect(concepts.slice(0, 7).every((c) => c.id.startsWith(`${UNSEEN}.c-`))).toBe(true);
    expect(concepts.slice(7).map((c) => c.id)).toEqual([`${CMP}.c-compares-texts`, `${CMP}.c-treats-both-in-depth`]);
    expect(concepts.every((c) => c.clearAfter === 2)).toBe(true);
    const seven = getUnit(UNSEEN)!.concepts!;
    expect(concepts.slice(0, 7).map((c) => [c.id, c.term, c.description])).toEqual(seven.map((c) => [c.id, c.term, c.description]));
  });
});
