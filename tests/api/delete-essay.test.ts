// Deleting a student, immediately or by the 2-year retention job, removes every essay row too (spec 010 FR-034,
// constitution Principle II): the essay phase (plan, review, essay, verdicts, gaps), drafts, attempts and results.
// Nobody else's rows are touched.

import { eq, sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { attempts, essayPhases, results, rewriteDrafts, users } from "@/lib/db/schema";
import { emptyScaffold } from "@/lib/essay/scaffold";
import { deleteStudentByEmail, runRetention } from "@/lib/retention.server";

import { setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const UNIT = "y12-economics-essay-writing";
const Q = `${UNIT}.e1`;

async function withEssayData(email: string, sub: string) {
  const u = await seedUser(env.db, { email, googleSub: sub });
  const a = await seedAttempt(env.db, u.id, { unitId: UNIT, questionIds: [Q], completedAt: new Date() });
  await seedResult(env.db, { attemptId: a.id, userId: u.id }, { unitId: UNIT, questionId: Q, marksAwarded: 14, maxMarks: 20, gradedBy: "llm" });
  await env.db.insert(essayPhases).values({
    attemptId: a.id, userId: u.id, unitId: UNIT, questionId: Q, status: "finished", scaffold: emptyScaffold(), scaffoldLockedAt: new Date(),
    review: { checks: [], figureFlags: [] }, essayText: "student essay", essayWords: 700, rawMark: 14, band: 2, finalMark: 14, coversBoth: true,
    criteria: { understanding: { verdict: "sound", reason: "r" }, theory: { verdict: "sound", reason: "r" }, assessment: { verdict: "sound", reason: "r" }, data: { verdict: "sound", reason: "r" }, structure: { verdict: "sound", reason: "r" } },
    bandReason: "b", lift: ["a", "b"], flags: [], gaps: [{ conceptId: "x", detail: "d" }], usedWell: [], promptVersion: "essay-pilot-2", model: "m", gradedAt: new Date(),
  });
  await env.db.insert(rewriteDrafts).values({ attemptId: a.id, userId: u.id, unitId: UNIT, questionId: Q, phase1Draft: "draft", phase2Draft: "" });
  return u;
}
const count = async (table: typeof essayPhases | typeof rewriteDrafts | typeof attempts | typeof results, userId: string) =>
  (await env.db.select().from(table).where(eq(table.userId, userId))).length;
const TABLES = [essayPhases, rewriteDrafts, attempts, results] as const;

describe("essay rows are deleted with the student", () => {
  it("deleteStudentByEmail removes phases, drafts, attempts and results, and only that student's", async () => {
    env = await setupTestEnv();
    const ann = await withEssayData("ann@example.com", "g-ann");
    const bob = await withEssayData("bob@example.com", "g-bob");
    expect((await deleteStudentByEmail(env.db, "ann@example.com")).found).toBe(true);
    for (const t of TABLES) expect(await count(t, ann.id)).toBe(0);
    for (const t of TABLES) expect(await count(t, bob.id)).toBe(1);
  });

  it("the retention job (2 years inactive) removes them too", async () => {
    env = await setupTestEnv();
    const old = await withEssayData("old@example.com", "g-old");
    const fresh = await withEssayData("fresh@example.com", "g-fresh");
    await env.db.execute(sql`update users set created_at = now() - interval '3 years', last_sign_in_at = now() - interval '3 years', last_answer_at = now() - interval '3 years' where id = ${old.id}`);
    expect((await runRetention(env.db)).deletedStudents).toBe(1);
    for (const t of TABLES) expect(await count(t, old.id)).toBe(0);
    for (const t of TABLES) expect(await count(t, fresh.id)).toBe(1);
    expect(await env.db.select().from(users).where(eq(users.id, old.id))).toHaveLength(0);
  });

  it("deleting an open attempt removes its essay row and draft but not another attempt's", async () => {
    env = await setupTestEnv();
    const u = await withEssayData("keep@example.com", "g-keep");
    const open = await seedAttempt(env.db, u.id, { unitId: UNIT, questionIds: [Q] });
    await env.db.insert(essayPhases).values({ attemptId: open.id, userId: u.id, unitId: UNIT, questionId: Q, status: "planning", scaffold: emptyScaffold() });
    await env.db.delete(attempts).where(eq(attempts.id, open.id));
    expect(await count(essayPhases, u.id)).toBe(1);
    expect(await count(results, u.id)).toBe(1);
  });
});
