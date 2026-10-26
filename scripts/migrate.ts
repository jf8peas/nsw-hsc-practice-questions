// Apply the committed SQL migrations in ./drizzle to DATABASE_URL.
//
//   npm run db:migrate
//
// Runs locally, in CI, and from the `vercel-build` script — never at request
// time (constitution Principle VII). Reads DATABASE_URL from the environment
// or .env.local.

import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  loadEnvConfig(process.cwd());
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DATABASE_URL is not set (put it in .env.local or the environment).");
    process.exit(1);
  }
  const db = drizzle({ client: neon(url) });
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ Migrations are up to date.");
}

main().catch((error) => {
  console.error("✗ Migration failed:", error);
  process.exit(1);
});
