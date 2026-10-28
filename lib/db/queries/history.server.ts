import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { getQuestion } from "@/content";
import { finalizeIfComplete } from "@/lib/attempts/complete.server";
import { DbUnavailableError, dbCall, type Db } from "@/lib/db/index.server";
import { attempts, results } from "@/lib/db/schema";
import { attemptPercent, bestLatest, trend, type Trend } from "@/lib/stats";

import { getAttemptForUser } from "./attempts.server";
import { getAnsweredMarks } from "./results.server";

/** What a history loader returns: data, or "unavailable" when the database cannot be reached. */
export type Loaded<T> = { status: "ok"; data: T } | { status: "unavailable" };

/** History pages may wait a little longer than the marking path (they are not latency critical). */
export const HISTORY_TIMEOUT_MS = 2500;

export interface AttemptSummary {
  id: string;
  unitId: string;
  startedAt: Date;
  completedAt: Date | null;
  marks: number;
  max: number;
  /** Results saved so far. */
  answered: number;
  /** Questions drawn. */
  total: number;
  /** Rounded percentage of the marks available for the answers given. */
  percent: number;
}

export interface Resume {
  attemptId: string;
  /** Questions still to answer (retired ones skipped). */
  remainingIds: string[];
  answered: number;
  /** Drawn questions that still exist. */
  total: number;
}

export interface UnitHistory {
  attempts: AttemptSummary[];
  best: number | null;
  latest: number | null;
  completed: number;
  resume: Resume | null;
}

export interface UnitProgress {
  unitId: string;
  attemptCount: number;
  completedCount: number;
  latest: number | null;
  best: number | null;
  trend: Trend;
  /** The three most recent attempts (newest first). */
  recent: AttemptSummary[];
}

export interface AttemptItem {
  questionId: string;
  /** The question no longer exists in the unit. */
  retired: boolean;
  answered: boolean;
  answer: string | null;
  marks: number | null;
  max: number | null;
  gradedBy: string | null;
  feedback: string | null;
  hits: string[] | null;
  misses: string[] | null;
}

export interface AttemptDetail {
  attempt: AttemptSummary;
  items: AttemptItem[];
}

// ---- pure queries (take the Db and the SESSION user's id, never a client id) --

/** The student's attempts (that have at least one saved answer), newest first. */
async function summaries(db: Db, userId: string, unitId?: string): Promise<AttemptSummary[]> {
  const rows = await db
    .select({
      id: attempts.id,
      unitId: attempts.unitId,
      startedAt: attempts.startedAt,
      completedAt: attempts.completedAt,
      total: sql<number>`cardinality(${attempts.questionIds})::int`,
      marks: sql<number>`coalesce(sum(${results.marksAwarded}), 0)::int`,
      max: sql<number>`coalesce(sum(${results.maxMarks}), 0)::int`,
      answered: sql<number>`count(${results.id})::int`,
    })
    .from(attempts)
    .leftJoin(results, and(eq(results.attemptId, attempts.id), eq(results.userId, attempts.userId)))
    .where(and(eq(attempts.userId, userId), unitId ? eq(attempts.unitId, unitId) : undefined))
    .groupBy(attempts.id)
    .having(sql`count(${results.id}) > 0`)
    .orderBy(desc(attempts.startedAt));
  return rows.map((r) => ({
    ...r,
    percent: Math.round(attemptPercent(r.marks, r.max)),
  }));
}

/**
 * A unit's history for this student, plus the attempt (if any) they can continue:
 * the latest unfinished attempt with at least one answer. An attempt whose
 * remaining questions have all been retired is completed here, not offered.
 */
export async function unitHistory(db: Db, userId: string, unitId: string): Promise<UnitHistory> {
  let list = await summaries(db, userId, unitId);

  let resume: Resume | null = null;
  for (let guard = 0; guard < 5; guard++) {
    const candidate = list.find((a) => a.completedAt === null);
    if (!candidate) break;
    const row = await getAttemptForUser(db, userId, candidate.id);
    if (!row) break;
    const { completed } = await finalizeIfComplete(db, row);
    if (completed) {
      list = await summaries(db, userId, unitId);
      continue;
    }
    const answeredIds = Object.keys(await getAnsweredMarks(db, userId, row.id));
    const existing = row.questionIds.filter((id) => getQuestion(id) !== undefined);
    resume = {
      attemptId: row.id,
      remainingIds: existing.filter((id) => !answeredIds.includes(id)),
      answered: existing.filter((id) => answeredIds.includes(id)).length,
      total: existing.length,
    };
    break;
  }

  const stats = bestLatest(list);
  return { attempts: list, ...stats, resume };
}

/** Per-unit summary across everything the student has attempted. */
export async function progressSummary(db: Db, userId: string): Promise<UnitProgress[]> {
  const list = await summaries(db, userId);
  const byUnit = new Map<string, AttemptSummary[]>();
  for (const a of list) byUnit.set(a.unitId, [...(byUnit.get(a.unitId) ?? []), a]);
  return [...byUnit.entries()].map(([unitId, items]) => {
    const stats = bestLatest(items);
    return {
      unitId,
      attemptCount: items.length,
      completedCount: stats.completed,
      latest: stats.latest,
      best: stats.best,
      trend: trend(items),
      recent: items.slice(0, 3), // already newest first
    };
  });
}

/** One attempt in full, only if it belongs to this student; otherwise null. */
export async function attemptDetail(
  db: Db,
  userId: string,
  attemptId: string,
): Promise<AttemptDetail | null> {
  const row = await getAttemptForUser(db, userId, attemptId);
  if (!row) return null;
  const rows = await db
    .select()
    .from(results)
    .where(and(eq(results.attemptId, row.id), eq(results.userId, userId)));
  const byQuestion = new Map(rows.map((r) => [r.questionId, r]));

  const marks = rows.reduce((s, r) => s + r.marksAwarded, 0);
  const max = rows.reduce((s, r) => s + r.maxMarks, 0);
  const items: AttemptItem[] = row.questionIds.map((questionId) => {
    const r = byQuestion.get(questionId);
    return {
      questionId,
      retired: getQuestion(questionId) === undefined,
      answered: r !== undefined,
      answer: r?.answer ?? null,
      marks: r?.marksAwarded ?? null,
      max: r?.maxMarks ?? null,
      gradedBy: r?.gradedBy ?? null,
      feedback: r?.feedback ?? null,
      hits: r?.rubricHits ?? null,
      misses: r?.rubricMisses ?? null,
    };
  });
  return {
    attempt: {
      id: row.id,
      unitId: row.unitId,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      marks,
      max,
      answered: rows.length,
      total: row.questionIds.length,
      percent: Math.round(attemptPercent(marks, max)),
    },
    items,
  };
}

// ---- loaders for pages: never throw for an outage ----------------------------

export async function load<T>(fn: (db: Db) => Promise<T>): Promise<Loaded<T>> {
  try {
    return { status: "ok", data: await dbCall(fn, HISTORY_TIMEOUT_MS) };
  } catch (error) {
    if (error instanceof DbUnavailableError) return { status: "unavailable" };
    throw error;
  }
}

export const loadUnitHistory = (userId: string, unitId: string) =>
  load((db) => unitHistory(db, userId, unitId));

export const loadProgress = (userId: string) => load((db) => progressSummary(db, userId));

export const loadAttemptDetail = (userId: string, attemptId: string) =>
  load((db) => attemptDetail(db, userId, attemptId));
