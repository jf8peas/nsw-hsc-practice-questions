import "server-only";

import { and, eq } from "drizzle-orm";

import { essayProgress, type EssayProgress } from "@/lib/attempts/sequence.server";
import type { Db } from "@/lib/db/index.server";
import { results } from "@/lib/db/schema";
import type { Unit } from "@/lib/types";

/** The recorded marks (a result exists) for the student's questions in one unit, by question id. */
export async function recordedMarks(db: Db, userId: string, unitId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ questionId: results.questionId, marks: results.marksAwarded })
    .from(results)
    .where(and(eq(results.userId, userId), eq(results.unitId, unitId)));
  return new Map(rows.map((r) => [r.questionId, r.marks]));
}

/** Where the student is in a sequential unit (spec 007): derived from results only, never stored. */
export async function loadEssayProgressFor(db: Db, userId: string, unit: Unit): Promise<EssayProgress> {
  return essayProgress(unit, await recordedMarks(db, userId, unit.id));
}
