import "server-only";

import { eq, sql } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import { users } from "@/lib/db/schema";

/**
 * Create the student on first sign-in; on later sign-ins refresh name, email and
 * last_sign_in_at only. `created_at` is never touched after the first insert.
 * Returns the internal user id.
 */
export async function upsertUserOnSignIn(
  db: Db,
  profile: { sub: string; name: string; email: string },
): Promise<string> {
  const [row] = await db
    .insert(users)
    .values({ googleSub: profile.sub, name: profile.name, email: profile.email })
    .onConflictDoUpdate({
      target: users.googleSub,
      set: { name: profile.name, email: profile.email, lastSignInAt: sql`now()` },
    })
    .returning({ id: users.id });
  return row.id;
}

/** True if a student row with this id still exists (a deleted student's session must stop working). */
export async function userExists(db: Db, id: string): Promise<boolean> {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  return rows.length > 0;
}

export async function getUser(db: Db, id: string) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

/** A student found by email, with the size of what deleting them would remove. */
export interface StudentSummary {
  id: string;
  name: string;
  email: string;
  attempts: number;
  results: number;
}

// Explicit "users"."id": drizzle drops the table qualifier in a single-table select, and an
// unqualified id inside these sub-selects would bind to attempts.id / results.id instead.
const userId = sql.raw('"users"."id"');

const summaryColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  attempts: sql<number>`(select count(*)::int from attempts a where a.user_id = ${userId})`,
  results: sql<number>`(select count(*)::int from results r where r.user_id = ${userId})`,
};

/** Students with this email (case-insensitive), with counts of their attempts and results. */
export async function findUsersByEmail(db: Db, email: string): Promise<StudentSummary[]> {
  return db
    .select(summaryColumns)
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email.trim()})`);
}

/**
 * Delete every student with this email (case-insensitive). Attempts, results and
 * daily-usage rows go with them (cascade). Returns what was removed.
 */
export async function deleteUsersByEmail(db: Db, email: string): Promise<StudentSummary[]> {
  const found = await findUsersByEmail(db, email);
  if (found.length === 0) return [];
  await db.delete(users).where(sql`${users.id} in (${sql.join(found.map((f) => sql`${f.id}::uuid`), sql`, `)})`);
  return found;
}
