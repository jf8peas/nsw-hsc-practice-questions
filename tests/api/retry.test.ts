import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { attempts, results, users } from "@/lib/db/schema";

import { asSessionUser } from "../helpers/env";
import { seedAttempt, seedUser } from "../helpers/fixtures";
import { post, setupRouteEnv, signedInStudent, type RouteEnv } from "../helpers/routes";

let env: RouteEnv;
afterEach(async () => {
  await env?.close();
});

const unit = UNITS.find((u) => u.id === "y11-physics-preliminary")!;
const QIDS = unit.questions.slice(0, 3).map((q) => q.id);
const ISSUED_AT = 1_800_000_000; // seconds

async function receiptFor(
  uid: string,
  attemptId: string,
  questionId = QIDS[0],
  overrides: Record<string, unknown> = {},
) {
  const { signReceipt } = await import("@/lib/tokens.server");
  return signReceipt({
    uid,
    attemptId,
    attempt: { unitId: unit.id, questionIds: QIDS, mcOptionOrder: {}, issuedAt: ISSUED_AT },
    questionId,
    answer: "an answer",
    marks: 1,
    max: 1,
    gradedBy: "auto",
    feedback: null,
    hits: null,
    misses: null,
    ...overrides,
  });
}

async function retry(receipt: unknown) {
  const { POST } = await import("@/app/api/results/retry/route");
  const res = await POST(post("/api/results/retry", { receipt }));
  return { res, status: res.status, body: await res.json() };
}

const ATTEMPT = "33333333-3a39-4a3e-8d5b-0b2f6f3c9d11";

describe("POST /api/results/retry", () => {
  it("inserts one row from a valid receipt and sets last_answer_at", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const att = await seedAttempt(env.db, user.id, { questionIds: QIDS, unitId: unit.id });
    const { status, body } = await retry(await receiptFor(user.id, att.id));
    expect(status).toBe(200);
    expect(body).toMatchObject({ saved: true, duplicate: false });
    const rows = await env.db.select().from(results).where(eq(results.attemptId, att.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ questionId: QIDS[0], answer: "an answer", gradedBy: "auto" });
    const [u] = await env.db.select().from(users).where(eq(users.id, user.id));
    expect(u.lastAnswerAt).toBeInstanceOf(Date);
  });

  it("replaying the same receipt returns duplicate: true and leaves one row (FR-007)", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const att = await seedAttempt(env.db, user.id, { questionIds: QIDS, unitId: unit.id });
    const receipt = await receiptFor(user.id, att.id);
    expect((await retry(receipt)).body.duplicate).toBe(false);
    const again = await retry(receipt);
    expect(again.status).toBe(200);
    expect(again.body.duplicate).toBe(true);
    expect(await env.db.select().from(results).where(eq(results.attemptId, att.id))).toHaveLength(1);
  });

  it("rejects tampered, expired and other-user receipts and writes nothing", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const att = await seedAttempt(env.db, user.id, { questionIds: QIDS, unitId: unit.id });
    const good = await receiptFor(user.id, att.id);

    const [body, sig] = good.split(".");
    const json = JSON.parse(Buffer.from(body, "base64url").toString());
    json.marks = 1;
    json.max = 99;
    const tampered = `${Buffer.from(JSON.stringify(json)).toString("base64url")}.${sig}`;
    expect((await retry(tampered)).status).toBe(400);

    const { signReceipt } = await import("@/lib/tokens.server");
    const expired = signReceipt(
      {
        uid: user.id,
        attemptId: att.id,
        attempt: { unitId: unit.id, questionIds: QIDS, mcOptionOrder: {}, issuedAt: ISSUED_AT },
        questionId: QIDS[0],
        answer: "x",
        marks: 1,
        max: 1,
        gradedBy: "auto",
        feedback: null,
        hits: null,
        misses: null,
      },
      Date.now() - 8 * 24 * 60 * 60 * 1000,
    );
    expect((await retry(expired)).status).toBe(400);

    const other = await seedUser(env.db);
    const foreign = await receiptFor(other.id, att.id);
    expect((await retry(foreign)).status).toBe(403);

    for (const junk of [undefined, null, "", "abc", 12]) expect((await retry(junk)).status).toBe(400);
    expect(await env.db.select().from(results)).toHaveLength(0);
  });

  it("rejects a receipt whose attempt id belongs to another student", async () => {
    env = await setupRouteEnv();
    const owner = await seedUser(env.db);
    const att = await seedAttempt(env.db, owner.id, { questionIds: QIDS, unitId: unit.id });
    const intruder = await signedInStudent(env);
    const { status } = await retry(await receiptFor(intruder.id, att.id));
    expect(status).toBe(403);
    expect(await env.db.select().from(results)).toHaveLength(0);
  });

  it("creates a never-stored attempt exactly once however many times it is retried", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    expect(await env.db.select().from(attempts)).toHaveLength(0);
    const receipt = await receiptFor(user.id, ATTEMPT);
    for (let i = 0; i < 3; i++) expect((await retry(receipt)).status).toBe(200);

    const atts = await env.db.select().from(attempts).where(eq(attempts.id, ATTEMPT));
    expect(atts).toHaveLength(1);
    expect(atts[0]).toMatchObject({ userId: user.id, unitId: unit.id, questionIds: QIDS });
    expect(atts[0].startedAt.getTime()).toBe(ISSUED_AT * 1000);
    expect(await env.db.select().from(results).where(eq(results.attemptId, ATTEMPT))).toHaveLength(1);
  });

  it("recomputes completion: the attempt completes when every drawn question has a result", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const a = await retry(await receiptFor(user.id, ATTEMPT, QIDS[0]));
    const b = await retry(await receiptFor(user.id, ATTEMPT, QIDS[1]));
    expect([a.body.attemptCompleted, b.body.attemptCompleted]).toEqual([false, false]);
    const c = await retry(await receiptFor(user.id, ATTEMPT, QIDS[2]));
    expect(c.body.attemptCompleted).toBe(true);
    const [att] = await env.db.select().from(attempts).where(eq(attempts.id, ATTEMPT));
    expect(att.completedAt).toBeInstanceOf(Date);
  });

  it("a receipt for a deleted student returns 410 and writes nothing", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const receipt = await receiptFor(user.id, ATTEMPT);
    await env.testDb.pg.query("delete from users where id = $1", [user.id]);
    const { status, body } = await retry(receipt);
    expect(status).toBe(410);
    expect(body.error).toBe("student_not_found");
    expect(await env.db.select().from(attempts)).toHaveLength(0);
    expect(await env.db.select().from(results)).toHaveLength(0);
  });

  it("answers 401 signed out and 503 (keep the receipt, back off) while the database is down", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const receipt = await receiptFor(user.id, ATTEMPT);
    env.signedOut();
    expect((await retry(receipt)).status).toBe(401);
    env.signedInAs(asSessionUser(user));
    env.databaseDown();
    const down = await retry(receipt);
    expect(down.status).toBe(503);
    expect(down.body.error).toBe("temporarily_unavailable");
    env.databaseUp();
    expect((await retry(receipt)).status).toBe(200);
  });

  it("answers 503 when only the save fails mid-way (the receipt is kept)", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const receipt = await receiptFor(user.id, ATTEMPT);
    env.failAfterCalls(1); // session lookup ok, save fails
    expect((await retry(receipt)).status).toBe(503);
    env.databaseUp();
    expect(await env.db.select().from(results)).toHaveLength(0);
  });
});
