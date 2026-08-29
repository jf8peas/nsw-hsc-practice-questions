import { NextResponse } from "next/server";

import { getQuestion } from "@/content";
import { gateEnabled, hasAccess } from "@/lib/gate.server";
import type { GradeRequest } from "@/lib/grading";
import { gradeAnswer } from "@/lib/grading.server";

export const runtime = "nodejs";

const MAX_ANSWER_LEN = 2000;

export async function POST(req: Request) {
  let body: Partial<GradeRequest>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  const answer =
    typeof body.answer === "string" ? body.answer.slice(0, MAX_ANSWER_LEN) : "";

  if (!questionId) {
    return NextResponse.json({ error: "questionId required" }, { status: 400 });
  }

  const found = getQuestion(questionId);
  if (!found) {
    return NextResponse.json({ error: "Unknown question" }, { status: 404 });
  }

  // Gate only the paid path — short answers. MC is free, always graded.
  if (found.question.type === "short" && !(await hasAccess())) {
    return NextResponse.json(
      { error: "locked", needsCode: true },
      { status: 401 },
    );
  }

  const result = await gradeAnswer(questionId, answer);
  if (!result) {
    return NextResponse.json({ error: "Unknown question" }, { status: 404 });
  }

  return NextResponse.json(result);
}

// Lets the client find out up-front whether short answers will need a code.
export async function GET() {
  return NextResponse.json({
    gate: gateEnabled(),
    unlocked: await hasAccess(),
  });
}
