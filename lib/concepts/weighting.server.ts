import "server-only";

import { conceptProgress, type ConceptState } from "@/lib/concepts/progress";
import type { Db } from "@/lib/db/index.server";
import { listUnitResultsForProgress } from "@/lib/db/queries/results.server";
import type { Unit } from "@/lib/types";

/**
 * What the weighted quiz draw needs to know about a student in one unit (spec 002 US4).
 * Built from their saved results only; nothing about it reaches the client or the token.
 */
export interface Weighting {
  /** Uncleared concepts, highest count first, then most recently missed. Never empty. */
  states: ConceptState[];
  /** Question ids the student has answered before in this unit. */
  seen: ReadonlySet<string>;
  /** For each answered question, when it was last answered and whether that was correct. */
  lastAnswer: ReadonlyMap<string, { at: Date; correct: boolean }>;
}

/**
 * The weighting for this student and unit, or `null` for a normal quiz: the unit has not
 * adopted concepts, it has no quiz configuration (so the whole bank is drawn and there is
 * nothing to weight), or the student has no uncleared concepts.
 *
 * `userId` is the session user's id (Principle IX). A database failure propagates; the caller
 * treats it as "draw unweighted" so a quiz always starts (FR-046, Principle VI).
 */
export async function loadWeighting(db: Db, userId: string, unit: Unit): Promise<Weighting | null> {
  if (!unit.conceptsReady || !unit.quiz) return null;

  const results = await listUnitResultsForProgress(db, userId, unit.id);
  const states = conceptProgress(unit, results);
  if (states.length === 0) return null;

  const seen = new Set<string>();
  const lastAnswer = new Map<string, { at: Date; correct: boolean }>();
  for (const r of results) {
    seen.add(r.questionId);
    lastAnswer.set(r.questionId, { at: r.answeredAt, correct: r.marks >= r.max }); // in answer order, so the last wins
  }
  return { states, seen, lastAnswer };
}
