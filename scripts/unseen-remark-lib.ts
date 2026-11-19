// Pure helpers for the offline re-mark of first-try answers (spec 008 FR-037, research R11). The marker
// can be lenient, and students rarely flag a mark that is too generous, so a sample of real first-try
// answers marked at full marks or one below is re-marked by a stronger model and the disagreements
// become labelled test cases. No database, network or secret here; unit-tested.

export const DEFAULT_SAMPLE = 40;

/** The re-mark must use a model other than (and by intent stronger than) the one that marks students. */
export function checkRemarkModels(remark: string | undefined, grading: string): string | null {
  if (!remark || !remark.trim()) return "REMARK_MODEL is not set. Choose a model STRONGER than the marker (ENGLISH_ADV_GRADING_MODEL).";
  if (remark.trim() === grading) return `REMARK_MODEL is the same as the marker (${grading}); a re-mark needs a stronger model.`;
  return null;
}

export interface SampleRow {
  questionId: string;
  maxMarks: number;
  /** The first try's mark and text. */
  mark: number;
  text: string;
}

/** Deterministic shuffle so a sample can be reproduced (seeded linear congruential generator). */
function shuffled<T>(items: T[], seed: number): T[] {
  const a = items.slice();
  let s = seed >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Up to `n` rows marked at full marks or one below, half and half (the one-below half comes first when
 * n is odd, since middle-band leniency is what the pilot saw). A short half is topped up from the other.
 * A one-mark question has no "one below" band that is meaningful, so only its full marks are eligible.
 */
export function pickSample(rows: SampleRow[], n: number, seed = 7): SampleRow[] {
  const eligible = rows.filter((r) => (r.mark === r.maxMarks) || (r.mark === r.maxMarks - 1 && r.maxMarks > 1));
  const full = shuffled(eligible.filter((r) => r.mark === r.maxMarks), seed);
  const below = shuffled(eligible.filter((r) => r.mark !== r.maxMarks), seed + 1);
  const wantBelow = Math.ceil(n / 2);
  const takeBelow = Math.min(below.length, wantBelow);
  const takeFull = Math.min(full.length, n - takeBelow);
  const topUp = Math.min(below.length - takeBelow, n - takeBelow - takeFull);
  return [...below.slice(0, takeBelow + topUp), ...full.slice(0, takeFull)];
}

export interface Disagreement {
  row: SampleRow;
  strongMark: number;
  /** The stronger model gave fewer marks than the app did: leniency. */
  tooHigh: boolean;
  note: string;
}

/** Null when the two agree. */
export function compareMarks(row: SampleRow, strongMark: number): Disagreement | null {
  if (strongMark === row.mark) return null;
  const tooHigh = strongMark < row.mark;
  return {
    row,
    strongMark,
    tooHigh,
    note: `re-mark disagreement: app ${row.mark}/${row.maxMarks}, stronger model ${strongMark}/${row.maxMarks} (${tooHigh ? "app too high" : "app too low"}). Label what the mark SHOULD be.`,
  };
}

/** "Marked too high" first, then the lower bands first (the middle band before full marks), then by id. */
export function orderDisagreements(found: Disagreement[]): Disagreement[] {
  return [...found].sort(
    (a, b) =>
      Number(b.tooHigh) - Number(a.tooHigh) ||
      a.row.mark / a.row.maxMarks - b.row.mark / b.row.maxMarks ||
      a.row.questionId.localeCompare(b.row.questionId),
  );
}
