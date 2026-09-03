import { NextResponse } from "next/server";

import { getQuestion } from "@/content";
import { gateEnabled, hasAccess } from "@/lib/gate.server";
import type { GradeRequest } from "@/lib/grading";
import { gradeAnswer } from "@/lib/grading.server";
import { llmGradingConfigured } from "@/lib/openrouter.server";
import { checkGradeRateLimit } from "@/lib/ratelimit.server";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export const runtime = "nodejs";

const MAX_ANSWER_LEN = 6000;

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

  // Gate + rate limit only the paid path — short answers. MC is free.
  if (found.question.type === "short") {
    if (!(await hasAccess())) {
      return NextResponse.json({ error: "locked", needsCode: true }, { status: 401 });
    }
    const rl = await checkGradeRateLimit(clientIp(req));
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited", retryAfter: rl.retryAfter },
        {
          status: 429,
          headers: rl.retryAfter ? { "retry-after": String(rl.retryAfter) } : undefined,
        },
      );
    }
  }

  const result = await gradeAnswer(questionId, answer);
  if (!result) {
    return NextResponse.json({ error: "Unknown question" }, { status: 404 });
  }

  return NextResponse.json(result);
}

// Lets the client find out up-front whether short answers will need a code,
// and doubles as a config check: `llm` is true when OPENROUTER_API_KEY is set.
export async function GET() {
  return NextResponse.json({
    gate: gateEnabled(),
    unlocked: await hasAccess(),
    llm: llmGradingConfigured(),
    gradingModel: llmGradingConfigured()
      ? process.env.GRADING_MODEL || "deepseek/deepseek-chat"
      : null,
  });
}
