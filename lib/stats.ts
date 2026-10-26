// Pure score statistics for the unit page and /progress (research R15).
// No server-only import: safe anywhere.

/** One attempt, reduced to what the statistics need. */
export interface AttemptScore {
  marks: number;
  max: number;
  /** null while the attempt is incomplete. */
  completedAt: Date | string | null;
  startedAt?: Date | string;
}

export type TrendKind = "up" | "down" | "steady" | "none";

export interface Trend {
  kind: TrendKind;
  /** recent mean minus previous mean, in percentage points (absent when kind is "none"). */
  delta?: number;
}

/** Points either side of zero that still count as "steady". */
export const STEADY_BAND = 5;

/** marks / max as a percentage (unrounded). An attempt with nothing to mark scores 0. */
export function attemptPercent(marks: number, max: number): number {
  // multiply first: (55 / 100) * 100 is 55.00000000000001, which would break the +/-5 boundary
  return max > 0 ? (marks * 100) / max : 0;
}

const time = (d: Date | string) => new Date(d).getTime();

/** Completed attempts only, oldest first by completion time. */
export function completedOnly<T extends AttemptScore>(attempts: readonly T[]): T[] {
  return attempts
    .filter((a) => a.completedAt !== null)
    .sort((a, b) => time(a.completedAt!) - time(b.completedAt!));
}

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

/**
 * Best and latest percentage (rounded), from COMPLETED attempts only.
 * Incomplete attempts never count (FR-012).
 */
export function bestLatest(attempts: readonly AttemptScore[]): {
  best: number | null;
  latest: number | null;
  completed: number;
} {
  const done = completedOnly(attempts).map((a) => attemptPercent(a.marks, a.max));
  if (done.length === 0) return { best: null, latest: null, completed: 0 };
  return {
    best: Math.round(Math.max(...done)),
    latest: Math.round(done[done.length - 1]),
    completed: done.length,
  };
}

/**
 * Trend over completed attempts, oldest to newest (n of them):
 *  - fewer than 2: no trend;
 *  - k = min(3, n - 1); "recent" is the mean of the last k, "previous" the mean
 *    of up to 3 before those;
 *  - up if recent - previous is above +5 points, down if below -5, else steady
 *    (exactly +/-5 is steady).
 */
export function trend(attempts: readonly AttemptScore[]): Trend {
  const pct = completedOnly(attempts).map((a) => attemptPercent(a.marks, a.max));
  const n = pct.length;
  if (n < 2) return { kind: "none" };
  const k = Math.min(3, n - 1);
  const recent = pct.slice(n - k);
  const previous = pct.slice(Math.max(0, n - k - 3), n - k);
  // round away floating-point noise so exactly +/-5 points is steady
  const delta = Math.round((mean(recent) - mean(previous)) * 1e6) / 1e6;
  if (delta > STEADY_BAND) return { kind: "up", delta };
  if (delta < -STEADY_BAND) return { kind: "down", delta };
  return { kind: "steady", delta };
}
