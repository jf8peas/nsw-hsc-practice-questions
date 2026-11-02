// Self-marking for rewrite questions (spec 005 FR-030, FR-046) through POST
// /api/results/self-mark: the student ticks criterion A, one tick per target term
// for criterion (b), and criterion C; the marks are the sum of the ticks, the
// per-term ticks become the result's concept_outcomes (phase 1 only), and a forged
// or other-student token, or ticks for terms the question does not have, are rejected.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getUnit } from "@/content";
import { getAnswer } from "@/content/answers";
import { conceptProgress } from "@/lib/concepts/progress";
import { results } from "@/lib/db/schema";
import type { RewriteGrade } from "@/lib/openrouter.server";
import type { Question } from "@/lib/types";

import { setupTestEnv, type TestEnv } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";
import { post, signedInStudent, startAttempt, type StartedAttempt } from "../helpers/routes";

const REWRITE_UNIT = "y12-economics-sentence-writing";

interface RewriteRouteEnv extends TestEnv {
  /** The stubbed rewrite grader. Default: full marks (A, no padding, every term used). */
  rewrite: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<RewriteGrade | null>>>;
}

/** setupTestEnv plus a mock for the rewrite grader (the real OpenRouter call is never made). */
async function setupRewriteEnv(): Promise<RewriteRouteEnv> {
  const env = await setupTestEnv();
  const rewrite = vi.fn<(...args: unknown[]) => Promise<RewriteGrade | null>>(async (...args) => {
    const p = args[0] as { targetTerms: Array<{ term: string }> };
    return {
      criterionA: true,
      padding: false,
      terms: p.targetTerms.map((t) => ({ term: t.term, status: "used" as const })),
      feedback: "Good work.",
      gradedBy: "mock-model",
    };
  });
  vi.doMock("@/lib/openrouter.server", () => ({
    llmGradingConfigured: () => true,
    gradeShortAnswer: () => Promise.resolve(null),
    gradeRewrite: (...args: unknown[]) => rewrite(...args),
  }));
  return Object.assign(env, { rewrite });
}

let env: RewriteRouteEnv;
afterEach(async () => {
  delete process.env.LLM_DAILY_CAP;
  delete process.env.GRADE_RATE_LIMIT;
  await env?.close();
});

const rewritesOf = (started: StartedAttempt) => started.questions.filter((q) => q.type === "rewrite");

/** Grade a rewrite in phase 1 while the model fails, so the grader asks for a self-mark. */
async function needsSelfMark(started: StartedAttempt, q: Question, answer: string) {
  env.rewrite.mockResolvedValueOnce(null);
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(
    post("/api/grade", {
      attemptId: started.attemptId,
      attemptToken: started.attemptToken,
      questionId: q.id,
      answer,
    }),
  );
  const body = await res.json();
  return { token: body.selfMarkToken as string };
}

async function selfMark(
  started: StartedAttempt,
  q: Question,
  answer: string,
  token: unknown,
  extra: Record<string, unknown> = {},
) {
  const { POST } = await import("@/app/api/results/self-mark/route");
  const res = await POST(
    post("/api/results/self-mark", {
      attemptId: started.attemptId,
      attemptToken: started.attemptToken,
      questionId: q.id,
      answer,
      correct: true,
      token,
      ...extra,
    }),
  );
  return { status: res.status, body: await res.json() };
}

describe("POST /api/results/self-mark for rewrite questions", () => {
  it("saves the result with the marks the per-criterion and per-term ticks add up to, and the term outcomes feed concept progress", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const key = getAnswer(q.id)!;
    const terms = key.targetTerms!;
    const answer = "A sentence the model cannot grade.";
    const { token } = await needsSelfMark(started, q, answer);

    // tick A, C and every term: 3 marks, every term correct
    const termTicks = Object.fromEntries(terms.map((t) => [t.conceptId, true]));
    const res = await selfMark(started, q, answer, token, {
      criterionA: true,
      criterionC: true,
      termTicks,
    });
    expect(res.status).toBe(200);
    expect(res.body.saved).toBe(true);
    const [row] = await env.db.select().from(results).where(eq(results.questionId, q.id));
    expect(row).toMatchObject({ marksAwarded: 3, maxMarks: 3, gradedBy: "self" });
    expect(row.conceptOutcomes).toEqual(terms.map((t) => ({ conceptId: t.conceptId, correct: true })));

    // every term correct in phase 1: nothing to review
    const unit = getUnit(REWRITE_UNIT)!;
    const states = conceptProgress(unit, [
      {
        id: row.id,
        questionId: row.questionId,
        marks: row.marksAwarded,
        max: row.maxMarks,
        answeredAt: row.createdAt,
        conceptOutcomes: row.conceptOutcomes,
      },
    ]);
    expect(states).toEqual([]);
  });

  it("the marks are the sum of the ticks, and an unticked term stays wrong in concept progress", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const key = getAnswer(q.id)!;
    const terms = key.targetTerms!;
    const unticked = terms[terms.length - 1];
    const answer = "A sentence the model cannot grade.";
    const { token } = await needsSelfMark(started, q, answer);

    // A and C ticked, every term ticked except the last: 2 marks (A + C), the last term wrong
    const termTicks = Object.fromEntries(terms.map((t) => [t.conceptId, t.conceptId !== unticked.conceptId]));
    const res = await selfMark(started, q, answer, token, {
      criterionA: true,
      criterionC: true,
      termTicks,
    });
    expect(res.status).toBe(200);
    const [row] = await env.db.select().from(results).where(eq(results.questionId, q.id));
    expect(row.marksAwarded).toBe(2);
    expect(row.conceptOutcomes).toEqual(
      terms.map((t) => ({ conceptId: t.conceptId, correct: t.conceptId !== unticked.conceptId })),
    );

    const unit = getUnit(REWRITE_UNIT)!;
    const states = conceptProgress(unit, [
      {
        id: row.id,
        questionId: row.questionId,
        marks: row.marksAwarded,
        max: row.maxMarks,
        answeredAt: row.createdAt,
        conceptOutcomes: row.conceptOutcomes,
      },
    ]);
    expect(states.map((s) => s.conceptId)).toEqual([unticked.conceptId]);
    expect(states[0].count).toBe(3);
  });

  it("rejects a forged or other-student token, and ticks for terms the question does not have", async () => {
    env = await setupRewriteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const key = getAnswer(q.id)!;
    const terms = key.targetTerms!;
    const answer = "A sentence the model cannot grade.";
    const { token } = await needsSelfMark(started, q, answer);
    const ticks = Object.fromEntries(terms.map((t) => [t.conceptId, true]));

    // a forged token
    expect((await selfMark(started, q, answer, "forged", { criterionA: true, criterionC: true, termTicks: ticks })).status).toBe(400);

    // a token issued to another student
    const { signSelfMarkToken } = await import("@/lib/tokens.server");
    const other = await seedUser(env.db);
    const foreign = signSelfMarkToken({
      uid: other.id,
      attemptId: started.attemptId,
      questionId: q.id,
      answer,
      termConceptIds: terms.map((t) => t.conceptId),
    });
    expect((await selfMark(started, q, answer, foreign, { criterionA: true, criterionC: true, termTicks: ticks })).status).toBe(400);
    expect(user.id).not.toBe(other.id);

    // ticks for a term the question does not have
    const bogus = `${REWRITE_UNIT}.c-not-a-term`;
    expect(
      (await selfMark(started, q, answer, token, {
        criterionA: true,
        criterionC: true,
        termTicks: { ...ticks, [bogus]: true },
      })).status,
    ).toBe(400);

    expect(await env.db.select().from(results)).toHaveLength(0);
  });
});