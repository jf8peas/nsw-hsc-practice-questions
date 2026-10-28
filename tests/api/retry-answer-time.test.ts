// A result saved late keeps the time it was answered (spec 002 research R2, FR-007).
// The receipt's issue time (set when the answer was graded) becomes created_at on retry.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { results } from "@/lib/db/schema";
import { listUnitResultsForProgress } from "@/lib/db/queries/results.server";

import { seedAttempt } from "../helpers/fixtures";
import {
  correctDisplayIndex,
  post,
  setupRouteEnv,
  signedInStudent,
  startAttempt,
  type RouteEnv,
} from "../helpers/routes";

let env: RouteEnv;
afterEach(async () => {
  await env?.close();
});

const unit = UNITS.find((u) => u.id === "y11-formula-test")!;
const QIDS = unit.questions.slice(0, 3).map((q) => q.id);
const TEN_MINUTES = 10 * 60_000;

async function receiptFor(uid: string, attemptId: string, questionId: string, signedAtMs: number, marks = 1) {
  const { signReceipt } = await import("@/lib/tokens.server");
  return signReceipt(
    {
      uid,
      attemptId,
      attempt: { unitId: unit.id, questionIds: QIDS, mcOptionOrder: {}, issuedAt: Math.floor(signedAtMs / 1000) },
      questionId,
      answer: "an answer",
      marks,
      max: 1,
      gradedBy: "auto",
      feedback: null,
      hits: null,
      misses: null,
    },
    signedAtMs,
  );
}

async function retry(receipt: string) {
  const { POST } = await import("@/app/api/results/retry/route");
  const res = await POST(post("/api/results/retry", { receipt }));
  return { status: res.status, body: await res.json() };
}

describe("POST /api/results/retry stores the answer time", () => {
  it("sets created_at to the receipt's issue time, not the time of the retry", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const att = await seedAttempt(env.db, user.id, { questionIds: QIDS, unitId: unit.id });
    const answeredAt = Date.now() - TEN_MINUTES;

    const { status, body } = await retry(await receiptFor(user.id, att.id, QIDS[0], answeredAt));
    expect(status).toBe(200);
    expect(body.saved).toBe(true);

    const [row] = await env.db.select().from(results).where(eq(results.attemptId, att.id));
    expect(Math.floor(row.createdAt.getTime() / 1000)).toBe(Math.floor(answeredAt / 1000));
    expect(Date.now() - row.createdAt.getTime()).toBeGreaterThanOrEqual(TEN_MINUTES - 1000);
  });

  it("retrying the same receipt again changes nothing, including created_at", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const att = await seedAttempt(env.db, user.id, { questionIds: QIDS, unitId: unit.id });
    const receipt = await receiptFor(user.id, att.id, QIDS[0], Date.now() - TEN_MINUTES);

    await retry(receipt);
    const [first] = await env.db.select().from(results).where(eq(results.attemptId, att.id));
    const again = await retry(receipt);
    expect(again.body.duplicate).toBe(true);
    const rows = await env.db.select().from(results).where(eq(results.attemptId, att.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].createdAt).toEqual(first.createdAt);
  });

  it("a normal graded save keeps created_at at the time of the answer (within a second of now)", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = started.questions.find((x) => x.type === "mc")!;
    const { POST } = await import("@/app/api/grade/route");
    const before = Date.now();
    const res = await POST(
      post("/api/grade", {
        attemptId: started.attemptId,
        attemptToken: started.attemptToken,
        questionId: q.id,
        answer: String(correctDisplayIndex(q)),
      }),
    );
    expect((await res.json()).saved).toBe(true);
    const [row] = await env.db.select().from(results).where(eq(results.attemptId, started.attemptId));
    expect(row.createdAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(row.createdAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it("a result saved late is replayed before a newer answer to the same attempt", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const att = await seedAttempt(env.db, user.id, { questionIds: QIDS, unitId: unit.id });
    const now = Date.now();

    // the newer answer is saved first ...
    await retry(await receiptFor(user.id, att.id, QIDS[1], now - 60_000, 1));
    // ... and the older one arrives later, from the outbox
    await retry(await receiptFor(user.id, att.id, QIDS[0], now - TEN_MINUTES, 0));

    const rows = await listUnitResultsForProgress(env.db, user.id, unit.id);
    expect(rows.map((r) => r.questionId)).toEqual([QIDS[0], QIDS[1]]);
  });
});
