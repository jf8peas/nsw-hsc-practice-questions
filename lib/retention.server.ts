import "server-only";

import { sql } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import { dailyAiUsage, users } from "@/lib/db/schema";
import { deleteUsersByEmail } from "@/lib/db/queries/users.server";

/** How long a student's data is kept after their last activity (Principle II: 2 years). */
export const RETENTION_INTERVAL = "2 years";

/** `daily_ai_usage` rows older than this many days are no longer needed. */
export const USAGE_RETENTION_DAYS = 7;

export interface RetentionResult {
  deletedStudents: number;
  prunedUsageRows: number;
}

/**
 * Delete every student whose last activity is more than 2 years old, with all
 * their attempts, results and usage rows (cascade), and prune old daily-usage
 * rows. Last activity is the later of last answer and last sign-in, or the
 * account creation time if neither exists (Postgres `greatest` ignores NULLs).
 * A student exactly 2 years inactive is kept; one second older is deleted.
 * `now` is injectable so the boundary is testable.
 */
export async function runRetention(db: Db, now: Date = new Date()): Promise<RetentionResult> {
  const nowTs = sql`${now.toISOString()}::timestamptz`;

  const pruned = await db
    .delete(dailyAiUsage)
    .where(
      sql`${dailyAiUsage.sydneyDate} < ((${nowTs} at time zone 'Australia/Sydney')::date - ${USAGE_RETENTION_DAYS}::int)`,
    )
    .returning({ userId: dailyAiUsage.userId });

  const deleted = await db
    .delete(users)
    .where(
      sql`greatest(${users.lastAnswerAt}, ${users.lastSignInAt}, ${users.createdAt}) < ${nowTs} - interval '2 years'`,
    )
    .returning({ id: users.id });

  return { deletedStudents: deleted.length, prunedUsageRows: pruned.length };
}

/** What the delete-student command reports for each matching student. */
export interface DeletedStudent {
  id: string;
  name: string;
  email: string;
  attempts: number;
  results: number;
}

export type DeleteStudentResult =
  | { found: false }
  | { found: true; deleted: DeletedStudent[] };

/**
 * Immediately delete a student (and everything of theirs) by email,
 * case-insensitively. Reports what was removed, or that nothing was found.
 */
export async function deleteStudentByEmail(db: Db, email: string): Promise<DeleteStudentResult> {
  const deleted = await deleteUsersByEmail(db, email);
  return deleted.length === 0 ? { found: false } : { found: true, deleted };
}
