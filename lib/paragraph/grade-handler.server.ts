import "server-only";

import { NextResponse } from "next/server";

import { getConfig } from "@/lib/config.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { deleteRewriteDraft, clearRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import {
  finaliseParagraphPhase,
  getParagraphPhase,
  insertParagraphPhase,
} from "@/lib/db/queries/paragraph-phases.server";
import type { ParagraphPhaseRow, ParagraphVerdicts } from "@/lib/db/schema";
import { markParagraph, paragraphDiscussion, paragraphPartOf } from "@/lib/grading.server";
import { llmGradingConfigured } from "@/lib/openrouter.server";
import { logParagraph, type ParagraphOutcome } from "@/lib/paragraph/log.server";
import { partKeyOf } from "@/lib/paragraph/parts";
import { conceptOutcomes, recordedMark } from "@/lib/paragraph/scoring";
import { criteriaOf, phaseView } from "@/lib/paragraph/state.server";
import type { ParagraphGradeResult } from "@/lib/paragraph/types";
import { checkIpRateLimit, checkUserRateLimit } from "@/lib/ratelimit.server";
import { buildReceipt, saveResult, type ResultFields } from "@/lib/results/save.server";
import { nextSydneyMidnight, toSydneyIso } from "@/lib/sydney";
import { attemptFieldsOf, signSelfMarkToken, type AttemptTokenPayload } from "@/lib/tokens.server";
import type { ParagraphQuestion } from "@/lib/types";
import { refundAiSlot, reserveAiSlot, type AiSlot } from "@/lib/usage.server";
import { countWords } from "@/lib/wordcount";

// The two-phase grade flow for a paragraph question (spec 007), called from POST /api/grade.
// Phase 1 marks the first try: 4/4 goes straight to the final state; under 4 the phase row waits
// for ONE correction (phase 2), capped at 3, with the recorded mark the higher of the two. A
// correction that cannot be marked (cap used up, marker unavailable) ends the question with the
// first-try mark, no error (FR-019a). At phase 1 an unavailable marker or the cap falls back to
// self-marking (the model part is released with the self-mark token). At most two slots of
// LLM_DAILY_CAP per quiz, enforced by the phase row, never by the client.

const MAX_ANSWER_LEN = 6000;

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });
const bad = (error: string, status = 400) => json({ error }, status);

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

async function giveBack(slot: AiSlot): Promise<void> {
  try {
    await dbCall((db) => refundAiSlot(db, slot));
  } catch (error) {
    console.error("could not refund an AI slot", error);
  }
}

/** The result for a stored row, used for a `409 already_answered` (a double tap or a second device). */
export function resultFromRow(row: ParagraphPhaseRow): ParagraphGradeResult {
  const base = { questionId: row.questionId, type: "paragraph" as const, maxMarks: 4 as const, needsSelfMark: false };
  const p1 = phaseView(row.phase1Text, row.phase1Mark, row.phase1Verdicts, row.phase1Feedback);
  if (row.status === "phase1") {
    return { ...base, phase: 1, marksAwarded: row.phase1Mark, criteria: p1.criteria, feedback: p1.feedback, wordCount: p1.wordCount };
  }
  const discussion = paragraphDiscussion(row.questionId) ?? undefined;
  const ending = row.ending as ParagraphGradeResult["ending"];
  if (ending === "corrected" && row.phase2Text && row.phase2Verdicts && row.phase2Mark !== null) {
    const p2 = phaseView(row.phase2Text, row.phase2Mark, row.phase2Verdicts, row.phase2Feedback);
    return { ...base, phase: 2, marksAwarded: p2.mark, recordedMark: row.recordedMark ?? undefined, criteria: p2.criteria, feedback: p2.feedback, wordCount: p2.wordCount, ending, phase1: p1, discussion };
  }
  if (ending === "no_correction") {
    return { ...base, phase: 2, marksAwarded: null, recordedMark: row.recordedMark ?? undefined, criteria: p1.criteria, feedback: p1.feedback, wordCount: p1.wordCount, ending, phase1: p1, discussion };
  }
  return { ...base, phase: 1, marksAwarded: row.phase1Mark, recordedMark: row.recordedMark ?? undefined, criteria: p1.criteria, feedback: p1.feedback, wordCount: p1.wordCount, ending, discussion };
}

export async function handleParagraphGrade(
  req: Request,
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
  const phaseRaw = body.phase;
  const phase: 1 | 2 | null =
    phaseRaw === undefined || phaseRaw === 1 || phaseRaw === "1" ? 1 : phaseRaw === 2 || phaseRaw === "2" ? 2 : null;
  const start = Date.now();
  const log = (outcome: ParagraphOutcome, p: 1 | 2 | undefined, model?: string) =>
    logParagraph({ outcome, userId: user.id, questionId, phase: p, durationMs: Date.now() - start, model });

  if (phase === null) return bad("invalid_phase");
  // the correction cannot be skipped (FR-015): refuse before any marker call, slot or write
  if (body.skip === true) return bad("invalid_request");
  if (!answer.trim()) return bad("invalid_request");

  // The phase row decides what may happen next.
  let row: ParagraphPhaseRow | null = null;
  if (!degraded) {
    try {
      row = await dbCall((db) => getParagraphPhase(db, user.id, attemptId, questionId));
    } catch (error) {
      if (!(error instanceof DbUnavailableError)) throw error;
      degraded = true;
    }
  }
  if (phase === 2) {
    if (degraded) {
      log("db_unavailable", 2);
      return bad("temporarily_unavailable", 503);
    }
    if (row?.status === "final") {
      log("already_answered", 2);
      return json({ error: "already_answered", result: resultFromRow(row) }, 409);
    }
    if (!row || row.status !== "phase1") {
      log("phase_refused", 2);
      return bad("phase_refused");
    }
  } else if (row) {
    log("already_answered", 1);
    return json({ error: "already_answered", result: resultFromRow(row) }, 409);
  }

  // Rate limits and one daily-allowance slot per phase.
  let skipLlm = degraded || !llmGradingConfigured() || getConfig().llmDailyCap === 0;
  let aiLimit: { reached: true; resetsAt: string } | undefined;
  let slot: AiSlot | null = null;
  if (!skipLlm) {
    const perUser = await checkUserRateLimit(user.id);
    const perIp = perUser.ok ? await checkIpRateLimit(clientIp(req)) : perUser;
    if (!perIp.ok) {
      log("rate_limited", phase);
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
        log("over_allowance", phase);
      }
    } catch (error) {
      if (!(error instanceof DbUnavailableError)) throw error;
      degraded = true;
      skipLlm = true;
    }
  }

  const t0 = Date.now();
  let marked;
  try {
    marked = await markParagraph(questionId, answer, phase, { skipLlm });
  } catch (error) {
    if (slot) await giveBack(slot);
    throw error;
  }
  if (slot && !marked) await giveBack(slot); // the marker failed: that does not count against the allowance
  if (!skipLlm) logParagraph({ outcome: marked ? "graded" : "model_fail", userId: user.id, questionId, phase, durationMs: Date.now() - t0, model: marked?.model });

  const part = paragraphPartOf(questionId);
  if (!part) return bad("not_found", 404);
  const partKey = partKeyOf(part.part);
  const attempt = attemptFieldsOf(token);
  const wordCount = countWords(answer);

  // ---- the marker could not mark ------------------------------------------------------------
  if (!marked) {
    if (phase === 1) {
      // self-mark: the model part is released so the student can mark themselves (FR-033)
      const response = {
        result: {
          questionId, type: "paragraph" as const, maxMarks: 4 as const, phase: 1 as const,
          marksAwarded: null, feedback: "", wordCount, needsSelfMark: true,
          discussion: paragraphDiscussion(questionId) ?? undefined,
        } satisfies ParagraphGradeResult,
        saved: false,
        degraded,
        attemptCompleted: degraded ? null : false,
        selfMarkToken: signSelfMarkToken({ uid: user.id, attemptId, questionId, answer }),
        ...(degraded ? { aiUnavailable: true } : {}),
        ...(aiLimit ? { aiLimit } : {}),
      };
      return json(response);
    }
    // FR-019a: keep the first-try mark, go to the discussion, no error, never self-mark a correction
    const ended = await finalise(user.id, attemptId, questionId, row!, { ending: "no_correction", recordedMark: row!.phase1Mark });
    if (!ended) return json({ error: "already_answered", result: resultFromRow(row!) }, 409);
    await dbCall((db) => deleteRewriteDraft(db, user.id, attemptId, questionId)).catch(() => {});
    const result = resultFromRow(ended);
    return saveAndRespond({
      userId: user.id, attemptId, attempt, result, questionId,
      fields: fieldsFor({ questionId, answer: row!.phase1Text, mark: row!.phase1Mark, feedback: row!.phase1Feedback, verdicts: row!.phase1Verdicts, partKey }),
      row: ended, extra: aiLimit ? { aiLimit } : {},
    });
  }

  // ---- marked --------------------------------------------------------------------------------
  if (phase === 1) {
    const full = marked.mark === 4;
    try {
      const inserted = await dbCall((db) =>
        insertParagraphPhase(db, {
          attemptId, userId: user.id, unitId: token.unitId, questionId,
          status: full ? "final" : "phase1",
          mode: "marker",
          ...(full ? { ending: "full_marks", recordedMark: 4 } : {}),
          phase1Text: answer, phase1Mark: marked.mark, phase1Verdicts: marked.verdicts,
          phase1Feedback: marked.feedback, phase1PromptVersion: marked.promptVersion, phase1Model: marked.model,
        }),
      );
      if (!inserted.inserted) {
        const existing = await dbCall((db) => getParagraphPhase(db, user.id, attemptId, questionId));
        if (existing) return json({ error: "already_answered", result: resultFromRow(existing) }, 409);
      }
    } catch (error) {
      if (error instanceof DbUnavailableError) return bad("temporarily_unavailable", 503);
      if (error instanceof Error && error.name === "AttemptOwnerMismatchError") return bad("not_found", 404);
      throw error;
    }
    if (!full) {
      await dbCall((db) => clearRewriteDraft(db, user.id, attemptId, questionId, 1)).catch(() => {});
      const result: ParagraphGradeResult = {
        questionId, type: "paragraph", maxMarks: 4, phase: 1, marksAwarded: marked.mark,
        criteria: criteriaOf(marked.verdicts), feedback: marked.feedback, wordCount: marked.wordCount, needsSelfMark: false,
      };
      return json({ result, saved: false, phaseSaved: true, attemptCompleted: false, ...(aiLimit ? { aiLimit } : {}) });
    }
    await dbCall((db) => deleteRewriteDraft(db, user.id, attemptId, questionId)).catch(() => {});
    const result: ParagraphGradeResult = {
      questionId, type: "paragraph", maxMarks: 4, phase: 1, marksAwarded: 4, recordedMark: 4, ending: "full_marks",
      criteria: criteriaOf(marked.verdicts), feedback: marked.feedback, wordCount: marked.wordCount, needsSelfMark: false,
      discussion: paragraphDiscussion(questionId) ?? undefined,
    };
    return saveAndRespond({
      userId: user.id, attemptId, attempt, result, questionId,
      fields: fieldsFor({ questionId, answer, mark: 4, feedback: marked.feedback, verdicts: marked.verdicts, partKey }),
      row: null, extra: {},
    });
  }

  // phase 2, marked: the correction is capped at 3 (already applied) and the recorded mark is the higher try
  const recorded = recordedMark(row!.phase1Mark, marked.mark);
  const ended = await finalise(user.id, attemptId, questionId, row!, {
    ending: "corrected",
    recordedMark: recorded,
    phase2: { text: answer, mark: marked.mark, verdicts: marked.verdicts, feedback: marked.feedback, promptVersion: marked.promptVersion, model: marked.model },
  });
  if (!ended) return json({ error: "already_answered", result: resultFromRow(row!) }, 409);
  await dbCall((db) => deleteRewriteDraft(db, user.id, attemptId, questionId)).catch(() => {});
  const result = resultFromRow(ended);
  const deciding = marked.mark >= row!.phase1Mark ? marked.feedback : row!.phase1Feedback;
  return saveAndRespond({
    userId: user.id, attemptId, attempt, result, questionId,
    fields: { ...fieldsFor({ questionId, answer, mark: recorded, feedback: deciding, verdicts: row!.phase1Verdicts, partKey }) },
    row: ended, extra: {},
  });
}

async function finalise(
  userId: string,
  attemptId: string,
  questionId: string,
  _row: ParagraphPhaseRow,
  input: Parameters<typeof finaliseParagraphPhase>[4],
): Promise<ParagraphPhaseRow | null> {
  return dbCall((db) => finaliseParagraphPhase(db, userId, attemptId, questionId, input));
}

/** The result row's fields. Concept outcomes come from PHASE 1 only (spec 005 FR-033, spec 007 FR-027). */
function fieldsFor(i: {
  questionId: string;
  answer: string;
  mark: number;
  feedback: string | null;
  verdicts: ParagraphVerdicts;
  partKey: ReturnType<typeof partKeyOf>;
}): ResultFields {
  return {
    questionId: i.questionId,
    answer: i.answer,
    marks: i.mark,
    max: 4,
    gradedBy: "llm",
    feedback: i.feedback,
    hits: null,
    misses: null,
    conceptOutcomes: conceptOutcomes(i.partKey, i.verdicts),
  };
}

async function saveAndRespond(i: {
  userId: string;
  attemptId: string;
  attempt: ReturnType<typeof attemptFieldsOf>;
  result: ParagraphGradeResult;
  questionId: string;
  fields: ResultFields;
  row: ParagraphPhaseRow | null;
  extra: Record<string, unknown>;
}): Promise<NextResponse> {
  let save;
  try {
    save = await saveResult(i.userId, i.attemptId, i.attempt, i.fields);
  } catch (error) {
    if (error instanceof Error && error.name === "AttemptOwnerMismatchError") return bad("not_found", 404);
    throw error;
  }
  if (save.status === "failed") {
    return json({ result: i.result, saved: false, degraded: false, attemptCompleted: null, receipt: buildReceipt(i.userId, i.attemptId, i.attempt, i.fields), ...i.extra });
  }
  return json({ result: i.result, saved: true, attemptCompleted: save.completed, ...i.extra });
}

