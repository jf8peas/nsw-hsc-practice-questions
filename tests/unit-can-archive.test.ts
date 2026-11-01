// unitCanArchive: a unit may be archived once it is 14 or more Sydney calendar days old,
// counted the same way as unitIsNew but against the Sydney calendar (lib/sydney.ts) rather
// than UTC. The 13/14-day boundary is the whole point, so it is pinned here.

import { describe, expect, it } from "vitest";

import { unitCanArchive } from "@/content";
import { sydneyDate } from "@/lib/sydney";
import type { Unit } from "@/lib/types";

const unitCreated = (created: string): Unit => ({
  id: "x",
  year: "Year 11",
  topic: "t",
  type: "Topic Quiz",
  title: "T",
  description: "",
  created,
  order: 0,
  questions: [],
});

describe("unitCanArchive", () => {
  it("is false at 13 days and true at 14 days (the boundary)", () => {
    // 2026-10-15 Sydney time; October 2026 uses AEDT (UTC+11) after the 4th.
    const now = new Date("2026-10-15T14:00:00+11:00");
    expect(sydneyDate(now)).toBe("2026-10-15");

    expect(unitCanArchive(unitCreated("2026-10-02"), now)).toBe(false); // 13 days
    expect(unitCanArchive(unitCreated("2026-10-01"), now)).toBe(true); // 14 days
  });

  it("counts Sydney calendar days, so an evening in Sydney is still the same day", () => {
    // 23:59 Sydney is early afternoon UTC: a UTC-day count would already be the next day.
    const now = new Date("2026-10-15T23:59:00+11:00");
    expect(unitCanArchive(unitCreated("2026-10-02"), now)).toBe(false);
    expect(unitCanArchive(unitCreated("2026-10-01"), now)).toBe(true);
  });

  it("does not jump a day across the Sydney DST change", () => {
    // AEDT starts at 02:00 AEST on Sunday 4 October 2026 (clocks jump to 03:00 AEDT, i.e.
    // 16:00 UTC on 3 October). Just afterwards the Sydney calendar date is still 2026-10-04.
    const afterDst = new Date("2026-10-03T16:30:00Z");
    expect(sydneyDate(afterDst)).toBe("2026-10-04");
    expect(sydneyDate(new Date("2026-10-03T15:30:00Z"))).toBe("2026-10-04"); // 01:30 AEST, before the jump

    expect(unitCanArchive(unitCreated("2026-10-03"), afterDst)).toBe(false); // 1 day
    expect(unitCanArchive(unitCreated("2026-09-20"), afterDst)).toBe(true); // 14 days
  });

  it("is false for a unit created today or in the future", () => {
    const now = new Date("2026-10-15T09:00:00+11:00");
    expect(unitCanArchive(unitCreated("2026-10-15"), now)).toBe(false);
    expect(unitCanArchive(unitCreated("2026-10-16"), now)).toBe(false);
  });

  it("honours a custom days threshold", () => {
    const now = new Date("2026-10-15T09:00:00+11:00");
    expect(unitCanArchive(unitCreated("2026-10-10"), now, 5)).toBe(true);
    expect(unitCanArchive(unitCreated("2026-10-11"), now, 5)).toBe(false);
  });
});
