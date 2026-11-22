import "server-only";

import { randomUUID } from "node:crypto";

import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { createEssayAttempt, getLatestIncompleteAttempt } from "@/lib/db/queries/attempts.server";
import type { Attempt } from "@/lib/db/schema";
import { essayIsLive, essayPublicView } from "@/lib/grading.server";

import { repairFinishedAttempts } from "./results.server";
import { loadEssayState } from "./state.server";
import type { EssayState, PublicEssay } from "./types";
import { ESSAY_UNIT_ID } from "./types";

// Start, rejoin or resume the student's one OPEN essay attempt (spec 010, research R10, contracts/api.md B).
// The student picks the essay; a second essay cannot start while one is open (the partial unique index
// `attempts_essay_incomplete_unique` is the backstop, so two tabs starting at once end on one attempt). Without
// the database nothing can be started or resumed, so the unit does not start (constitution Principle VI).

export type StartEssay =
  | { kind: "unavailable" }
  | { kind: "not_found" }
  | { kind: "no_open_attempt" }
  | { kind: "attempt_open"; questionId: string }
  | { kind: "ok"; created: boolean; attempt: Attempt; essay: PublicEssay; essayState: EssayState };

export async function startEssay(userId: string, questionId?: string): Promise<StartEssay> {
  try {
    if (questionId !== undefined && !essayIsLive(questionId)) return { kind: "not_found" };

    let open = await dbCall((db) => getLatestIncompleteAttempt(db, userId, ESSAY_UNIT_ID));
    // a finished essay whose result row was never saved would block everything: heal it first
    if (open) {
      await repairFinishedAttempts(userId, open);
      open = await dbCall((db) => getLatestIncompleteAttempt(db, userId, ESSAY_UNIT_ID));
    }

    let attempt: Attempt | null = open;
    let created = false;
    if (attempt) {
      if (questionId !== undefined && attempt.questionIds[0] !== questionId) {
        return { kind: "attempt_open", questionId: attempt.questionIds[0]! };
      }
    } else {
      if (questionId === undefined) return { kind: "no_open_attempt" };
      const made = await dbCall((db) => createEssayAttempt(db, { id: randomUUID(), userId, unitId: ESSAY_UNIT_ID, questionId }));
      attempt = made.attempt;
      created = made.created;
      // two tabs starting different essays at once: the loser lands on the winner's attempt
      if (attempt.questionIds[0] !== questionId) return { kind: "attempt_open", questionId: attempt.questionIds[0]! };
    }

    const essay = essayPublicView(attempt.questionIds[0]!);
    if (!essay) return { kind: "unavailable" };
    const current = attempt;
    const essayState = await dbCall((db) => loadEssayState(db, userId, current));
    if (!essayState) return { kind: "unavailable" };
    return { kind: "ok", created, attempt: current, essay, essayState };
  } catch (error) {
    if (error instanceof DbUnavailableError) return { kind: "unavailable" };
    throw error;
  }
}
