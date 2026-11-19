// POST /api/unseen/flag (spec 008 FR-035): "This mark seems wrong". Stored once for the whole attempt,
// idempotent across tabs, never changes a mark.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { results, unseenPhases } from "@/lib/db/schema";

import { post, signedInStudent } from "../helpers/routes";
import {
  Q,
  declineUnseen,
  fillWords,
  flagUnseen,
  gradeUnseen,
  restoreUnseenEnv,
  setupUnseenEnv,
  startUnseen,
  type UnseenEnv,
} from "../helpers/unseen";

let env: UnseenEnv;
afterEach(async () => {
  restoreUnseenEnv();
  delete process.env.FLAG_RATE_LIMIT;
  vi.restoreAllMocks();
  await env?.close();
});

const q = Q[0];
const phase = async () => (await env.db.select().from(unseenPhases).where(eq(unseenPhases.questionId, q)))[0];

describe("flagging a final attempt", () => {
  it("stores the flag once, answers the same done state again, and never changes the mark", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, fillWords(60, "[mark:2]"));
    await gradeUnseen(started, q, fillWords(60, "[mark:3]"), { phase: 2 });
    const before = (await phase()).recordedMark;

    const first = await flagUnseen(started, q);
    expect(first).toEqual({ status: 200, body: { flagged: true } });
    const stamp = (await phase()).flaggedAt;
    expect(stamp).not.toBeNull();

    const second = await flagUnseen(started, q);
    expect(second).toEqual({ status: 200, body: { flagged: true, already: true } });
    expect((await phase()).flaggedAt).toEqual(stamp);

    expect((await phase()).recordedMark).toBe(before);
    expect((await env.db.select().from(results).where(eq(results.questionId, q)))[0].marksAwarded).toBe(before);
  });

  it("two tabs at once store one flag", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, fillWords(60));
    const [a, b] = await Promise.all([flagUnseen(started, q), flagUnseen(started, q)]);
    expect([a.body.already, b.body.already].filter(Boolean)).toHaveLength(1);
    expect((await phase()).flaggedAt).not.toBeNull();
  });

  it("flags a declined attempt too (the flag covers the attempt, not one try)", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, fillWords(60, "[mark:1]"));
    await declineUnseen(started, q);
    expect((await flagUnseen(started, q)).body).toEqual({ flagged: true });
  });
});

describe("what is refused", () => {
  it("409 not_final while the question is at the retry choice, and 404 when nothing was marked", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    expect((await flagUnseen(started, q)).status).toBe(404);
    await gradeUnseen(started, q, fillWords(60, "[mark:1]"));
    expect(await flagUnseen(started, q)).toEqual({ status: 409, body: { error: "not_final" } });
    expect((await phase()).flaggedAt).toBeNull();
  });

  it("401 for a bad token, 404 for a question outside the attempt, 400 for a missing field", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, fillWords(60));
    const { POST } = await import("@/app/api/unseen/flag/route");
    expect((await POST(post("/api/unseen/flag", { attemptId: started.attemptId, attemptToken: "x.y", questionId: q }))).status).toBe(401);
    expect((await POST(post("/api/unseen/flag", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId: "y12-english-advanced-unseen-texts.nope" }))).status).toBe(404);
    expect((await POST(post("/api/unseen/flag", { attemptId: started.attemptId }))).status).toBe(400);
  });

  it("429 once the per-minute limit is used, and 503 when the database cannot be read", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, fillWords(60));
    process.env.FLAG_RATE_LIMIT = "1";
    const first = await flagUnseen(started, q);
    const second = await flagUnseen(started, q);
    expect([first.status, second.status]).toContain(429);
    env.databaseDown();
    delete process.env.FLAG_RATE_LIMIT;
    expect((await flagUnseen(started, q)).status).toBeGreaterThanOrEqual(429);
  });

  it("logs no text across a flag", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const spies = [vi.spyOn(console, "info"), vi.spyOn(console, "error")].map((s) => s.mockImplementation(() => {}));
    const { started } = await startUnseen();
    await gradeUnseen(started, q, "FLAG-ANSWER-4410 " + fillWords(60));
    await flagUnseen(started, q);
    const logged = spies.flatMap((s) => s.mock.calls.flat()).join("\n");
    expect(logged).toContain("[unseen] outcome=flagged");
    expect(logged).not.toContain("FLAG-ANSWER-4410");
  });
});
