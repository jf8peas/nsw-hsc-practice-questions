import "server-only";

import { NextResponse } from "next/server";

import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { deleteRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import { getParagraphPhase, insertParagraphPhase } from "@/lib/db/queries/paragraph-phases.server";
import { getResult } from "@/lib/db/queries/results.server";
import { paragraphDiscussion, paragraphPartOf } from "@/lib/grading.server";
import { partKeyOf } from "@/lib/paragraph/parts";
import { conceptOutcomes, markOf, verdictsFromTicks } from "@/lib/paragraph/scoring";
import { buildReceipt, saveResult, type ResultFields } from "@/lib/results/save.server";
import { attemptFieldsOf, type AttemptTokenPayload } from "@/lib/tokens.server";
import type { ParagraphQuestion } from "@/lib/types";

// Self-marking a paragraph part (spec 007 FR-033): the marker was unavailable or the student was
// over the daily limit at phase 1. The student ticks each criterion their text meets; the ticks
// are the mark and the tip results (ticked = a correct first-try use, unticked = a phase 1 miss).
// There is no phase 2 on this path. The self-mark token (issued by the grade route) binds the
// answer, so the text that was ticked is the text that was sent for marking.

const MAX_ANSWER_LEN = 6000;

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
const bad = (error: string, status = 400) => json({ error }, status);

export async function handleParagraphSelfMark(
  user: { id: string },
  body: Record<string, unknown>,
  token: AttemptTokenPayload,
  question: ParagraphQuestion,
  degradedIn: boolean,
): Promise<NextResponse> {
  let degraded = degradedIn;
  const attemptId = String(body.attemptId ?? "");
  const questionId = question.id;
  const answer = typeof body.answer === "string" ? body.answer.slice(0, MAX_ANSWER_LEN) : "";
  if (!answer.trim()) return bad("invalid_request");
  // no self-marked correction: only the first try can be self-marked
  if (!(body.phase === undefined || body.phase === 1 || body.phase === "1")) return bad("phase_refused");

  const raw = (body.ticks && typeof body.ticks === "object" ? body.ticks : {}) as Record<string, unknown>;
  if (!(["a", "b", "c", "d"] as const).every((k) => typeof raw[k] === "boolean")) return bad("invalid_request");
  const ticks = { a: raw.a as boolean, b: raw.b as boolean, c: raw.c as boolean, d: raw.d as boolean };

  const part = paragraphPartOf(questionId);
  if (!part) return bad("not_found", 404);
  const partKey = partKeyOf(part.part);
  const verdicts = verdictsFromTicks(ticks);
  const mark = markOf(verdicts);

  if (!degraded) {
    try {
      const existing = await dbCall((db) => getResult(db, user.id, attemptId, questionId));
      if (existing) return json({ error: "already_answered", result: { marksAwarded: existing.marksAwarded } }, 409);
      // a marker-marked first try already exists: it cannot be replaced by a self-mark
      const row = await dbCall((db) => getParagraphPhase(db, user.id, attemptId, questionId));
      if (row) return bad("phase_refused");
    } catch (error) {
      if (!(error instanceof DbUnavailableError)) throw error;
      degraded = true;
    }
  }

  if (!degraded) {
    try {
      await dbCall((db) =>
        insertParagraphPhase(db, {
          attemptId, userId: user.id, unitId: token.unitId, questionId,
          status: "final", mode: "self_mark", ending: "self_mark",
          phase1Text: answer, phase1Mark: mark, phase1Verdicts: verdicts,
          phase1Feedback: null, phase1PromptVersion: null, phase1Model: null,
          recordedMark: mark,
        }),
      );
    } catch (error) {
      if (error instanceof DbUnavailableError) degraded = true;
      else if (error instanceof Error && error.name === "AttemptOwnerMismatchError") return bad("not_found", 404);
      else throw error;
    }
  }

  const fields: ResultFields = {
    questionId, answer, marks: mark, max: 4, gradedBy: "self", feedback: null, hits: null, misses: null,
    conceptOutcomes: conceptOutcomes(partKey, verdicts),
  };
  const attempt = attemptFieldsOf(token);
  const discussion = paragraphDiscussion(questionId) ?? undefined;

  if (degraded) {
    return json({ saved: false, degraded: true, attemptCompleted: null, marksAwarded: mark, recordedMark: mark, ending: "self_mark", discussion, receipt: buildReceipt(user.id, attemptId, attempt, fields) });
  }

  let outcome;
  try {
    outcome = await saveResult(user.id, attemptId, attempt, fields);
  } catch (error) {
    if (error instanceof Error && error.name === "AttemptOwnerMismatchError") return bad("not_found", 404);
    throw error;
  }
  if (outcome.status === "failed") {
    return json({ saved: false, degraded: false, attemptCompleted: null, marksAwarded: mark, recordedMark: mark, ending: "self_mark", discussion, receipt: buildReceipt(user.id, attemptId, attempt, fields) });
  }
  if (!outcome.inserted && outcome.stored) {
    return json({ error: "already_answered", result: { marksAwarded: outcome.stored.marksAwarded } }, 409);
  }
  await dbCall((db) => deleteRewriteDraft(db, user.id, attemptId, questionId)).catch(() => {});
  return json({ saved: true, marksAwarded: mark, recordedMark: mark, ending: "self_mark", attemptCompleted: outcome.completed, discussion });
}
