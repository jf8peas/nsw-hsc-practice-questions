// Deleting a student, immediately or by the 2-year retention job, removes every comparative-unit row too (spec 009
// research R10, task T052, constitution Principle II): phase rows with nine verdicts and the pick, draft rows with their
// pick, attempts and results. Nobody else's rows are touched, and the pick columns hold nothing that outlives the student.

import { eq, sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { attempts, results, rewriteDrafts, unseenPhases, users, type SkillVerdicts } from "@/lib/db/schema";
import { deleteStudentByEmail, runRetention } from "@/lib/retention.server";
import { COMPARATIVE_SKILL_IDS } from "@/lib/unseen/skills";

import { setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const UNIT = "y12-english-advanced-comparative-texts";
const Q = `${UNIT}.ab24-q5`;
const verdicts = Object.fromEntries(COMPARATIVE_SKILL_IDS.map((id) => [id, { met: true, reason: "r" }])) as SkillVerdicts;

async function withComparativeData(email: string, sub: string) {
  const u = await seedUser(env.db, { email, googleSub: sub });
  const a = await seedAttempt(env.db, u.id, { unitId: UNIT, questionIds: [Q], completedAt: new Date() });
  await seedResult(env.db, { attemptId: a.id, userId: u.id }, { unitId: UNIT, questionId: Q, marksAwarded: 6, maxMarks: 6, gradedBy: "llm" });
  await env.db.insert(unseenPhases).values({
    attemptId: a.id, userId: u.id, unitId: UNIT, questionId: Q, maxMarks: 6, status: "final", ending: "full_marks",
    try1Text: "student writing", try1Mark: 6, try1Verdicts: verdicts, try1Feedback: "f", try1BiggestGap: "g",
    try1PromptVersion: "comparative-pilot-1", try1Model: "m", recordedMark: 6, pickedTextIds: ["ab24-t1", "ab24-t2"],
  });
  await env.db.insert(rewriteDrafts).values({ attemptId: a.id, userId: u.id, unitId: UNIT, questionId: Q, phase1Draft: "draft", phase2Draft: "", pickedTextIds: ["ab24-t1"] });
  return u;
}
const count = async (table: typeof unseenPhases | typeof rewriteDrafts | typeof attempts | typeof results, userId: string) =>
  (await env.db.select().from(table).where(eq(table.userId, userId))).length;
const TABLES = [unseenPhases, rewriteDrafts, attempts, results] as const;

describe("comparative rows are deleted with the student", () => {
  it("deleteStudentByEmail removes phases (with the pick), drafts (with the pick), attempts and results, and only that student's", async () => {
    env = await setupTestEnv();
    const ann = await withComparativeData("ann@example.com", "g-ann");
    const bob = await withComparativeData("bob@example.com", "g-bob");
    const res = await deleteStudentByEmail(env.db, "ann@example.com");
    expect(res.found).toBe(true);
    for (const t of TABLES) expect(await count(t, ann.id)).toBe(0);
    for (const t of TABLES) expect(await count(t, bob.id)).toBe(1);
    expect((await env.db.select().from(unseenPhases).where(eq(unseenPhases.userId, bob.id)))[0].pickedTextIds).toEqual(["ab24-t1", "ab24-t2"]);
  });

  it("the retention job (2 years inactive) removes them too", async () => {
    env = await setupTestEnv();
    const old = await withComparativeData("old@example.com", "g-old");
    const fresh = await withComparativeData("fresh@example.com", "g-fresh");
    await env.db.execute(sql`update users set created_at = now() - interval '3 years', last_sign_in_at = now() - interval '3 years', last_answer_at = now() - interval '3 years' where id = ${old.id}`);
    const out = await runRetention(env.db);
    expect(out.deletedStudents).toBe(1);
    for (const t of TABLES) expect(await count(t, old.id)).toBe(0);
    for (const t of TABLES) expect(await count(t, fresh.id)).toBe(1);
    expect(await env.db.select().from(users).where(eq(users.id, old.id))).toHaveLength(0);
  });
});
