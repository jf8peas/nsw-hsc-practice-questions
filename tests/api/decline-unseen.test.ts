// POST /api/unseen/decline (spec 008 FR-020): skip the retry, record the first try's mark, show the model
// answer. No marker call and no slot.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getAnswer } from "@/content/answers";
import { post, signedInStudent } from "../helpers/routes";
import { dailyAiUsage, results, unseenPhases } from "@/lib/db/schema";

import {
  Q,
  declineUnseen,
  fillWords,
  gradeUnseen,
  restoreUnseenEnv,
  setupUnseenEnv,
  startUnseen,
  type UnseenEnv,
} from "../helpers/unseen";

let env: UnseenEnv;
afterEach(async () => {
  restoreUnseenEnv();
  vi.restoreAllMocks();
  await env?.close();
});

const q = Q[0];
const BELOW = fillWords(60, "[mark:1]", "[miss:technique-effect]");
const used = async (userId: string) =>
  (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce((s, r) => s + r.count, 0);

describe("declining the retry", () => {
  it("records the first try's mark, finishes the question and releases the model answer", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, BELOW);
    const { status, body } = await declineUnseen(started, q);
    expect(status).toBe(200);
    expect(body.saved).toBe(true);
    expect(body.result).toMatchObject({ phase: 1, marksAwarded: 1, recordedMark: 1, ending: "declined" });
    expect(body.result.discussion.modelAnswer).toBe(getAnswer(q)!.unseen!.model);
    expect(body.result.try1.mark).toBe(1);
    const row = (await env.db.select().from(unseenPhases))[0];
    expect(row).toMatchObject({ status: "final", ending: "declined", recordedMark: 1, try2Mark: null });
    expect((await env.db.select().from(results))[0]).toMatchObject({ marksAwarded: 1, maxMarks: 3 });
    expect(await used(user.id)).toBe(1); // the first try's slot only: declining takes none
  });

  it("is refused when nothing has been marked, and is a 409 when already final", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    const early = await declineUnseen(started, q);
    expect(early.status).toBe(400);
    expect(early.body.error).toBe("phase_refused");
    await gradeUnseen(started, q, BELOW);
    await declineUnseen(started, q);
    const again = await declineUnseen(started, q);
    expect(again.status).toBe(409);
    expect(again.body.error).toBe("already_answered");
    expect(again.body.result.ending).toBe("declined");
  });

  it("is a 409 after full marks", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, fillWords(60));
    expect((await declineUnseen(started, q)).status).toBe(409);
  });

  it("two simultaneous declines give one winner", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, BELOW);
    const [a, b] = await Promise.all([declineUnseen(started, q), declineUnseen(started, q)]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect(await env.db.select().from(results)).toHaveLength(1);
  });

  it("works while the daily limit is reached, and takes no slot", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    process.env.LLM_DAILY_CAP = "1";
    const { started } = await startUnseen();
    await gradeUnseen(started, q, BELOW);
    expect((await gradeUnseen(started, q, fillWords(60), { phase: 2 })).body.notMarked.reason).toBe("daily_limit");
    const { status, body } = await declineUnseen(started, q);
    expect(status).toBe(200);
    expect(body.result.ending).toBe("declined");
    expect(await used(user.id)).toBe(1);
  });
});

describe("checks on the request", () => {
  it("rejects a bad token (401), a question not in the attempt (404) and a rate-limited student (429)", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, BELOW);
    const { POST } = await import("@/app/api/unseen/decline/route");
    const badToken = await POST(post("/api/unseen/decline", { attemptId: started.attemptId, attemptToken: "x.y", questionId: q }));
    expect(badToken.status).toBe(401);
    const wrong = await POST(post("/api/unseen/decline", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId: "y12-english-advanced-unseen-texts.nope" }));
    expect(wrong.status).toBe(404);
    const noBody = await POST(post("/api/unseen/decline", {}));
    expect(noBody.status).toBe(400);
    process.env.GRADE_RATE_LIMIT = "1";
    // the grade above already used this minute's allowance under the old limit; a fresh limiter key is per user, so reset by calling twice
    const first = await declineUnseen(started, q);
    const second = await declineUnseen(started, q);
    expect([first.status, second.status]).toContain(429);
  });

  it("answers 503 when the database cannot be read", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, BELOW);
    env.databaseDown();
    expect((await declineUnseen(started, q)).status).toBe(503);
  });
});
