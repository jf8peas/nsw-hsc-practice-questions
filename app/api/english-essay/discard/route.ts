import { NextResponse } from "next/server";

import { getQuestion } from "@/content";
import { authenticate } from "@/lib/api-auth.server";
import { handleEnglishDiscard } from "@/lib/english-essay/discard-handler.server";
import { verifyAttemptToken } from "@/lib/tokens.server";

export const runtime = "nodejs";

/** Discard the student's open, unmarked English essay attempt (spec 011, contracts/api.md B). */
export async function POST(req: Request) {
  const auth = await authenticate();
  if (auth.response) return auth.response;
  const user = auth.user;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const attemptId = typeof body.attemptId === "string" ? body.attemptId : "";
  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  if (!attemptId || !questionId || typeof body.attemptToken !== "string") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const verified = verifyAttemptToken(body.attemptToken, { uid: user.id, attemptId });
  if (!verified.ok) return NextResponse.json({ error: "invalid_attempt_token" }, { status: 401 });
  if (!verified.payload.questionIds.includes(questionId)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const found = getQuestion(questionId);
  if (!found || found.question.type !== "englishEssay") return NextResponse.json({ error: "not_found" }, { status: 404 });

  return handleEnglishDiscard(user, attemptId);
}
