import "server-only";

import { randomUUID } from "node:crypto";

import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { createEnglishEssayAttempt, getLatestIncompleteAttempt } from "@/lib/db/queries/attempts.server";
import type { Attempt } from "@/lib/db/schema";
import { englishEssayIsLive, englishEssayPublicView } from "@/lib/grading.server";

import { repairFinishedEnglishAttempts } from "./results.server";
import { loadEnglishEssayState } from "./state.server";
import type { EnglishEssayState, PublicEnglishEssay } from "./types";
import { ENGLISH_ESSAY_UNIT_ID } from "./types";

// Start, rejoin or resume the student's one OPEN English essay attempt (spec 011, contracts/api.md B). The student picks
// the essay; a second essay cannot start while one is open (the partial unique index
// `attempts_english_essay_incomplete_unique` is the backstop, so two tabs starting at once end on one attempt). Without
// the database nothing can be started or resumed, so the unit does not start (constitution Principle VI).

export type StartEnglishEssay =
  | { kind: "unavailable" }
  | { kind: "not_found" }
  | { kind: "no_open_attempt" }
  | { kind: "attempt_open"; questionId: string }
  | { kind: "ok"; created: boolean; attempt: Attempt; essay: PublicEnglishEssay; englishEssayState: EnglishEssayState };

export async function startEnglishEssay(userId: string, questionId?: string): Promise<StartEnglishEssay> {
  try {
    if (questionId !== undefined && !englishEssayIsLive(questionId)) return { kind: "not_found" };

    let open = await dbCall((db) => getLatestIncompleteAttempt(db, userId, ENGLISH_ESSAY_UNIT_ID));
    // a finished essay whose result row was never saved would block everything: heal it first
    if (open) {
      await repairFinishedEnglishAttempts(userId, open);
      open = await dbCall((db) => getLatestIncompleteAttempt(db, userId, ENGLISH_ESSAY_UNIT_ID));
    }

    let attempt: Attempt | null = open;
    let created = false;
    if (attempt) {
      if (questionId !== undefined && attempt.questionIds[0] !== questionId) {
        return { kind: "attempt_open", questionId: attempt.questionIds[0]! };
      }
    } else {
      if (questionId === undefined) return { kind: "no_open_attempt" };
      const made = await dbCall((db) => createEnglishEssayAttempt(db, { id: randomUUID(), userId, unitId: ENGLISH_ESSAY_UNIT_ID, questionId }));
      attempt = made.attempt;
      created = made.created;
      // two tabs starting different essays at once: the loser lands on the winner's attempt
      if (attempt.questionIds[0] !== questionId) return { kind: "attempt_open", questionId: attempt.questionIds[0]! };
    }

    const essay = englishEssayPublicView(attempt.questionIds[0]!);
    if (!essay) return { kind: "unavailable" };
    const current = attempt;
    const englishEssayState = await dbCall((db) => loadEnglishEssayState(db, userId, current));
    if (!englishEssayState) return { kind: "unavailable" };
    return { kind: "ok", created, attempt: current, essay, englishEssayState };
  } catch (error) {
    if (error instanceof DbUnavailableError) return { kind: "unavailable" };
    throw error;
  }
}
