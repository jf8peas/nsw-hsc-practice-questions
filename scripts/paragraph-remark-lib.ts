// Pure helpers for the offline re-mark of full-mark answers (spec 007 FR-031, research R8). The
// marker's known weakness is leniency (resources/topic010/06-findings-holdout.md), and students
// rarely flag a mark that is too generous, so a sample of real full-mark answers is re-marked by a
// stronger model and the disagreements become labelled test cases. No database, network or secret
// here; unit-tested.

import type { ParagraphVerdicts } from "../lib/db/schema";
import type { CriterionKey } from "../lib/paragraph/parts";

/** The three known leniency patterns, checked first: [part number, criterion]. */
export const LENIENCY_PATTERNS: Array<{ part: 1 | 2 | 5; criterion: CriterionKey; label: string }> = [
  { part: 5, criterion: "a", label: "Link (a): comparatives taken as a judgement of extent" },
  { part: 1, criterion: "b", label: "Topic (b): \"success\" accepted as the named outcome" },
  { part: 2, criterion: "c", label: "Mechanism (c): a drawback inside the mechanism with no statistic" },
];

/** The re-mark must use a model other than (and by intent stronger than) the one that marks students. */
export function checkRemarkModels(remark: string | undefined, grading: string): string | null {
  if (!remark || !remark.trim()) return "REMARK_MODEL is not set. Choose a model STRONGER than the marker (GRADING_MODEL).";
  if (remark.trim() === grading) return `REMARK_MODEL is the same as the marker (${grading}); a re-mark needs a stronger model.`;
  return null;
}

export interface SampleRow {
  questionId: string;
  part: number;
  text: string;
  verdicts: ParagraphVerdicts;
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
 * Up to `n` rows. With `priorityFirst` the parts that carry a known leniency pattern (Link,
 * Topic Sentence, Mechanism) fill the sample first, round-robin, then the rest are random.
 */
export function pickSample(rows: SampleRow[], n: number, priorityFirst = true, seed = 7): SampleRow[] {
  const mixed = shuffled(rows, seed);
  if (!priorityFirst) return mixed.slice(0, n);
  const prio = new Set(LENIENCY_PATTERNS.map((p) => p.part));
  const lanes = [...prio].map((part) => mixed.filter((r) => r.part === part));
  const picked: SampleRow[] = [];
  for (let i = 0; picked.length < n && lanes.some((l) => i < l.length); i++) {
    for (const lane of lanes) if (i < lane.length && picked.length < n) picked.push(lane[i]);
  }
  const rest = mixed.filter((r) => !picked.includes(r));
  return [...picked, ...rest].slice(0, n);
}

export interface Disagreement {
  row: SampleRow;
  /** Criteria the stored (app) marker met and the stronger model did NOT: leniency. */
  lenient: CriterionKey[];
  /** The known pattern this matches, if any. */
  pattern?: string;
  note: string;
}

/**
 * Compare a stored full-mark answer with the stronger model's verdicts. Only a criterion the app
 * marker credited and the stronger model refused counts (that is leniency; the reverse is a false
 * dock, which students flag themselves).
 */
export function compareVerdicts(row: SampleRow, strong: Record<CriterionKey, boolean>): Disagreement | null {
  const lenient = (["a", "b", "c", "d"] as const).filter((k) => row.verdicts[k].met && !strong[k]);
  if (lenient.length === 0) return null;
  const hit = LENIENCY_PATTERNS.find((p) => p.part === row.part && lenient.includes(p.criterion));
  const marks = (["a", "b", "c", "d"] as const).map((k) => `(${k}) app ${row.verdicts[k].met ? "met" : "not met"} / stronger ${strong[k] ? "met" : "not met"}`).join("; ");
  return { row, lenient, pattern: hit?.label, note: `re-mark disagreement. ${marks}. Label what the criteria SHOULD be.` };
}
