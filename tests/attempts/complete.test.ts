import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { finalizeIfComplete } from "@/lib/attempts/complete.server";
import { attempts, results } from "@/lib/db/schema";

import { createTestDb, type TestDb } from "../helpers/db";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

let t: TestDb;
const [q1, q2, q3] = UNITS[0].questions.map((q) => q.id);

beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.close();
});

async function setup(questionIds: string[]) {
  const user = await seedUser(t.db);
  const attempt = await seedAttempt(t.db, user.id, { questionIds });
  const answer = (questionId: string) =>
    seedResult(t.db, { attemptId: attempt.id, userId: user.id }, { questionId });
  const finalize = async () => {
    const [fresh] = await t.db.select().from(attempts).where(eq(attempts.id, attempt.id));
    return finalizeIfComplete(t.db, fresh);
  };
  const completedAt = async () =>
    (await t.db.select().from(attempts).where(eq(attempts.id, attempt.id)))[0].completedAt;
  return { user, attempt, answer, finalize, completedAt };
}

describe("finalizeIfComplete", () => {
  it("completes only when every drawn question that still exists has a result", async () => {
    const { answer, finalize, completedAt } = await setup([q1, q2, q3]);
    await answer(q1);
    expect(await finalize()).toEqual({ completed: false });
    await answer(q2);
    expect(await finalize()).toEqual({ completed: false });
    expect(await completedAt()).toBeNull();
    await answer(q3);
    expect(await finalize()).toEqual({ completed: true });
    expect(await completedAt()).toBeInstanceOf(Date);
  });

  it("skips a drawn question that is missing from content (retired)", async () => {
    const { answer, finalize } = await setup([q1, "retired.q999", q2]);
    await answer(q1);
    expect(await finalize()).toEqual({ completed: false });
    await answer(q2);
    expect(await finalize()).toEqual({ completed: true });
  });

  it("completes an attempt whose drawn questions were all retired, with 0 marks", async () => {
    const { finalize, completedAt, attempt } = await setup(["retired.a", "retired.b"]);
    expect(await finalize()).toEqual({ completed: true });
    expect(await completedAt()).toBeInstanceOf(Date);
    const rows = await t.db.select().from(results).where(eq(results.attemptId, attempt.id));
    expect(rows).toHaveLength(0);
  });

  it("is idempotent and never moves completed_at once set", async () => {
    const { answer, finalize, completedAt } = await setup([q1]);
    await answer(q1);
    await finalize();
    const first = await completedAt();
    await new Promise((r) => setTimeout(r, 10));
    expect(await finalize()).toEqual({ completed: true });
    expect((await completedAt())!.getTime()).toBe(first!.getTime());
  });

  it("keeps answers saved in an abandoned (never finalized) attempt", async () => {
    const { answer, completedAt, attempt } = await setup([q1, q2]);
    await answer(q1);
    expect(await completedAt()).toBeNull();
    const rows = await t.db.select().from(results).where(eq(results.attemptId, attempt.id));
    expect(rows).toHaveLength(1);
  });

  it("only counts the student's own results", async () => {
    const mine = await setup([q1]);
    const other = await setup([q1]);
    await other.answer(q1);
    expect(await mine.finalize()).toEqual({ completed: false });
  });
});
