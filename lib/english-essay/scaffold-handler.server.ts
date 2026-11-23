import "server-only";

import type { NextResponse } from "next/server";

import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { getAttemptForUser } from "@/lib/db/queries/attempts.server";
import { getEnglishEssayPhase, insertEnglishEssayPhase, lockEnglishScaffold, saveEnglishScaffold } from "@/lib/db/queries/english-essay-phases.server";
import { bad, json } from "@/lib/grade-common.server";
import { checkDraftRateLimit } from "@/lib/ratelimit.server";

import { ENGLISH_SCAFFOLD_CAP, emptyEnglishEssayScaffold, sanitiseEnglishEssayScaffold, validateEnglishScaffold } from "./scaffold";
import { ENGLISH_ESSAY_UNIT_ID } from "./types";

// POST /api/english-essay/scaffold (spec 011, contracts/api.md C): autosave the plan while it is editable (`save`) and
// lock it and move on to the essay (`start`, the "Start writing" button). The server recounts the words and re-checks the
// thesis rule itself; once locked, nothing can edit the plan again. The client never sends a word count.

export async function handleEnglishScaffold(
  user: { id: string },
  body: Record<string, unknown>,
  attemptId: string,
  questionId: string,
): Promise<NextResponse> {
  const action = body.action;
  if (action !== "save" && action !== "start") return bad("invalid_request");
  const scaffold = sanitiseEnglishEssayScaffold(body.scaffold);
  if (!scaffold) return bad("invalid_request");

  if (action === "save") {
    // a separate limiter from marking: autosave fires often
    const limited = await checkDraftRateLimit(user.id);
    if (!limited.ok) {
      return json({ error: "rate_limited", retryAfter: limited.retryAfter }, 429, limited.retryAfter ? { "retry-after": String(limited.retryAfter) } : undefined);
    }
  }

  try {
    const attempt = await dbCall((db) => getAttemptForUser(db, user.id, attemptId));
    if (!attempt || attempt.unitId !== ENGLISH_ESSAY_UNIT_ID || attempt.questionIds[0] !== questionId || attempt.completedAt) {
      return bad("not_found", 404);
    }
    const row = await dbCall((db) =>
      getEnglishEssayPhase(db, user.id, attemptId, questionId).then(
        (r) => r ?? insertEnglishEssayPhase(db, { attemptId, userId: user.id, unitId: attempt.unitId, questionId, scaffold: emptyEnglishEssayScaffold() }),
      ),
    );
    if (row.status !== "planning") return bad("scaffold_locked", 409);

    const checked = validateEnglishScaffold(scaffold, action);
    if (!checked.ok) {
      if (action === "save") return bad("over_cap", 400, { words: checked.words, max: ENGLISH_SCAFFOLD_CAP });
      return bad("scaffold_invalid", 400, { reasons: checked.reasons, words: checked.words });
    }

    if (action === "save") {
      const saved = await dbCall((db) => saveEnglishScaffold(db, user.id, attemptId, questionId, scaffold, checked.words));
      if (!saved) return bad("scaffold_locked", 409);
      return json({ saved: true, words: checked.words });
    }
    const locked = await dbCall((db) => lockEnglishScaffold(db, user.id, attemptId, questionId, scaffold, checked.words));
    if (!locked) return bad("scaffold_locked", 409);
    return json({ started: true, stage: "write", locked: true });
  } catch (error) {
    if (error instanceof DbUnavailableError) return bad("temporarily_unavailable", 503);
    throw error;
  }
}
