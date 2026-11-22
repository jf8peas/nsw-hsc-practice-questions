import "server-only";

import { NextResponse } from "next/server";

import { comparativeDiscussion, markComparative } from "@/lib/grading.server";
import { isCompletePick, samePick, tabOrder } from "@/lib/comparative/pick";
import { comparativeResultFrom } from "@/lib/comparative/views";
import type { ComparativeQuestion } from "@/lib/types";
import { handleUnseenGrade, type GradeFlow } from "@/lib/unseen/grade-handler.server";
import { logUnseen } from "@/lib/unseen/log.server";
import type { AttemptTokenPayload } from "@/lib/tokens.server";

// The two-try grade flow for a comparative question (spec 009, contracts/api.md): spec 008's shared core
// (handleUnseenGrade: word rules, database, phase order, rate limits, daily-limit slot, insert and finalise) with the
// comparative parts plugged in: the pick checks, the marker (given only the picked texts) and the nine-verdict result.

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

/** The flow for one question. The pick checks run after the stored row is read and before any limit, slot or marker call. */
export function comparativeFlow(question: ComparativeQuestion, userId: string): GradeFlow {
  const log = (outcome: "invalid_pick" | "pick_changed", phase: 1 | 2) =>
    logUnseen({ outcome, userId, questionId: question.id, phase, durationMs: 0 });
  return {
    check({ body, row, phase }) {
      const sent = body.pick;
      if (question.choice === null) {
        // a fixed pair has no pick: the two named texts are the answer's texts
        if (sent !== undefined && !(Array.isArray(sent) && sent.length === 0)) {
          log("invalid_pick", phase);
          return json({ error: "invalid_pick" }, 400);
        }
        return {};
      }
      if (phase === 1) {
        if (!isCompletePick(question.choice, sent)) {
          log("invalid_pick", 1);
          return json({ error: "invalid_pick" }, 400);
        }
        return { pickedTextIds: tabOrder(question, sent) };
      }
      // the retry keeps the first try's pick and cannot change it; a missing pick means "the stored one"
      const stored = row?.pickedTextIds ?? undefined;
      if (sent !== undefined && !(Array.isArray(sent) && sent.length > 0 && stored && sent.every((p) => typeof p === "string") && samePick(stored, sent as string[]))) {
        log("pick_changed", 2);
        return json({ error: "pick_changed" }, 409);
      }
      return stored ? { pickedTextIds: stored } : {};
    },
    mark: ({ questionId, answer, phase, pickedTextIds }) => markComparative(questionId, answer, phase, pickedTextIds),
    discussion: (questionId) => comparativeDiscussion(questionId),
    resultFrom: (row, discussion) => comparativeResultFrom(row, discussion as ReturnType<typeof comparativeDiscussion> | null | undefined),
  };
}

export function handleComparativeGrade(
  req: Request,
  user: { id: string },
  body: Record<string, unknown>,
  token: AttemptTokenPayload,
  question: ComparativeQuestion,
  degraded: boolean,
): Promise<NextResponse> {
  return handleUnseenGrade(req, user, body, token, question, degraded, comparativeFlow(question, user.id));
}
