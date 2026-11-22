import "server-only";

import type { NextResponse } from "next/server";

import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { discardOpenAttempt } from "@/lib/db/queries/essay-phases.server";
import { bad, json } from "@/lib/grade-common.server";

// POST /api/essay/discard (spec 010 FR-002a, contracts/api.md B): the student drops their OPEN, unmarked essay
// attempt. The attempt row goes, and by cascade its plan, review and draft; earlier finished attempts are other
// rows and stay. Refused while a marking is in flight and for a finished attempt.

export async function handleDiscard(user: { id: string }, attemptId: string): Promise<NextResponse> {
  try {
    const outcome = await dbCall((db) => discardOpenAttempt(db, user.id, attemptId));
    if (outcome === "discarded") return json({ discarded: true });
    if (outcome === "marking_in_progress") return bad("marking_in_progress", 409);
    if (outcome === "already_finished") return bad("already_finished", 409);
    return bad("not_found", 404);
  } catch (error) {
    if (error instanceof DbUnavailableError) return bad("temporarily_unavailable", 503);
    throw error;
  }
}
