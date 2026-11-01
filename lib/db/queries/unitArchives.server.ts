import "server-only";

import { and, eq } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import { unitArchives } from "@/lib/db/schema";

import { load, type Loaded } from "./history.server";

// ---- pure queries (take the Db and the SESSION user's id, never a client id) --

/** The unit ids this student has archived off the home page. */
export async function archivedUnitIds(db: Db, userId: string): Promise<string[]> {
  const rows = await db
    .select({ unitId: unitArchives.unitId })
    .from(unitArchives)
    .where(eq(unitArchives.userId, userId));
  return rows.map((r) => r.unitId);
}

/** Archive a unit for this student. Idempotent: archiving twice is a no-op. */
export async function archiveUnit(db: Db, userId: string, unitId: string): Promise<void> {
  await db.insert(unitArchives).values({ userId, unitId }).onConflictDoNothing();
}

/** Unarchive a unit for this student. Idempotent: unarchiving twice is a no-op. */
export async function unarchiveUnit(db: Db, userId: string, unitId: string): Promise<void> {
  await db
    .delete(unitArchives)
    .where(and(eq(unitArchives.userId, userId), eq(unitArchives.unitId, unitId)));
}

// ---- loaders for pages: never throw for an outage ----------------------------

/** Like the other page loaders this never throws for an outage: it reports `unavailable`. */
export const loadArchivedUnitIds = (userId: string): Promise<Loaded<string[]>> =>
  load((db) => archivedUnitIds(db, userId));
