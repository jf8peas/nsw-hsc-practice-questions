import "server-only";

import { getConcept } from "@/content";
import { dbCall } from "@/lib/db/index.server";
import { listFinishedOpenAttempts } from "@/lib/db/queries/essay-phases.server";
import type { Attempt, EssayPhaseRow } from "@/lib/db/schema";
import { essayModelEssay, essayPublicView } from "@/lib/grading.server";
import { saveResult, type ResultFields } from "@/lib/results/save.server";

import { outcomesFrom } from "./scoring";
import { ESSAY_UNIT_ID, type EssayResultView } from "./types";
import { resultView } from "./views";

/** The `results` row's fields for a finished essay row: the final mark out of 20, the band reason, the concept outcomes. */
export function resultFieldsFor(row: EssayPhaseRow): ResultFields {
  return {
    questionId: row.questionId,
    answer: row.essayText ?? "",
    marks: row.finalMark ?? 0,
    max: 20,
    gradedBy: "llm",
    feedback: row.bandReason,
    hits: null,
    misses: null,
    conceptOutcomes: outcomesFrom(row.gaps ?? [], row.usedWell ?? []),
  };
}

const termOf = (conceptId: string): string => getConcept(conceptId)?.concept.term ?? getConcept(conceptId)?.concept.description ?? conceptId;

/**
 * The student's own finished result, including the band 1 model essay. Callers MUST have checked that the
 * row is finished and belongs to the session user; nothing else may call this (Principle I).
 */
export function finishedResult(row: EssayPhaseRow): EssayResultView | null {
  const essay = essayPublicView(row.questionId);
  if (!essay) return null;
  return resultView(row, essay, { modelEssay: essayModelEssay(row.questionId), termOf });
}

/**
 * Repairs a finished essay whose `results` row was never saved (a failed save after marking): the attempt would
 * stay open and block every other essay. The save is idempotent (spec 010 analysis C2).
 */
export async function repairFinishedAttempts(userId: string, openAttempt: Attempt | null): Promise<void> {
  if (!openAttempt) return;
  const stuck = await dbCall((db) => listFinishedOpenAttempts(db, userId, ESSAY_UNIT_ID));
  for (const row of stuck) {
    if (row.attemptId !== openAttempt.id) continue;
    await saveResult(
      userId,
      row.attemptId,
      {
        unitId: openAttempt.unitId,
        questionIds: openAttempt.questionIds,
        mcOptionOrder: openAttempt.mcOptionOrder,
        issuedAt: Math.floor(openAttempt.startedAt.getTime() / 1000),
      },
      resultFieldsFor(row),
    );
  }
}
