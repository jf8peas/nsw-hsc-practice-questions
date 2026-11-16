// Clear a student's UNFINISHED essays from the paragraph-writing unit (spec 007), e.g. after the
// essays they were working on were archived (17 Nov 2026: e01 Vietnam, e02 Bangladesh).
//
//   npm run clear-unfinished-essays -- student@example.com                  (dry run: shows the plan)
//   npm run clear-unfinished-essays -- student@example.com --yes            (clears)
//   npm run clear-unfinished-essays -- student@example.com --essays e01,e02 --yes
//
// An essay is UNFINISHED when the student has any work on it (a started part, a saved draft or a
// recorded mark) but fewer than all 5 parts recorded. Those parts are deleted: their attempt rows,
// and by cascade the results, phase rows (first tries, corrections, flags) and drafts. The tips
// those parts counted towards lose that evidence. A FINISHED essay (all 5 parts recorded) is kept
// and stays in the student's history. Without --yes nothing is changed.
//
// Runs only on your own machine, never at request time (constitution Principle VII). Reads
// DATABASE_URL from the environment or .env.local / .env.

import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { and, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { archivedHeaders } from "../content/archive/y12-economics-paragraph-writing/essays-archived";
import { ESSAYS } from "../content/units/y12-economics-paragraph-writing/questions";
import type { Db } from "../lib/db/index.server";
import * as schema from "../lib/db/schema";
import { attempts, results } from "../lib/db/schema";
import { findUsersByEmail } from "../lib/db/queries/users.server";

export const UNIT = "y12-economics-paragraph-writing";

export interface EssayPlan {
  essayId: string;
  economy: string;
  archived: boolean;
  /** Parts (1-5) with a recorded mark. */
  recordedParts: number[];
  /** Attempt rows for this essay's parts (one per part started). */
  attemptCount: number;
  status: "none" | "finished" | "unfinished";
}

const partIds = (essayId: string) => [1, 2, 3, 4, 5].map((p) => `${UNIT}.${essayId}p${p}`);
const firstQuestion = sql`${attempts.questionIds}[1]`;

function economyOf(essayId: string): { economy: string; archived: boolean } {
  const live = ESSAYS.find((e) => e.essayId === essayId);
  if (live) return { economy: live.economy, archived: false };
  const old = archivedHeaders.find((e) => e.essayId === essayId);
  return { economy: old?.economy ?? "unknown", archived: true };
}

/** What the student has on each essay. Reads only. */
export async function planClear(db: Db, userId: string, essayIds: string[]): Promise<EssayPlan[]> {
  const plans: EssayPlan[] = [];
  for (const essayId of essayIds) {
    const ids = partIds(essayId);
    const att = await db
      .select({ id: attempts.id })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.unitId, UNIT), inArray(firstQuestion, ids)));
    const res = await db
      .selectDistinct({ questionId: results.questionId })
      .from(results)
      .where(and(eq(results.userId, userId), eq(results.unitId, UNIT), inArray(results.questionId, ids)));
    const recordedParts = res.map((r) => Number(r.questionId.slice(-1))).sort((a, b) => a - b);
    const status = att.length === 0 && recordedParts.length === 0 ? "none" : recordedParts.length === 5 ? "finished" : "unfinished";
    plans.push({ essayId, ...economyOf(essayId), recordedParts, attemptCount: att.length, status });
  }
  return plans;
}

/** Deletes the unfinished essays in the plan. Returns the number of attempt rows removed. */
export async function clearUnfinished(db: Db, userId: string, plans: EssayPlan[]): Promise<number> {
  let removed = 0;
  for (const plan of plans.filter((p) => p.status === "unfinished")) {
    const ids = partIds(plan.essayId);
    // results, paragraph_phases and rewrite_drafts reference the attempt and cascade with it;
    // the results delete is a belt-and-braces no-op
    const gone = await db
      .delete(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.unitId, UNIT), inArray(firstQuestion, ids)))
      .returning({ id: attempts.id });
    await db.delete(results).where(and(eq(results.userId, userId), eq(results.unitId, UNIT), inArray(results.questionId, ids)));
    removed += gone.length;
  }
  return removed;
}

export function describePlan(p: EssayPlan): string {
  const label = `${p.essayId} ${p.economy}${p.archived ? " (archived)" : ""}`;
  if (p.status === "none") return `  ${label}: no work. Nothing to do.`;
  const parts = p.recordedParts.length ? `parts ${p.recordedParts.join(", ")} recorded` : "no part recorded";
  if (p.status === "finished") return `  ${label}: finished (all 5 parts recorded). Kept.`;
  return `  ${label}: UNFINISHED, ${parts} of 5, ${p.attemptCount} part(s) started. Will be cleared.`;
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const yes = args.includes("--yes");
  const essaysArg = args.find((a) => a.startsWith("--essays"));
  const essaysIdx = args.indexOf("--essays");
  const essaysValue = essaysArg?.includes("=") ? essaysArg.split("=")[1] : essaysIdx >= 0 ? args[essaysIdx + 1] : undefined;
  const essayIds = (essaysValue ? essaysValue.split(",") : archivedHeaders.map((h) => h.essayId)).map((s) => s.trim()).filter(Boolean);
  const email = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--essays")?.trim();
  if (!email || essayIds.some((e) => !/^e\d{2}$/.test(e))) {
    console.error("Usage: npm run clear-unfinished-essays -- <email> [--essays e01,e02] [--yes]");
    return 2;
  }

  loadEnvConfig(process.cwd());
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DATABASE_URL is not set (put it in .env.local, .env or the environment).");
    return 2;
  }
  const db = drizzle({ client: neon(url), schema }) as unknown as Db;

  const found = await findUsersByEmail(db, email);
  if (found.length !== 1) {
    console.log(found.length === 0 ? "No student found with that email. Nothing was changed." : "More than one student has that email. Nothing was changed.");
    return 1;
  }
  const student = found[0];
  const plans = await planClear(db, student.id, essayIds);
  console.log(`${student.name} <${student.email}>, essays ${essayIds.join(", ")}:`);
  for (const p of plans) console.log(describePlan(p));

  if (!plans.some((p) => p.status === "unfinished")) {
    console.log("No unfinished essays. Nothing was changed.");
    return 0;
  }
  if (!yes) {
    console.log("Dry run: nothing was changed. Re-run with --yes to clear the unfinished essays above.");
    return 0;
  }
  const removed = await clearUnfinished(db, student.id, plans);
  console.log(`✓ Cleared ${removed} part attempt(s) and their marks, phases and drafts.`);
  return 0;
}

if (process.argv[1] && /clear-unfinished-essays\.ts$/.test(process.argv[1])) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      console.error("✗ Failed:", error instanceof Error ? error.message : error);
      process.exit(1);
    },
  );
}
