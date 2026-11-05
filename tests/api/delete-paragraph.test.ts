// Deleting a student, immediately or by the 2-year retention job, removes every paragraph row too
// (spec 007 FR-028, constitution Principle II): phases (with verdicts, reasons and the flag),
// drafts, attempts and results. Nobody else's rows are touched.

import { eq, sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { attempts, paragraphPhases, results, rewriteDrafts, users, type ParagraphVerdicts } from "@/lib/db/schema";
import { deleteStudentByEmail, runRetention } from "@/lib/retention.server";

import { setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const UNIT = "y12-economics-paragraph-writing";
const Q = `${UNIT}.e01p1`;
const verdicts: ParagraphVerdicts = {
  a: { met: true, reason: "r" }, b: { met: true, reason: "r" }, c: { met: true, reason: "r" },
  d: { met: true, reason: "r", subs: { preciseLanguage: true, noPadding: true, withinLimit: true } },
};

async function withParagraphData(email: string, sub: string) {
  const u = await seedUser(env.db, { email, googleSub: sub });
  const a = await seedAttempt(env.db, u.id, { unitId: UNIT, questionIds: [Q], completedAt: new Date() });
  await seedResult(env.db, { attemptId: a.id, userId: u.id }, { unitId: UNIT, questionId: Q, marksAwarded: 4, maxMarks: 4, gradedBy: "llm" });
  await env.db.insert(paragraphPhases).values({
    attemptId: a.id, userId: u.id, unitId: UNIT, questionId: Q, status: "final", mode: "marker", ending: "full_marks",
    phase1Text: "student writing", phase1Mark: 4, phase1Verdicts: verdicts, phase1Feedback: "f", recordedMark: 4, flaggedAt: new Date(),
  });
  await env.db.insert(rewriteDrafts).values({ attemptId: a.id, userId: u.id, unitId: UNIT, questionId: Q, phase1Draft: "draft", phase2Draft: "" });
  return u;
}
const count = async (table: typeof paragraphPhases | typeof rewriteDrafts | typeof attempts | typeof results, userId: string) =>
  (await env.db.select().from(table).where(eq(table.userId, userId))).length;

describe("paragraph rows are deleted with the student", () => {
  it("deleteStudentByEmail removes phases, drafts, attempts and results, and only that student's", async () => {
    env = await setupTestEnv();
    const ann = await withParagraphData("ann@example.com", "g-ann");
    const bob = await withParagraphData("bob@example.com", "g-bob");
    const res = await deleteStudentByEmail(env.db, "ann@example.com");
    expect(res.found).toBe(true);
    for (const t of [paragraphPhases, rewriteDrafts, attempts, results] as const) expect(await count(t, ann.id)).toBe(0);
    for (const t of [paragraphPhases, rewriteDrafts, attempts, results] as const) expect(await count(t, bob.id)).toBe(1);
  });

  it("the retention job (2 years inactive) removes them too", async () => {
    env = await setupTestEnv();
    const old = await withParagraphData("old@example.com", "g-old");
    const fresh = await withParagraphData("fresh@example.com", "g-fresh");
    await env.db.execute(sql`update users set created_at = now() - interval '3 years', last_sign_in_at = now() - interval '3 years', last_answer_at = now() - interval '3 years' where id = ${old.id}`);
    const out = await runRetention(env.db);
    expect(out.deletedStudents).toBe(1);
    for (const t of [paragraphPhases, rewriteDrafts, attempts, results] as const) expect(await count(t, old.id)).toBe(0);
    for (const t of [paragraphPhases, rewriteDrafts, attempts, results] as const) expect(await count(t, fresh.id)).toBe(1);
    expect(await env.db.select().from(users).where(eq(users.id, old.id))).toHaveLength(0);
  });
});
