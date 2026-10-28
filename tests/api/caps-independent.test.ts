// The two daily caps never change each other (spec 002 SC-006, FR-030; constitution Principle VII):
// the student's allowance of AI-marked short answers, and the global concept-pipeline cap.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dailyAiUsage, dailyConceptUsage } from "@/lib/db/schema";

import { seedAttempt } from "../helpers/fixtures";
import { READY, fakeLlmPort, fixtureContent, seedResultAt, type FakePort } from "../helpers/concept-fixtures";
import { post, setupRouteEnv, signedInStudent, startAttempt, type RouteEnv, type StartedAttempt } from "../helpers/routes";

let env: RouteEnv;
let port: FakePort;

beforeEach(async () => {
  env = await setupRouteEnv();
  fixtureContent();
  port = fakeLlmPort();
  // setupRouteEnv replaces the grader module; the concept pipeline also imports chatCompletion from it
  vi.doMock("@/lib/openrouter.server", () => ({
    llmGradingConfigured: () => true,
    conceptLlmConfigured: () => true,
    gradeShortAnswer: (...args: unknown[]) => env.llm(...args),
    chatCompletion: vi.fn(),
  }));
  vi.doMock("@/lib/concepts/llm.server", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/lib/concepts/llm.server")>()),
    createConceptLlmPort: () => port,
  }));
  vi.stubEnv("CONCEPT_MODEL", "vendor/gen");
  vi.stubEnv("REVIEW_MODEL", "vendor/rev");
  // full marks (the fixture shorts are worth 2): partial credit would count as a miss and add weak concepts
  env.llm.mockResolvedValue({ marksAwarded: 2, feedback: "Good reasoning.", rubricHits: ["a", "b"], rubricMisses: [], gradedBy: "mock-model" });
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await env.close();
});

async function weakStudent() {
  const user = await signedInStudent(env);
  const attempt = await seedAttempt(env.db, user.id, { unitId: READY });
  await seedResultAt(env.db, { attemptId: attempt.id, userId: user.id }, READY, `${READY}.m01`, 0, 1, new Date());
  return user;
}

async function ensure() {
  const { POST } = await import("@/app/api/units/[unitId]/concepts/ensure/route");
  const { settleBackground } = await import("@/lib/background.server");
  const res = await POST(new Request("http://localhost/x", { method: "POST" }), { params: Promise.resolve({ unitId: READY }) });
  const body = await res.json();
  await settleBackground();
  return { status: res.status, body };
}

async function gradeShort(started: StartedAttempt, index: number) {
  const q = started.questions.filter((x) => x.type === "short")[index];
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(
    post("/api/grade", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId: q.id, answer: "my answer" }),
  );
  return res.json();
}

const aiUsed = async () => (await env.db.select().from(dailyAiUsage)).reduce((s, r) => s + r.count, 0);
const conceptUsed = async () => (await env.db.select().from(dailyConceptUsage)).reduce((s, r) => s + r.count, 0);

describe("the concept cap used up does not touch AI marking", () => {
  it("a short answer is still AI-marked and counted against the student's own allowance", async () => {
    vi.stubEnv("CONCEPT_DAILY_CAP", "1");
    await weakStudent();
    await ensure(); // takes the only concept slot
    expect(await conceptUsed()).toBe(1);

    const started = await startAttempt(READY);
    const body = await gradeShort(started, 0);
    expect(env.llm).toHaveBeenCalledTimes(1);
    expect(body.result.needsSelfMark).toBe(false);
    expect(body.aiLimit).toBeUndefined();
    expect(await aiUsed()).toBe(1);
    expect(await conceptUsed()).toBe(1); // marking took nothing from the concept cap
  });
});

describe("the student's AI allowance used up does not stop concept preparation", () => {
  it("short answers fall back to self-marking, yet the weak concept's explanation is still generated and approved", async () => {
    vi.stubEnv("LLM_DAILY_CAP", "1");
    vi.stubEnv("CONCEPT_DAILY_CAP", "100");
    const user = await weakStudent();
    const started = await startAttempt(READY);

    expect((await gradeShort(started, 0)).result.needsSelfMark).toBe(false); // uses the allowance
    const second = await gradeShort(started, 1);
    expect(second.result.needsSelfMark).toBe(true);
    expect(second.aiLimit).toMatchObject({ reached: true });
    expect(await aiUsed()).toBe(1);

    const r = await ensure();
    expect(r.status).toBe(202);
    expect(port.count("generateSummary")).toBe(1);
    expect(port.count("reviewSummary")).toBe(1);
    const store = await import("@/lib/concepts/store.server");
    const slot = await store.getSlot(env.db, "fx-ready.c-a", "summary");
    expect(slot?.liveVersionId).not.toBeNull();
    expect(await conceptUsed()).toBe(2); // generate + review, from the concept cap only
    expect(await aiUsed()).toBe(1); // the pipeline took nothing from the student's allowance
    expect(user.id).toBeTruthy();
  });
});

describe("the caps are counted in different places", () => {
  it("the AI allowance is per student and the concept cap is one row per day for everyone", async () => {
    await weakStudent();
    const started = await startAttempt(READY);
    await gradeShort(started, 0);
    await ensure();
    const ai = await env.db.select().from(dailyAiUsage);
    const concept = await env.db.select().from(dailyConceptUsage);
    expect(ai[0]).toHaveProperty("userId");
    expect(concept[0]).not.toHaveProperty("userId");
    expect(concept).toHaveLength(1);
  });
});
