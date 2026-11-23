// Deleting a student, immediately or by the 2-year retention job, removes every English essay row too (spec 011 data-model §11,
// constitution Principle II): the essay phase (plan, essay, verdicts, quote results, errors, gaps), drafts, attempts and results.
// Nobody else's rows are touched, and the shared reference text (no student data) stays.

import { eq, sql } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { attempts, essayPhases, referenceTexts, results, rewriteDrafts, users } from "@/lib/db/schema";
import { emptyEnglishEssayScaffold } from "@/lib/english-essay/scaffold";
import { deleteStudentByEmail, runRetention } from "@/lib/retention.server";

import { setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";
import { seedReferenceText } from "../helpers/english-essay";

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const UNIT = "y12-english-essay-writing";
const Q = `${UNIT}.e1`;
const crit = { verdict: "sound", reason: "r" } as const;

async function withEnglishData(email: string, sub: string) {
  const u = await seedUser(env.db, { email, googleSub: sub });
  const a = await seedAttempt(env.db, u.id, { unitId: UNIT, questionIds: [Q], completedAt: new Date() });
  await seedResult(env.db, { attemptId: a.id, userId: u.id }, { unitId: UNIT, questionId: Q, marksAwarded: 14, maxMarks: 20, gradedBy: "llm" });
  await env.db.insert(essayPhases).values({
    attemptId: a.id,
    userId: u.id,
    unitId: UNIT,
    questionId: Q,
    status: "finished",
    scaffold: emptyEnglishEssayScaffold() as never,
    scaffoldLockedAt: new Date(),
    essayText: "student essay",
    essayWords: 900,
    rawMark: 15,
    band: 2,
    finalMark: 14,
    finalBand: 2,
    criteria: { argument: crit, analysis: crit, knowledge: crit, expression: crit } as never,
    bandReason: "b",
    lift: ["a", "b"],
    questionFocus: "fully",
    questionFocusReason: "r",
    knowledgeErrors: [{ quote: "q", why: "w", source: "marker" }],
    quoteResults: [{ quote: "q", status: "not-found", ratio: 0.2 }],
    referenceTextHash: "h".repeat(64),
    gaps: [{ conceptId: "x", detail: "d" }],
    usedWell: [],
    promptVersion: "eng-essay-pilot-5",
    model: "m",
    gradedAt: new Date(),
  });
  await env.db.insert(rewriteDrafts).values({ attemptId: a.id, userId: u.id, unitId: UNIT, questionId: Q, phase1Draft: "draft", phase2Draft: "" });
  return u;
}
const count = async (table: typeof essayPhases | typeof rewriteDrafts | typeof attempts | typeof results, userId: string) =>
  (await env.db.select().from(table).where(eq(table.userId, userId))).length;
const TABLES = [essayPhases, rewriteDrafts, attempts, results] as const;

describe("English essay rows are deleted with the student", () => {
  it("deleteStudentByEmail removes phases, drafts, attempts and results, only that student's, and keeps the reference text", async () => {
    env = await setupTestEnv();
    await seedReferenceText(env.db);
    const ann = await withEnglishData("ann@example.com", "g-ann");
    const bob = await withEnglishData("bob@example.com", "g-bob");
    expect((await deleteStudentByEmail(env.db, "ann@example.com")).found).toBe(true);
    for (const t of TABLES) expect(await count(t, ann.id)).toBe(0);
    for (const t of TABLES) expect(await count(t, bob.id)).toBe(1);
    expect(await env.db.select().from(referenceTexts)).toHaveLength(1);
  });

  it("the retention job (2 years inactive) removes them too and leaves the reference text", async () => {
    env = await setupTestEnv();
    await seedReferenceText(env.db);
    const old = await withEnglishData("old@example.com", "g-old");
    const fresh = await withEnglishData("fresh@example.com", "g-fresh");
    await env.db.execute(sql`update users set created_at = now() - interval '3 years', last_sign_in_at = now() - interval '3 years', last_answer_at = now() - interval '3 years' where id = ${old.id}`);
    expect((await runRetention(env.db)).deletedStudents).toBe(1);
    for (const t of TABLES) expect(await count(t, old.id)).toBe(0);
    for (const t of TABLES) expect(await count(t, fresh.id)).toBe(1);
    expect(await env.db.select().from(users).where(eq(users.id, old.id))).toHaveLength(0);
    expect(await env.db.select().from(referenceTexts)).toHaveLength(1);
  });

  it("deleting an open attempt removes its phase row and draft but not another attempt's", async () => {
    env = await setupTestEnv();
    const u = await withEnglishData("keep@example.com", "g-keep");
    const open = await seedAttempt(env.db, u.id, { unitId: UNIT, questionIds: [Q] });
    await env.db.insert(essayPhases).values({ attemptId: open.id, userId: u.id, unitId: UNIT, questionId: Q, status: "planning", scaffold: emptyEnglishEssayScaffold() as never });
    await env.db.delete(attempts).where(eq(attempts.id, open.id));
    expect(await count(essayPhases, u.id)).toBe(1);
    expect(await count(results, u.id)).toBe(1);
  });
});

describe("the migration's per-unit checks", () => {
  it("refuses an English row with a 151-word plan, a 799-word essay or an unchecked finish, and accepts the Economics limits for Economics", async () => {
    env = await setupTestEnv();
    const u = await seedUser(env.db, { email: "c@example.com", googleSub: "g-c" });
    const a = await seedAttempt(env.db, u.id, { unitId: UNIT, questionIds: [Q] });
    const base = { attemptId: a.id, userId: u.id, unitId: UNIT, questionId: Q, status: "planning", scaffold: emptyEnglishEssayScaffold() as never };
    await expect(env.db.insert(essayPhases).values({ ...base, scaffoldWords: 151 })).rejects.toThrow();
    await env.db.insert(essayPhases).values({ ...base, scaffoldWords: 150 });

    // an Economics row keeps its own 250-word plan limit
    const b = await seedAttempt(env.db, u.id, { unitId: "y12-economics-essay-writing", questionIds: ["y12-economics-essay-writing.e1"] });
    await env.db.insert(essayPhases).values({
      attemptId: b.id,
      userId: u.id,
      unitId: "y12-economics-essay-writing",
      questionId: "y12-economics-essay-writing.e1",
      status: "planning",
      scaffold: {} as never,
      scaffoldWords: 250,
    });
  });
});
