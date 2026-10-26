import fs from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { attempts, dailyAiUsage, results, users } from "@/lib/db/schema";
import { deleteStudentByEmail } from "@/lib/retention.server";
import { findUsersByEmail } from "@/lib/db/queries/users.server";

import { asSessionUser, setupTestEnv, type TestEnv } from "./helpers/env";
import { seedAttempt, seedResult, seedUsage, seedUser } from "./helpers/fixtures";

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

async function withData() {
  env = await setupTestEnv();
  const ann = await seedUser(env.db, { name: "Ann", email: "Ann.Lee@Example.com", googleSub: "google-ann" });
  const bob = await seedUser(env.db, { name: "Bob", email: "bob@example.com" });
  const annAttempt = await seedAttempt(env.db, ann.id);
  await seedResult(env.db, { attemptId: annAttempt.id, userId: ann.id });
  await seedResult(env.db, { attemptId: annAttempt.id, userId: ann.id });
  await seedUsage(env.db, ann.id, "2026-10-26", 4);
  const bobAttempt = await seedAttempt(env.db, bob.id);
  await seedResult(env.db, { attemptId: bobAttempt.id, userId: bob.id });
  return { ann, bob };
}

describe("deleteStudentByEmail (FR-026)", () => {
  it("matches the email case-insensitively and reports what it removed", async () => {
    const { ann } = await withData();
    const res = await deleteStudentByEmail(env.db, "ann.lee@EXAMPLE.com  ");
    expect(res).toEqual({
      found: true,
      deleted: [{ id: ann.id, name: "Ann", email: "Ann.Lee@Example.com", attempts: 1, results: 2 }],
    });
  });

  it("findUsersByEmail shows the counts before anything is deleted", async () => {
    const { ann } = await withData();
    const found = await findUsersByEmail(env.db, "ann.lee@example.com");
    expect(found).toEqual([{ id: ann.id, name: "Ann", email: "Ann.Lee@Example.com", attempts: 1, results: 2 }]);
    expect(await env.db.select().from(users).where(eq(users.id, ann.id))).toHaveLength(1);
  });

  it("deletes the student and everything of theirs, and nobody else's", async () => {
    const { ann, bob } = await withData();
    await deleteStudentByEmail(env.db, "ann.lee@example.com");
    const left = (t: typeof attempts | typeof results | typeof dailyAiUsage, id: string) =>
      env.db.select().from(t).where(eq(t.userId, id));
    expect(await left(attempts, ann.id)).toHaveLength(0);
    expect(await left(results, ann.id)).toHaveLength(0);
    expect(await left(dailyAiUsage, ann.id)).toHaveLength(0);
    expect(await env.db.select().from(users).where(eq(users.id, ann.id))).toHaveLength(0);
    expect(await left(attempts, bob.id)).toHaveLength(1);
    expect(await left(results, bob.id)).toHaveLength(1);
  });

  it("an unknown email reports not-found and changes nothing", async () => {
    await withData();
    const before = await env.db.select().from(users);
    expect(await deleteStudentByEmail(env.db, "nobody@example.com")).toEqual({ found: false });
    expect(await env.db.select().from(users)).toHaveLength(before.length);
    expect(await env.db.select().from(results)).toHaveLength(3);
  });
});

describe("after deletion (FR-027, SC-008)", () => {
  it("the old session stops working: requireUser returns null (a 401, not a degraded 200)", async () => {
    const { ann } = await withData();
    env.signedInAs(asSessionUser(ann));
    const session = await import("@/lib/session.server");
    expect(await session.requireUserFrom(asSessionUser(ann))).not.toBeNull();
    await deleteStudentByEmail(env.db, ann.email);
    expect(await session.requireUserFrom(asSessionUser(ann))).toBeNull();
    expect(await session.resolveIdentity(asSessionUser(ann))).toEqual({ kind: "none", reason: "student_missing" });
  });

  it("signing in again with the same Google account creates a new, empty student", async () => {
    const { ann } = await withData();
    await deleteStudentByEmail(env.db, ann.email);
    const callbacks = await import("@/lib/auth.callbacks.server");
    const token = await callbacks.jwtCallback({
      token: {},
      user: { id: "google-ann", name: "Ann", email: "Ann.Lee@Example.com" },
      account: { provider: "google", providerAccountId: "google-ann" },
    });
    expect(token.uid).toBeTruthy();
    expect(token.uid).not.toBe(ann.id);
    const mine = await env.db.select().from(attempts).where(eq(attempts.userId, token.uid as string));
    expect(mine).toHaveLength(0);
  });

  it("the student is absent from every query in docs/teacher-queries.sql", async () => {
    const { ann } = await withData();
    await deleteStudentByEmail(env.db, ann.email);
    const file = fs.readFileSync(path.resolve(__dirname, "../docs/teacher-queries.sql"), "utf8");
    const parts = file.split(/^-- QUERY: (\w+)\s*$/m);
    expect(parts.length).toBeGreaterThan(6);
    for (let i = 1; i < parts.length; i += 2) {
      const sql = parts[i + 1].trim().replace("'student@example.com'::text", `'${ann.email}'::text`);
      const rows = (await env.testDb.pg.query(sql)).rows;
      const text = JSON.stringify(rows);
      expect(text, parts[i]).not.toContain(ann.email);
      expect(text, parts[i]).not.toContain(ann.id);
    }
  });
});
