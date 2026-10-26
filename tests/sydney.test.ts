import { describe, expect, it } from "vitest";

import {
  formatResetMessage,
  nextSydneyMidnight,
  resetLabel,
  sydneyDate,
  sydneyOffsetMs,
  toSydneyIso,
} from "@/lib/sydney";

const HOUR = 3_600_000;

describe("sydneyDate and offsets", () => {
  it("uses AEDT (+11) in summer and AEST (+10) in winter", () => {
    expect(sydneyOffsetMs(new Date("2026-01-15T00:00:00Z"))).toBe(11 * HOUR);
    expect(sydneyOffsetMs(new Date("2026-07-15T00:00:00Z"))).toBe(10 * HOUR);
  });

  it("gives the Sydney calendar date, not the UTC one", () => {
    expect(sydneyDate(new Date("2026-01-15T14:00:00Z"))).toBe("2026-01-16"); // 01:00 next day in Sydney
    expect(sydneyDate(new Date("2026-01-15T12:59:59Z"))).toBe("2026-01-15"); // 23:59:59 in Sydney
    expect(sydneyDate(new Date("2026-07-15T14:00:00Z"))).toBe("2026-07-16"); // 00:00 next day (+10)
    expect(sydneyDate(new Date("2026-07-15T13:59:59Z"))).toBe("2026-07-15");
  });
});

describe("nextSydneyMidnight", () => {
  it("is the next local midnight in a normal summer day (+11)", () => {
    // 2026-01-15 10:00 Sydney -> midnight starting the 16th = 2026-01-15T13:00:00Z
    expect(nextSydneyMidnight(new Date("2026-01-14T23:00:00Z")).toISOString()).toBe("2026-01-15T13:00:00.000Z");
  });

  it("is the next local midnight in winter (+10)", () => {
    expect(nextSydneyMidnight(new Date("2026-07-15T02:00:00Z")).toISOString()).toBe("2026-07-15T14:00:00.000Z");
  });

  it("23:59 -> one minute later; exactly 00:00 -> a full day later (strictly after now)", () => {
    // Sydney 23:59 on 15 Jan (+11) = 12:59Z
    const at2359 = new Date("2026-01-15T12:59:00Z");
    expect(nextSydneyMidnight(at2359).getTime() - at2359.getTime()).toBe(60_000);
    // Sydney 00:00 on 16 Jan = 13:00Z
    const at0000 = new Date("2026-01-15T13:00:00Z");
    expect(nextSydneyMidnight(at0000).toISOString()).toBe("2026-01-16T13:00:00.000Z");
  });

  it("DST ends (first Sunday in April, 5 Apr 2026): the 5th is a 25-hour day", () => {
    // Sat 4 Apr 12:00 Sydney (+11): next midnight is the start of Sun 5 Apr, still +11
    expect(nextSydneyMidnight(new Date("2026-04-04T01:00:00Z")).toISOString()).toBe("2026-04-04T13:00:00.000Z");
    // Sun 5 Apr 10:00 Sydney (+10 after the change): next midnight is the start of Mon 6 Apr at +10
    const sun = new Date("2026-04-05T00:00:00Z");
    expect(nextSydneyMidnight(sun).toISOString()).toBe("2026-04-05T14:00:00.000Z");
    // the day from midnight Sun to midnight Mon is 25 hours long
    const startOfSun = new Date("2026-04-04T13:00:00Z");
    expect(nextSydneyMidnight(startOfSun).getTime() - startOfSun.getTime()).toBe(25 * HOUR);
  });

  it("DST starts (first Sunday in October, 4 Oct 2026): the 4th is a 23-hour day", () => {
    const startOfSun = new Date("2026-10-03T14:00:00Z"); // Sun 4 Oct 00:00 at +10
    expect(sydneyDate(startOfSun)).toBe("2026-10-04");
    const next = nextSydneyMidnight(startOfSun);
    expect(next.toISOString()).toBe("2026-10-04T13:00:00.000Z"); // Mon 5 Oct 00:00 at +11
    expect(next.getTime() - startOfSun.getTime()).toBe(23 * HOUR);
  });

  it("the result is always exactly local midnight", () => {
    for (let day = 0; day < 400; day += 7) {
      const now = new Date(Date.UTC(2026, 0, 1 + day, 5, 17, 33));
      const next = nextSydneyMidnight(now);
      expect(toSydneyIso(next)).toMatch(/T00:00:00[+][01]\d:00$/);
      expect(next.getTime()).toBeGreaterThan(now.getTime());
      expect(next.getTime() - now.getTime()).toBeLessThanOrEqual(25 * HOUR);
    }
  });
});

describe("messages", () => {
  it("toSydneyIso formats with the Sydney offset", () => {
    expect(toSydneyIso(new Date("2026-10-26T13:00:00Z"))).toBe("2026-10-27T00:00:00+11:00");
    expect(toSydneyIso(new Date("2026-07-14T14:00:00Z"))).toBe("2026-07-15T00:00:00+10:00");
  });

  it("names midnight Sydney time and the day it returns", () => {
    const now = new Date("2026-10-26T03:00:00Z"); // Mon 26 Oct 14:00 Sydney
    expect(resetLabel(now)).toContain("midnight Sydney time");
    expect(resetLabel(now)).toContain("Tue");
    expect(resetLabel(now)).toContain("27");
    expect(formatResetMessage(now)).toMatch(/^AI marking is paused until midnight Sydney time \(.*\)\. Mark this one yourself\.$/);
  });
});
