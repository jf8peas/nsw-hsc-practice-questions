import { NextResponse } from "next/server";

import { getQuestion } from "@/content";
import { resolveSession } from "@/lib/auth.server";
import { getConfig } from "@/lib/config.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { getRewritePhase, insertRewritePhase, finaliseRewritePhase } from "@/lib/db/queries/rewrite-phases.server";
import { clearRewriteDraft, deleteRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import { getResult } from "@/lib/db/queries/results.server";
import type { RewriteDisplayData, RewritePhaseRow, ResultRow } from "@/lib/db/schema";
import type { AlreadyAnswered, GradeResponse, RewriteGradeResult } from "@/lib/grading";
import {
  getOptionExplanation,
  gradeAnswer,
  gradeRewriteAnswer,
  rewriteDiscussionOrNull,
  rewriteTermConceptIds,
} from "@/lib/grading.server";
import { llmGradingConfigured } from "@/lib/openrouter.server";
import { checkIpRateLimit, checkUserRateLimit } from "@/lib/ratelimit.server";
import { buildReceipt, saveResult, type ResultFields } from "@/lib/results/save.server";
import { nextSydneyMidnight, toSydneyIso } from "@/lib/sydney";
import {
  attemptFieldsOf,
  hashAnswer,
  signSelfMarkToken,
  verifyAttemptToken,
  verifyTranscriptionToken,
} from "@/lib/tokens.server";
import type { RewriteQuestion } from "@/lib/types";
import { extractTranscription, TRANSCRIPTION_MARKER } from "@/lib/transcribe.server";
import { refundAiSlot, reserveAiSlot, type AiSlot } from "@/lib/usage.server";
import type { AttemptTokenPayload } from "@/lib/tokens.server";
import type { NewRewritePhaseRow } from "@/lib/db/schema";
import { logRewriteGrade } from "@/lib/rewrite-log.server";
import { handleParagraphGrade } from "@/lib/paragraph/grade-handler.server";

export const runtime = "nodejs";
/** A paragraph marking call can take 10 to 30 seconds (spec 007); the platform default is shorter. */
export const maxDuration = 60; // seconds

const MAX_ANSWER_LEN = 6000;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });

const bad = (error: string, status = 400) => json({ error }, status);

/** Refund a reserved AI slot. Best effort: a failure only costs the student one slot for the day. */
async function giveBack(slot: AiSlot): Promise<void> {
  try {
    await dbCall((db) => refundAiSlot(db, slot));
  } catch (error) {
    console.error("could not refund an AI slot", error);
  }
}

/** 409: this question already has a stored result; show that mark and move on. */
function alreadyAnswered(row: ResultRow, type: "mc" | "short" | "rewrite" | "paragraph"): NextResponse {
  const body: AlreadyAnswered = {
    error: "already_answered",
    result: {
      questionId: row.questionId,
      type,
      maxMarks: row.maxMarks,
      marksAwarded: row.marksAwarded,
      feedback: row.feedback ?? undefined,
      rubricHits: row.rubricHits ?? undefined,
      rubricMisses: row.rubricMisses ?? undefined,
      // recomputed from the stored option text, never stored (spec 002 FR-041)
      optionExplanation:
        type === "mc" && row.marksAwarded === 0 ? getOptionExplanation(row.questionId, row.answer) : undefined,
      needsSelfMark: false,
    },
  };
  return json(body, 409);
}

/**
 * Grade one answer and save it (specs/001-student-saved-scores/contracts/api.md).
 *
 * Degraded-capable (research R19): when the database cannot be reached the
 * answer is still marked from the signed attempt token alone — MC is graded and
 * returned with a receipt to save later; a short answer falls back to
 * self-marking and never touches the daily AI cap.
 */
export async function POST(req: Request) {
  const session = await resolveSession();
  if (session.kind === "none") return bad("unauthenticated", 401);
  const user = session.user;
  let degraded = session.kind === "unverified";

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("invalid_request");
  }
  const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  const answer = typeof body.answer === "string" ? body.answer.slice(0, MAX_ANSWER_LEN) : "";
  const transcriptionToken =
    typeof body.transcriptionToken === "string" ? body.transcriptionToken : undefined;
  if (!attemptId || !questionId || typeof body.attemptToken !== "string") {
    return bad("invalid_request");
  }

  // The signed attempt token proves who the attempt belongs to, which questions
  // it contains and the MC option order. Nothing else from the client is trusted.
  const verified = verifyAttemptToken(body.attemptToken, { uid: user.id, attemptId });
  if (!verified.ok) return bad("invalid_attempt_token");
  const token = verified.payload;
  if (!token.questionIds.includes(questionId)) return bad("not_found", 404);

  const found = getQuestion(questionId);
  if (!found) return bad("not_found", 404);
  const { question } = found;

  if (question.type === "mc") {
    const index = /^\d+$/.test(answer) ? Number(answer) : -1;
    if (index < 0 || index >= question.options.length) return bad("invalid_request");
  }

  // Spec 007: paragraph parts run their own two-phase flow.
  if (question.type === "paragraph") {
    return handleParagraphGrade(req, user, body, token, question, degraded);
  }

  // Spec 005: rewrite questions run their own two-phase flow.
  if (question.type === "rewrite") {
    return handleRewriteGrade(req, user, body, token, question, degraded);
  }

  // Photo answer: verify the transcription token (signature, expiry, binding to
  // this student, attempt and question). The slot was already reserved by
  // /api/transcribe, so no second slot is reserved here. When the answer still
  // starts with <<<TRANSCRIPTION>>> the transcription portion must hash to the
  // token's transcriptionHash; when the student switched to Type after a read
  // the answer is graded as typed text and the carried slot is simply spent.
  let handwritten = false;
  if (transcriptionToken) {
    const verifiedTx = verifyTranscriptionToken(transcriptionToken, {
      uid: user.id,
      attemptId,
      questionId,
    });
    if (!verifiedTx.ok) return bad("invalid_request");
    if (answer.startsWith(TRANSCRIPTION_MARKER)) {
      const transcription = extractTranscription(answer);
      if (transcription === null) return bad("invalid_request");
      if (hashAnswer(transcription) !== verifiedTx.payload.transcriptionHash) {
        return bad("invalid_request");
      }
      handwritten = true;
    }
  }

  // Already answered? (skipped when the database cannot be read: duplicates are
  // then prevented at save time by UNIQUE(attempt_id, question_id).)
  if (!degraded) {
    try {
      const existing = await dbCall((db) => getResult(db, user.id, attemptId, questionId));
      if (existing) return alreadyAnswered(existing, question.type);
    } catch (error) {
      if (!(error instanceof DbUnavailableError)) throw error;
      degraded = true;
    }
  }

  // Only a request that would spend LLM credits is rate limited and counted against the
  // daily allowance. MC and empty answers are never limited or counted (Principle VI).
  let skipLlm = degraded;
  let aiLimit: GradeResponse["aiLimit"];
  let slot: AiSlot | null = null;
  const cap = getConfig().llmDailyCap;
  // A photo answer carries its reserved slot in the transcription token: never
  // reserve a second one here (FR-020).
  if (question.type === "short" && answer.trim() !== "" && !degraded && !transcriptionToken) {
    if (!llmGradingConfigured() || cap === 0) {
      skipLlm = true; // AI marking is off: the student self-marks, nothing to count
    } else {
      // validate -> per-user limit -> per-IP backstop -> reserve a daily slot -> LLM
      const perUser = await checkUserRateLimit(user.id);
      const perIp = perUser.ok ? await checkIpRateLimit(clientIp(req)) : perUser;
      if (!perIp.ok) {
        return json(
          { error: "rate_limited", retryAfter: perIp.retryAfter },
          429,
          perIp.retryAfter ? { "retry-after": String(perIp.retryAfter) } : undefined,
        );
      }
      try {
        slot = await dbCall((db) => reserveAiSlot(db, user.id, cap));
        if (!slot) {
          // Over today's allowance: self-mark, and say when AI marking returns.
          skipLlm = true;
          aiLimit = { reached: true, resetsAt: toSydneyIso(nextSydneyMidnight(new Date())) };
        }
      } catch (error) {
        if (!(error instanceof DbUnavailableError)) throw error;
        degraded = true; // the allowance cannot be checked, so no LLM call
        skipLlm = true;
      }
    }
  }

  let graded;
  try {
    graded = await gradeAnswer(questionId, answer, {
      optionOrder: token.mcOptionOrder[questionId],
      skipLlm,
      handwritten,
    });
  } catch (error) {
    if (slot) await giveBack(slot); // never keep a slot for an answer that was not marked
    throw error;
  }
  if (!graded) {
    if (slot) await giveBack(slot);
    return bad("not_found", 404);
  }
  // The LLM failed or fell back to self-marking: that does not count against the allowance.
  if (slot && graded.result.needsSelfMark) await giveBack(slot);
  const { result } = graded;

  // The grader could not mark it: the student self-marks (POST /api/results/self-mark).
  if (result.needsSelfMark) {
    const response: GradeResponse = {
      result,
      saved: false,
      degraded,
      attemptCompleted: degraded ? null : false,
      selfMarkToken: signSelfMarkToken({ uid: user.id, attemptId, questionId, answer }),
      ...(degraded ? { aiUnavailable: true } : {}),
      ...(aiLimit ? { aiLimit } : {}),
    };
    return json(response);
  }

  const isLlm = graded.gradedBy === "llm";
  const fields: ResultFields = {
    questionId,
    answer: graded.answerText,
    marks: result.marksAwarded ?? 0,
    max: result.maxMarks,
    gradedBy: graded.gradedBy,
    feedback: isLlm ? (result.feedback ?? null) : null,
    hits: isLlm ? (result.rubricHits ?? null) : null,
    misses: isLlm ? (result.rubricMisses ?? null) : null,
  };
  const attempt = attemptFieldsOf(token);

  if (degraded) {
    const response: GradeResponse = {
      result,
      saved: false,
      degraded: true,
      attemptCompleted: null,
      receipt: buildReceipt(user.id, attemptId, attempt, fields),
    };
    return json(response);
  }

  let outcome;
  try {
    outcome = await saveResult(user.id, attemptId, attempt, fields);
  } catch (error) {
    if (error instanceof Error && error.name === "AttemptOwnerMismatchError") {
      return bad("not_found", 404);
    }
    throw error;
  }

  // Saving failed or timed out: the student still gets their mark, plus a receipt to retry with.
  if (outcome.status === "failed") {
    const response: GradeResponse = {
      result,
      saved: false,
      degraded: false,
      attemptCompleted: null,
      receipt: buildReceipt(user.id, attemptId, attempt, fields),
    };
    return json(response);
  }

  // Lost a race with a simultaneous request for the same question: show the stored mark.
  if (!outcome.inserted && outcome.stored) return alreadyAnswered(outcome.stored, question.type);

  const response: GradeResponse = {
    result,
    saved: true,
    degraded: false,
    attemptCompleted: outcome.completed,
  };
  return json(response);
}

// ---- rewrite questions (spec 005) ---------------------------------------------

/** The credited spans of one phase from the stored display data, or undefined when none. */
function spansFromMap(map: Record<string, string> | undefined): Array<{ conceptId: string; span: string }> | undefined {
  if (!map) return undefined;
  const spans = Object.entries(map).map(([conceptId, span]) => ({ conceptId, span }));
  return spans.length > 0 ? spans : undefined;
}

/** The phase-appropriate display data for a stored phase row (spec 006 FR-053). */
function displayDataFromResult(result: RewriteGradeResult, phase: 1 | 2, prior?: RewriteDisplayData | null): RewriteDisplayData {
  const spanByTerm: Record<string, string> = {};
  for (const s of result.creditedSpans ?? []) spanByTerm[s.conceptId] = s.span;
  if (phase === 1) {
    return {
      phase1: { spanByTerm },
      ...(result.languageNote ? { languageNote: result.languageNote } : {}),
    };
  }
  return {
    phase1: prior?.phase1 ?? { spanByTerm: {} },
    phase2: { spanByTerm },
    phase2TermOutcomes: result.phase2TermOutcomes ?? [],
    ...(result.languageNote ? { languageNote: result.languageNote } : {}),
  };
}

/** A minimal rewrite result for a `409 already_answered` (a double tap or a second device). */
function rewriteResultFromRow(row: RewritePhaseRow) {
  const phase: 1 | 2 = row.phase2Marks !== null && row.phase2Marks !== undefined ? 2 : 1;
  const spans = spansFromMap(phase === 2 ? row.displayData?.phase2?.spanByTerm : row.displayData?.phase1?.spanByTerm);
  return {
    questionId: row.questionId,
    type: "rewrite" as const,
    maxMarks: 3,
    phase,
    marksAwarded: row.recordedMark ?? row.phase1Marks,
    feedback: phase === 2 ? (row.phase2Feedback ?? row.phase1Feedback) ?? "" : (row.phase1Feedback ?? ""),
    termOutcomes: row.phase1TermOutcomes ?? [],
    ...(spans ? { creditedSpans: spans } : {}),
    ...(phase === 2 && row.displayData?.phase2TermOutcomes
      ? { phase2TermOutcomes: row.displayData.phase2TermOutcomes }
      : {}),
    ...(row.displayData?.languageNote ? { languageNote: row.displayData.languageNote } : {}),
    needsSelfMark: false,
  };
}

/**
 * The two-phase grade flow for a rewrite question (spec 005). Phase 1 grades the first
 * rewrite (0-3); a 3/3 finalises straight to the discussion, below 3 the student gets a
 * hinted retry (phase 2) capped at 2 marks. The recorded mark is the best of the two
 * (FR-019). All phase state lives in `rewrite_phases`; a `results` row is created only
 * when the question is final, so history and averages never count a pending phase. The
 * retry is compulsory (FR-042): a `skip: true` request is refused before anything else.
 */
async function handleRewriteGrade(
  req: Request,
  user: { id: string },
  body: Record<string, unknown>,
  token: AttemptTokenPayload,
  question: RewriteQuestion,
  degraded: boolean,
): Promise<NextResponse> {
  const attemptId = String(body.attemptId ?? "");
  const questionId = question.id;
  const answer = typeof body.answer === "string" ? body.answer.slice(0, MAX_ANSWER_LEN) : "";
  // the client sends a number; accept the string form too
  const phase: 1 | 2 = body.phase === 2 || body.phase === "2" ? 2 : 1;

  // FR-042: phase 2 cannot be skipped. Refuse before any grader call, slot or database write.
  if (body.skip === true) return bad("invalid_request");

  // FR-041: empty or whitespace-only rewrites are refused in both phases.
  if (!answer.trim()) return bad("invalid_request");

  const termConceptIds = rewriteTermConceptIds(questionId);
  const durations = { start: Date.now() };

  // The phase row decides what may happen next (FR-023, FR-017, FR-042, FR-029).
  let phaseRow: RewritePhaseRow | null = null;
  if (!degraded) {
    try {
      phaseRow = await dbCall((db) => getRewritePhase(db, user.id, attemptId, questionId));
    } catch (error) {
      if (!(error instanceof DbUnavailableError)) throw error;
      degraded = true;
    }
  }

  if (phase === 2) {
    if (degraded) {
      logRewriteGrade({ outcome: "db_unavailable", userId: user.id, questionId, durationMs: Date.now() - durations.start });
      return json({ error: "temporarily_unavailable" }, 503);
    }
    if (phaseRow?.status === "final") {
      logRewriteGrade({ outcome: "already_answered", userId: user.id, questionId, durationMs: Date.now() - durations.start });
      return json({ error: "already_answered", result: rewriteResultFromRow(phaseRow) }, 409);
    }
    if (!phaseRow || phaseRow.status !== "phase1" || phaseRow.phase1Marks >= 3) {
      logRewriteGrade({ outcome: "phase_refused", userId: user.id, questionId, durationMs: Date.now() - durations.start });
      return bad("phase_refused");
    }
  } else if (phaseRow) {
    // phase 1 already graded: a double tap or a second device — no second slot (FR-029).
    logRewriteGrade({ outcome: "already_answered", userId: user.id, questionId, durationMs: Date.now() - durations.start });
    return json({ error: "already_answered", result: rewriteResultFromRow(phaseRow) }, 409);
  }

  // Rate limit and one daily-allowance slot per phase (FR-029), like short answers.
  let skipLlm = degraded || !llmGradingConfigured() || getConfig().llmDailyCap === 0;
  let aiLimit: GradeResponse["aiLimit"];
  let slot: AiSlot | null = null;
  if (!skipLlm) {
    const perUser = await checkUserRateLimit(user.id);
    const perIp = perUser.ok ? await checkIpRateLimit(clientIp(req)) : perUser;
    if (!perIp.ok) {
      logRewriteGrade({ outcome: "rate_limited", userId: user.id, questionId, durationMs: Date.now() - durations.start });
      return json(
        { error: "rate_limited", retryAfter: perIp.retryAfter },
        429,
        perIp.retryAfter ? { "retry-after": String(perIp.retryAfter) } : undefined,
      );
    }
    try {
      slot = await dbCall((db) => reserveAiSlot(db, user.id, getConfig().llmDailyCap));
      if (!slot) {
        skipLlm = true;
        aiLimit = { reached: true, resetsAt: toSydneyIso(nextSydneyMidnight(new Date())) };
      }
    } catch (error) {
      if (!(error instanceof DbUnavailableError)) throw error;
      degraded = true;
      skipLlm = true;
    }
  }

  const t0 = Date.now();
  let graded;
  try {
    graded = await gradeRewriteAnswer(questionId, answer, phase, { skipLlm });
  } catch (error) {
    if (slot) await giveBack(slot);
    throw error;
  }
  if (!graded) {
    if (slot) await giveBack(slot);
    return bad("not_found", 404);
  }
  logRewriteGrade({
    outcome: graded.result.needsSelfMark ? "model_fail" : graded.result.feedback ? "graded" : "graded",
    userId: user.id,
    questionId,
    durationMs: Date.now() - t0,
  });
  // The AI marker failed or fell back: that does not count against the allowance.
  if (slot && graded.result.needsSelfMark) await giveBack(slot);
  const { result } = graded;

  // Degrade path (FR-030): no phase 2; the self-mark screen shows the model sentence and every
  // term's definition, and the token binds the answer and the term ids (FR-046).
  if (result.needsSelfMark) {
    const response: GradeResponse = {
      result: { ...result, discussion: rewriteDiscussionOrNull(questionId) },
      saved: false,
      degraded,
      attemptCompleted: degraded ? null : false,
      selfMarkToken: signSelfMarkToken({ uid: user.id, attemptId, questionId, answer, termConceptIds }),
      ...(degraded ? { aiUnavailable: true } : {}),
      ...(aiLimit ? { aiLimit } : {}),
    };
    return json(response);
  }

  // The recorded mark: phase 1 at 3, otherwise the best of phase 1 and the capped phase 2
  // (FR-019). The retry is compulsory, so there is no skip case (FR-042).
  const recorded =
    phase === 1 ? (result.marksAwarded ?? 0) : Math.max(phaseRow?.phase1Marks ?? 0, result.marksAwarded ?? 0);

  const fields: ResultFields = {
    questionId,
    answer,
    marks: recorded,
    max: 3,
    gradedBy: "llm",
    feedback: result.feedback ?? null,
    hits: null,
    misses: null,
    // spec 005 FR-033: concept outcomes come from phase 1 only — the phase 1 grade's
    // outcomes (a phase 2 grade or a skip must never overwrite them with phase 2's).
    conceptOutcomes: phase === 1 ? result.termOutcomes : (phaseRow?.phase1TermOutcomes ?? result.termOutcomes),
  };
  const attempt = attemptFieldsOf(token);

  if (phase === 1 && (result.marksAwarded ?? 0) < 3) {
    // Phase 1 under 3: store the phase row (the hint drives phase 2), no result yet.
    const row: NewRewritePhaseRow = {
      attemptId,
      userId: user.id,
      unitId: token.unitId,
      questionId,
      status: "phase1",
      phase1Answer: answer,
      phase1Marks: result.marksAwarded ?? 0,
      phase1Feedback: result.feedback ?? null,
      phase1TermOutcomes: result.termOutcomes,
      displayData: displayDataFromResult(result, 1),
    };
    if (degraded) return json({ result, saved: false, degraded: true, attemptCompleted: null });
    try {
      const outcome = await dbCall((db) => insertRewritePhase(db, row));
      if (!outcome.inserted) {
        const existing = await dbCall((db) => getRewritePhase(db, user.id, attemptId, questionId));
        if (existing) return json({ error: "already_answered", result: rewriteResultFromRow(existing) }, 409);
      }
      // the submitted sentence is now stored as phase1_answer; the draft is no longer needed
      await dbCall((db) => clearRewriteDraft(db, user.id, attemptId, questionId, 1)).catch(() => {});
    } catch (error) {
      if (error instanceof Error && error.name === "AttemptOwnerMismatchError") return bad("not_found", 404);
      throw error;
    }
    return json({ result, saved: false, phaseSaved: true, attemptCompleted: false });
  }

  // The question is final: create or update the phase row, then save the result.
  if (phase === 1) {
    // 3/3 phase 1: insert the phase row as final (FR-014) — no phase 2.
    if (!degraded) {
      try {
        const outcome = await dbCall((db) =>
          insertRewritePhase(db, {
            attemptId,
            userId: user.id,
            unitId: token.unitId,
            questionId,
            status: "final",
            phase1Answer: answer,
            phase1Marks: 3,
            phase1Feedback: result.feedback ?? null,
            phase1TermOutcomes: result.termOutcomes,
            recordedMark: 3,
            displayData: displayDataFromResult(result, 1),
          }),
        );
        if (!outcome.inserted) {
          const existing = await dbCall((db) => getRewritePhase(db, user.id, attemptId, questionId));
          if (existing) return json({ error: "already_answered", result: rewriteResultFromRow(existing) }, 409);
        }
        // the question is final: the draft row is no longer needed (research R5.2, Principle II)
        await dbCall((db) => deleteRewriteDraft(db, user.id, attemptId, questionId)).catch(() => {});
      } catch (error) {
        if (error instanceof Error && error.name === "AttemptOwnerMismatchError") return bad("not_found", 404);
        throw error;
      }
    }
  } else {
    const outcome = await dbCall((db) =>
      finaliseRewritePhase(db, user.id, attemptId, questionId, {
        phase2Answer: answer,
        phase2Marks: result.marksAwarded ?? 0,
        phase2Feedback: result.feedback ?? null,
        recordedMark: recorded,
        displayData: displayDataFromResult(result, 2, phaseRow?.displayData),
      }),
    );
    if (!outcome) return json({ error: "already_answered", result: rewriteResultFromRow(phaseRow!) }, 409);
    // the question is final: the draft row is no longer needed (research R5.2, Principle II)
    await dbCall((db) => deleteRewriteDraft(db, user.id, attemptId, questionId)).catch(() => {});
  }

  if (degraded) {
    const receipt = buildReceipt(user.id, attemptId, attempt, { ...fields, marks: recorded });
    return json({ result, saved: false, degraded: true, attemptCompleted: null, receipt });
  }

  const save = await saveResult(user.id, attemptId, attempt, { ...fields, marks: recorded, feedback: result.feedback ?? null });
  if (save.status === "failed") {
    return json({ result, saved: false, degraded: false, attemptCompleted: null, receipt: buildReceipt(user.id, attemptId, attempt, { ...fields, marks: recorded }) });
  }
  if (!save.inserted && save.stored) {
    const existingRow = await dbCall((db) => getRewritePhase(db, user.id, attemptId, questionId)).catch(() => phaseRow);
    return json({ error: "already_answered", result: rewriteResultFromRow(existingRow ?? phaseRow!) }, 409);
  }
  return json({ result, saved: true, attemptCompleted: save.completed });
}
