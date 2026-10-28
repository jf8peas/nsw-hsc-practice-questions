// The home page lists units grouped by year, with the HSC year first (Year 12, then Year 11) and
// the newest unit at the top of each group (content/index.ts unitsByYear).

import { describe, expect, it } from "vitest";

import { unitsByYear } from "@/content";

describe("unitsByYear", () => {
  it("lists Year 12 before Year 11", () => {
    expect(unitsByYear().map((group) => group.year)).toEqual(["Year 12", "Year 11"]);
  });

  it("puts each year's units in that year, newest first", () => {
    for (const group of unitsByYear()) {
      expect(group.units.every((unit) => unit.year === group.year)).toBe(true);
      expect(group.isEmpty).toBe(group.units.length === 0);

      const created = group.units.map((unit) => unit.created);
      expect([...created].sort().reverse()).toEqual(created);
    }
  });
});
