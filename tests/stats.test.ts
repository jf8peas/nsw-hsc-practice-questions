import { describe, expect, it } from "vitest";

import { attemptPercent, bestLatest, completedOnly, trend, type AttemptScore } from "@/lib/stats";

const day = (n: number) => new Date(Date.UTC(2026, 0, n));

/** A completed attempt scoring `pct` out of 100, finished on day `n`. */
const done = (pct: number, n: number): AttemptScore => ({ marks: pct, max: 100, completedAt: day(n) });
/** An incomplete attempt. */
const partial = (pct: number): AttemptScore => ({ marks: pct, max: 100, completedAt: null });

describe("attemptPercent", () => {
  it("is marks over max as a percentage", () => {
    expect(attemptPercent(7, 10)).toBe(70);
    expect(attemptPercent(0, 10)).toBe(0);
    expect(attemptPercent(1, 3)).toBeCloseTo(33.333, 2);
  });

  it("an attempt with nothing to mark scores 0", () => {
    expect(attemptPercent(0, 0)).toBe(0);
  });
});

describe("bestLatest uses completed attempts only", () => {
  it("empty history", () => {
    expect(bestLatest([])).toEqual({ best: null, latest: null, completed: 0 });
  });

  it("only incomplete attempts: nothing", () => {
    expect(bestLatest([partial(100), partial(40)])).toEqual({ best: null, latest: null, completed: 0 });
  });

  it("latest is the most recently COMPLETED, regardless of input order", () => {
    const attempts = [done(80, 5), done(40, 1), done(60, 3)];
    expect(bestLatest(attempts)).toEqual({ best: 80, latest: 80, completed: 3 });
    expect(bestLatest([done(40, 1), done(90, 2), done(55, 3)])).toEqual({ best: 90, latest: 55, completed: 3 });
  });

  it("an incomplete 100% never becomes the best, and does not change latest", () => {
    expect(bestLatest([done(50, 1), partial(100), done(60, 2)])).toEqual({ best: 60, latest: 60, completed: 2 });
  });

  it("rounds to whole percentages", () => {
    expect(bestLatest([{ marks: 2, max: 3, completedAt: day(1) }])).toEqual({ best: 67, latest: 67, completed: 1 });
  });
});

describe("completedOnly", () => {
  it("drops incomplete attempts and sorts oldest first", () => {
    const out = completedOnly([done(1, 3), partial(2), done(3, 1)]);
    expect(out.map((a) => a.marks)).toEqual([3, 1]);
  });
});

describe("trend (recent k vs up to 3 before, +/-5 is steady)", () => {
  const cases: Array<[string, AttemptScore[], string]> = [
    ["no attempts", [], "none"],
    ["one completed attempt", [done(70, 1)], "none"],
    ["only incomplete attempts", [partial(10), partial(90)], "none"],
    ["two attempts, rising by 20", [done(50, 1), done(70, 2)], "up"],
    ["two attempts, falling by 20", [done(70, 1), done(50, 2)], "down"],
    ["two attempts, up exactly 5 is steady", [done(50, 1), done(55, 2)], "steady"],
    ["two attempts, down exactly 5 is steady", [done(55, 1), done(50, 2)], "steady"],
    ["two attempts, up 6 is up", [done(50, 1), done(56, 2)], "up"],
    ["two attempts, down 6 is down", [done(56, 1), done(50, 2)], "down"],
    ["four attempts: last 3 vs the 1 before", [done(40, 1), done(60, 2), done(60, 3), done(60, 4)], "up"],
    [
      "six attempts: last 3 vs previous 3",
      [done(40, 1), done(40, 2), done(40, 3), done(80, 4), done(80, 5), done(80, 6)],
      "up",
    ],
    [
      "six attempts, falling",
      [done(80, 1), done(80, 2), done(80, 3), done(40, 4), done(40, 5), done(40, 6)],
      "down",
    ],
    [
      "nine attempts: only the last six matter",
      [done(0, 1), done(0, 2), done(0, 3), done(60, 4), done(60, 5), done(60, 6), done(62, 7), done(62, 8), done(62, 9)],
      "steady",
    ],
    ["an incomplete attempt in the middle is ignored", [done(50, 1), partial(0), done(50, 2)], "steady"],
  ];

  it.each(cases)("%s -> %s", (_name, attempts, kind) => {
    expect(trend(attempts).kind).toBe(kind);
  });

  it("reports the difference in points", () => {
    expect(trend([done(50, 1), done(70, 2)]).delta).toBe(20);
    expect(trend([done(70, 1)]).delta).toBeUndefined();
  });

  it("does not depend on input order", () => {
    const shuffled = [done(80, 6), done(40, 1), done(80, 5), done(40, 2), done(80, 4), done(40, 3)];
    expect(trend(shuffled).kind).toBe("up");
  });
});
