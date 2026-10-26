// Client helper: start a new attempt (POST /api/attempts) and keep the response
// in sessionStorage so the quiz can run even when the database is down
// (research R19: an attempt started during an outage has `persisted: false`).

import { saveAttemptPayload } from "@/lib/drafts";
import type { Question } from "@/lib/types";

export type StartResult =
  | { ok: true; attemptId: string; persisted: boolean }
  | { ok: false; error: string; unauthenticated?: boolean };

interface StartResponse {
  attemptId: string;
  attemptToken: string;
  persisted: boolean;
  unitId: string;
  passMark: number;
  questions: Question[];
  answered: Record<string, { marks: number; max: number }>;
}

export async function startAttempt(unitId: string): Promise<StartResult> {
  let res: Response;
  try {
    res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ unitId }),
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
  if (!res.ok) return { ok: false, error: "Could not start the quiz. Please try again." };

  const data: StartResponse = await res.json();
  saveAttemptPayload(data.attemptId, {
    attemptToken: data.attemptToken,
    unitId: data.unitId,
    passMark: data.passMark,
    questions: data.questions,
    answered: data.answered ?? {},
  });
  return { ok: true, attemptId: data.attemptId, persisted: data.persisted };
}
