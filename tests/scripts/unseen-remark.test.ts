// The offline re-mark (spec 008 FR-037): the model must differ from the marker, the sample is first
// tries at full marks or one below half and half, "marked too high" comes first and lower bands first,
// and the script can never touch a student's daily allowance.

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DEFAULT_SAMPLE, checkRemarkModels, compareMarks, orderDisagreements, pickSample, type SampleRow } from "../../scripts/unseen-remark-lib";

const row = (mark: number, i: number, maxMarks = 4, q = "y12-english-advanced-unseen-texts.fs25-q1"): SampleRow => ({ questionId: q, maxMarks, mark, text: `answer ${mark}-${i}` });
const bank = (): SampleRow[] => [
  ...Array.from({ length: 30 }, (_, i) => row(4, i)),
  ...Array.from({ length: 30 }, (_, i) => row(3, i)),
  ...Array.from({ length: 30 }, (_, i) => row(2, i)), // never eligible
];

describe("checkRemarkModels", () => {
  it("refuses an unset REMARK_MODEL and one equal to the marker", () => {
    expect(checkRemarkModels(undefined, "m")).toContain("REMARK_MODEL is not set");
    expect(checkRemarkModels("  ", "m")).toContain("REMARK_MODEL is not set");
    expect(checkRemarkModels("m", "m")).toContain("same as the marker");
    expect(checkRemarkModels("stronger", "m")).toBeNull();
  });
});

describe("pickSample", () => {
  it("takes first tries at full marks or one below, half and half, and nothing lower", () => {
    const s = pickSample(bank(), DEFAULT_SAMPLE);
    expect(s).toHaveLength(40);
    expect(s.filter((r) => r.mark === 3)).toHaveLength(20);
    expect(s.filter((r) => r.mark === 4)).toHaveLength(20);
    expect(s.some((r) => r.mark === 2)).toBe(false);
  });
  it("tops up from the other band when one runs short, and is reproducible", () => {
    const rows = [...Array.from({ length: 30 }, (_, i) => row(4, i)), ...Array.from({ length: 4 }, (_, i) => row(3, i))];
    const s = pickSample(rows, 20);
    expect(s).toHaveLength(20);
    expect(s.filter((r) => r.mark === 3)).toHaveLength(4);
    expect(pickSample(rows, 20)).toEqual(s);
  });
  it("never samples a one-mark question's zero as a middle band", () => {
    expect(pickSample([row(0, 1, 1), row(1, 2, 1)], 10).map((r) => r.mark)).toEqual([1]);
  });
});

describe("compareMarks and orderDisagreements", () => {
  it("only a different mark is a disagreement; fewer marks is leniency", () => {
    expect(compareMarks(row(4, 1), 4)).toBeNull();
    expect(compareMarks(row(4, 1), 3)).toMatchObject({ tooHigh: true });
    expect(compareMarks(row(3, 1), 4)).toMatchObject({ tooHigh: false });
  });
  it("puts marked-too-high first, and the lower band before full marks", () => {
    const found = [row(3, 1), row(4, 2), row(3, 3), row(4, 4)].map((r, i) => compareMarks(r, i === 0 ? 4 : r.mark - 1)!);
    const ordered = orderDisagreements(found);
    expect(ordered.map((d) => d.tooHigh)).toEqual([true, true, true, false]);
    expect(ordered.slice(0, 3).map((d) => d.row.mark)).toEqual([3, 4, 4]);
  });
});

describe("the script cannot touch a student's allowance", () => {
  it("never imports the usage module or names the daily table", () => {
    for (const f of ["scripts/unseen-remark.ts", "scripts/unseen-remark-lib.ts"]) {
      const lines = fs.readFileSync(path.resolve(f), "utf8").split(/\r?\n/);
      const src = lines.filter((l) => !l.trim().startsWith("//")).join(" "); // code, not comments
      expect(src, f).not.toMatch(/usage\.server|reserveAiSlot|refundAiSlot|dailyAiUsage|daily_ai_usage|ratelimit/);
      expect(src, f).not.toMatch(/\.(insert|update|delete)\(/);
    }
  });
});
