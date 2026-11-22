// Client helper: start a new attempt (POST /api/attempts) and keep the response
// in sessionStorage so the quiz can run even when the database is down
// (research R19: an attempt started during an outage has `persisted: false`).

import { saveAttemptPayload } from "@/lib/drafts";
import type { EssayBar, ParagraphState } from "@/lib/paragraph/types";
import type { ComparativeState } from "@/lib/comparative/types";
import { COMPARATIVE_UNIT_ID, UNIT_ID as UNSEEN_UNIT_ID } from "@/lib/unseen/skills";
import type { UnseenState } from "@/lib/unseen/types";
import type { Question } from "@/lib/types";

export type StartResult =
  | { ok: true; attemptId: string; persisted: boolean }
  | { ok: false; error: string; unauthenticated?: boolean; finished?: boolean; openEssay?: string };

interface StartResponse {
  attemptId: string;
  attemptToken: string;
  persisted: boolean;
  unitId: string;
  passMark: number;
  questions: Question[];
  answered: Record<string, { marks: number; max: number }>;
  /** spec 007: the essay bar and the question state, for a sequential unit. */
  essay?: EssayBar;
  paragraphState?: ParagraphState;
  /** spec 008: the question state for an unseen-text unit. */
  unseenState?: UnseenState;
  /** spec 009: the question state for a comparative attempt. */
  comparativeState?: ComparativeState;
  /** spec 010: the stage and state of an essay attempt. */
  essayState?: import("@/lib/essay/types").EssayState;
}

/** The notices a sequential or progress-dependent unit shows when it cannot start a quiz (constitution Principle VI). */
function unitNotices(unitId: string): { unavailable: string; finished: string } {
  if (unitId === "y12-economics-essay-writing") {
    return {
      unavailable: "We can't load your essays right now. Try again in a moment.",
      finished: "You've finished every essay so far. New essays are added as they're checked.",
    };
  }
  if (unitId === UNSEEN_UNIT_ID || unitId === COMPARATIVE_UNIT_ID) {
    return {
      unavailable: "We can't load your questions right now. Try again in a moment.",
      finished: "You've answered every question in the bank so far. New questions are added as the papers are processed.",
    };
  }
  return {
    unavailable: "We can't load your place in the essay right now. Try again in a moment.",
    finished: "You've finished every essay so far. New essays are added as they're written.",
  };
}

/** Start (or resume) an attempt. The essay-writing unit (spec 010) also takes the essay the student picked. */
export async function startAttempt(unitId: string, questionId?: string): Promise<StartResult> {
  let res: Response;
  try {
    res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(questionId === undefined ? { unitId } : { unitId, questionId }),
    });
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
  if (res.status === 401) {
    return { ok: false, error: "Your session has ended. Sign in to continue.", unauthenticated: true };
  }
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    const wait = typeof body.retryAfter === "number" ? ` Try again in about ${body.retryAfter}s.` : "";
    return { ok: false, error: `You're starting quizzes too fast.${wait}` };
  }
  if (res.status === 409) {
    // spec 010: another essay is already open; the student is sent to it (never a second attempt)
    const body = await res.json().catch(() => ({}));
    if (body?.error === "attempt_open") {
      return { ok: false, error: "Finish or discard your open essay before starting another.", openEssay: typeof body.questionId === "string" ? body.questionId : undefined };
    }
  }
  if (res.status === 404 && unitId === "y12-economics-essay-writing") {
    const body = await res.json().catch(() => ({}));
    if (body?.error === "no_open_attempt") return { ok: false, error: "You have no essay in progress. Pick an essay to start." };
  }
  if (res.status === 503) {
    // a sequential or progress-dependent unit cannot find the student's place without their results (constitution VI)
    return { ok: false, error: unitNotices(unitId).unavailable };
  }
  if (!res.ok) return { ok: false, error: "Could not start the quiz. Please try again." };

  const data: StartResponse | { finished: true } = await res.json();
  if ("finished" in data) {
    return { ok: false, finished: true, error: unitNotices(unitId).finished };
  }
  saveAttemptPayload(data.attemptId, {
    attemptToken: data.attemptToken,
    unitId: data.unitId,
    passMark: data.passMark,
    questions: data.questions,
    answered: data.answered ?? {},
    ...(data.essay ? { essay: data.essay } : {}),
    ...(data.paragraphState ? { paragraphState: data.paragraphState } : {}),
    ...(data.unseenState ? { unseenState: data.unseenState } : {}),
    ...(data.comparativeState ? { comparativeState: data.comparativeState } : {}),
    ...(data.essayState ? { essayState: data.essayState } : {}),
  });
  return { ok: true, attemptId: data.attemptId, persisted: data.persisted };
}
