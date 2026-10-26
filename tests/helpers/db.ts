import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import type { Db } from "@/lib/db/index.server";
import * as schema from "@/lib/db/schema";

export interface TestDb {
  db: Db;
  pg: PGlite;
  close: () => Promise<void>;
}

/**
 * A fresh in-memory Postgres (PGlite) with every committed migration in
 * ./drizzle applied. This runs the same SQL production runs.
 */
export async function createTestDb(): Promise<TestDb> {
  const pg = new PGlite();
  const db = drizzle(pg, { schema });
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
  return { db: db as unknown as Db, pg, close: () => pg.close() };
}
