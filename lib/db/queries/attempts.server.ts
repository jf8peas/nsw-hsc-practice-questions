import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import { attempts, type Attempt } from "@/lib/db/schema";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && UUID.test(value);

/** An attempt id that already exists belongs to a different student. */
export class AttemptOwnerMismatchError extends Error {
  constructor() {
    super("attempt id belongs to another user");
    this.name = "AttemptOwnerMismatchError";
  }
}

export interface NewAttempt {
  id?: string;
  userId: string;
  unitId: string;
  questionIds: string[];
  mcOptionOrder: Record<string, number[]>;
  startedAt?: Date;
}

export async function createAttempt(db: Db, input: NewAttempt): Promise<Attempt> {
  const [row] = await db
    .insert(attempts)
    .values({
      ...(input.id ? { id: input.id } : {}),
      userId: input.userId,
      unitId: input.unitId,
      questionIds: input.questionIds,
      mcOptionOrder: input.mcOptionOrder,
      ...(input.startedAt ? { startedAt: input.startedAt } : {}),
    })
    .returning();
  return row;
}

/**
 * Make sure the attempt row exists. An attempt started while the database was
 * down has no row yet; the grade, self-mark and retry routes create it from the
 * signed attempt fields before saving a result. Throws if the id already
 * belongs to another student.
 */
export async function ensureAttempt(
  db: Db,
  input: Required<Pick<NewAttempt, "id">> & NewAttempt,
): Promise<void> {
  await db
    .insert(attempts)
    .values({
      id: input.id,
      userId: input.userId,
      unitId: input.unitId,
      questionIds: input.questionIds,
      mcOptionOrder: input.mcOptionOrder,
      ...(input.startedAt ? { startedAt: input.startedAt } : {}),
    })
    .onConflictDoNothing({ target: attempts.id });
  const [row] = await db
    .select({ userId: attempts.userId })
    .from(attempts)
    .where(eq(attempts.id, input.id))
    .limit(1);
  if (!row || row.userId !== input.userId) throw new AttemptOwnerMismatchError();
}

/** The attempt, only if it belongs to `userId`. */
export async function getAttemptForUser(
  db: Db,
  userId: string,
  attemptId: string,
): Promise<Attempt | null> {
  if (!isUuid(attemptId)) return null;
  const rows = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Sets completed_at once; never clears it. Returns true if this call completed it. */
export async function markAttemptCompleted(db: Db, userId: string, attemptId: string): Promise<boolean> {
  const rows = await db
    .update(attempts)
    .set({ completedAt: new Date() })
    .where(and(eq(attempts.id, attemptId), eq(attempts.userId, userId), isNull(attempts.completedAt)))
    .returning({ id: attempts.id });
  return rows.length > 0;
}

/**
 * Start (or rejoin) the one attempt for a part of a sequential unit (spec 007, research R1). The
 * partial unique index `attempts_paragraph_part_unique` makes a second insert for the same
 * student and first question id conflict, so two tabs starting at once end on the same attempt.
 */
export async function createSequentialAttempt(
  db: Db,
  input: { id: string; userId: string; unitId: string; questionId: string },
): Promise<{ attempt: Attempt; created: boolean }> {
  const inserted = await db
    .insert(attempts)
    .values({
      id: input.id,
      userId: input.userId,
      unitId: input.unitId,
      questionIds: [input.questionId],
      mcOptionOrder: {},
    })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return { attempt: inserted[0], created: true };
  const existing = await db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.userId, input.userId),
        eq(attempts.unitId, input.unitId),
        sql`${attempts.questionIds}[1] = ${input.questionId}`,
      ),
    )
    .orderBy(desc(attempts.startedAt))
    .limit(1);
  if (!existing[0]) throw new Error("sequential attempt vanished after a conflict");
  return { attempt: existing[0], created: false };
}

/** The student's most recent unfinished attempt at a unit, if any. */
export async function getLatestIncompleteAttempt(
  db: Db,
  userId: string,
  unitId: string,
): Promise<Attempt | null> {
  const rows = await db
    .select()
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.unitId, unitId), isNull(attempts.completedAt)))
    .orderBy(desc(attempts.startedAt))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Start (or rejoin) the student's one OPEN attempt in the unseen-text unit (spec 008, research R8).
 * The question was drawn at random, so two tabs can draw different questions; the partial unique
 * index `attempts_unseen_incomplete_unique` (one open attempt per student in this unit) makes the
 * second insert conflict, and both tabs end on the first tab's attempt.
 */
export async function createUnseenAttempt(
  db: Db,
  input: { id: string; userId: string; unitId: string; questionId: string },
): Promise<{ attempt: Attempt; created: boolean }> {
  const inserted = await db
    .insert(attempts)
    .values({
      id: input.id,
      userId: input.userId,
      unitId: input.unitId,
      questionIds: [input.questionId],
      mcOptionOrder: {},
    })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return { attempt: inserted[0], created: true };
  const existing = await getLatestIncompleteAttempt(db, input.userId, input.unitId);
  if (!existing) throw new Error("unseen attempt vanished after a conflict");
  return { attempt: existing, created: false };
}

/**
 * Start (or rejoin) the student's one OPEN attempt in the Economics essay-writing unit (spec 010,
 * research R10). The essay is chosen by the student; the partial unique index
 * `attempts_essay_incomplete_unique` makes a second insert conflict, so two tabs starting at once end
 * on the same attempt. The caller checks whether the open attempt is for the essay it wanted.
 */
export async function createEssayAttempt(
  db: Db,
  input: { id: string; userId: string; unitId: string; questionId: string },
): Promise<{ attempt: Attempt; created: boolean }> {
  const inserted = await db
    .insert(attempts)
    .values({
      id: input.id,
      userId: input.userId,
      unitId: input.unitId,
      questionIds: [input.questionId],
      mcOptionOrder: {},
    })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return { attempt: inserted[0], created: true };
  const existing = await getLatestIncompleteAttempt(db, input.userId, input.unitId);
  if (!existing) throw new Error("essay attempt vanished after a conflict");
  return { attempt: existing, created: false };
}

/**
 * Start (or rejoin) the student's one OPEN attempt in the English essay-writing unit (spec 011). Same shape as the
 * Economics function and its own partial unique index (`attempts_english_essay_incomplete_unique`): a racing start
 * resumes the winning row. The caller checks whether the open attempt is for the essay it wanted.
 */
export async function createEnglishEssayAttempt(
  db: Db,
  input: { id: string; userId: string; unitId: string; questionId: string },
): Promise<{ attempt: Attempt; created: boolean }> {
  return createEssayAttempt(db, input);
}
