// Concept progress (spec 002 FR-004 to FR-008, constitution Principle II).
//
// A student's progress is never stored: it is replayed from their saved results, in the order
// the answers were given, using each question's CURRENT concept tag. A plain module with no I/O,
// no secrets and no answer key, so it is cheap to test and safe anywhere.
//
//   a wrong answer sets the concept's count to 3
//   a correct answer (full marks) takes 1 away, never below 0
//   a concept at 0 is cleared and is not listed

import type { Unit } from "@/lib/types";

/** One saved result, reduced to what progress needs. */
export interface ConceptResult {
  id: string;
  questionId: string;
  marks: number;
  max: number;
  /** When the answer was given (results.created_at, which a late save keeps; see research R2). */
  answeredAt: Date;
}

/** An uncleared concept. */
export interface ConceptState {
  conceptId: string;
  count: 1 | 2 | 3;
  /** When the student last got a question on this concept wrong. */
  lastMissedAt: Date;
}

const MAX_COUNT = 3;

/**
 * The student's uncleared concepts for one unit, highest count first, then most recently
 * missed, then concept id. A concept the student has never missed is never listed.
 *
 * The concept of a result is its question's `concept`; for a question that has since been
 * removed, the concept recorded for it in the unit's `retired` map. A question with no tag,
 * a removed question recorded as having none (`null`), and an unknown id count toward nothing.
 */
export function conceptProgress(unit: Unit, results: readonly ConceptResult[]): ConceptState[] {
  const tags = new Map(unit.questions.map((q) => [q.id, q.concept] as const));
  const conceptOf = (questionId: string): string | undefined =>
    tags.has(questionId) ? tags.get(questionId) : (unit.retired?.[questionId] ?? undefined);

  const ordered = [...results].sort(
    (a, b) => a.answeredAt.getTime() - b.answeredAt.getTime() || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );

  const state = new Map<string, { count: number; lastMissedAt: Date | null }>();
  for (const r of ordered) {
    const concept = conceptOf(r.questionId);
    if (!concept) continue;
    const current = state.get(concept) ?? { count: 0, lastMissedAt: null };
    if (r.marks >= r.max) {
      current.count = Math.max(0, current.count - 1);
    } else {
      current.count = MAX_COUNT;
      current.lastMissedAt = r.answeredAt;
    }
    state.set(concept, current);
  }

  const out: ConceptState[] = [];
  for (const [conceptId, s] of state) {
    if (s.count > 0 && s.lastMissedAt) {
      out.push({ conceptId, count: s.count as 1 | 2 | 3, lastMissedAt: s.lastMissedAt });
    }
  }
  return out.sort(
    (a, b) =>
      b.count - a.count ||
      b.lastMissedAt.getTime() - a.lastMissedAt.getTime() ||
      (a.conceptId < b.conceptId ? -1 : a.conceptId > b.conceptId ? 1 : 0),
  );
}

/** One saved result from any unit (the home page's "to review" counts). */
export interface ConceptResultWithUnit extends ConceptResult {
  unitId: string;
}

/**
 * How many concepts are not yet cleared, per unit, for the units listed — the home page's
 * "to review" numbers ("Things you need to know" on the unit page, in one pass for every
 * card). Only units in `units` are counted, so a result for a unit id that is no longer in
 * content is ignored; a unit with nothing to review is absent from the map. A unit that has
 * not adopted concepts naturally never appears, because its untagged questions count toward
 * nothing.
 */
export function conceptReviewCounts(
  units: readonly Unit[],
  results: readonly ConceptResultWithUnit[],
): Map<string, number> {
  const perUnit = new Map<string, ConceptResult[]>();
  for (const r of results) {
    const list = perUnit.get(r.unitId);
    if (list) list.push(r);
    else perUnit.set(r.unitId, [r]);
  }
  const out = new Map<string, number>();
  for (const unit of units) {
    const list = perUnit.get(unit.id);
    if (!list) continue;
    const n = conceptProgress(unit, list).length;
    if (n > 0) out.set(unit.id, n);
  }
  return out;
}
