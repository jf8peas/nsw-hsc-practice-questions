// Approve a concept summary or picture that was held back (spec 002 FR-053; research R10).
//
//   npm run concept:approve -- --concept y11-economics-preliminary.c-demand --kind summary
//   npm run concept:approve -- --concept <id> --kind summary --bullets-file fixed.txt
//
// A version that fails the reviewer twice is held back and listed by the
// `flagged_concept_content` query in docs/teacher-queries.sql. Fix it there (edit
// summary_bullets or illustration_svg on that row), or pass --bullets-file (one bullet per
// line) to replace a summary's bullets from a file, then run this to make it live. A picture
// is checked against the SVG rules first. Running it again changes nothing.
//
// Runs only on your own machine, never at request time (constitution Principle VII). Reads
// DATABASE_URL from the environment or .env.local.

import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { approveConcept, parseBulletsFile } from "../lib/concepts/approve.server";
import type { Db } from "../lib/db/index.server";
import * as schema from "../lib/db/schema";

const USAGE =
  "Usage: npm run concept:approve -- --concept <conceptId> --kind <summary|illustration> [--bullets-file <path>]";

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const conceptId = option(args, "--concept");
  const kind = option(args, "--kind");
  const bulletsFile = option(args, "--bullets-file");
  if (!conceptId || (kind !== "summary" && kind !== "illustration") || (args.includes("--bullets-file") && !bulletsFile)) {
    console.error(USAGE);
    return 2;
  }

  loadEnvConfig(process.cwd());
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DATABASE_URL is not set (put it in .env.local or the environment).");
    return 2;
  }
  const db = drizzle({ client: neon(url), schema }) as unknown as Db;

  const result = await approveConcept(db, {
    conceptId,
    kind,
    ...(bulletsFile ? { bullets: parseBulletsFile(bulletsFile) } : {}),
  });
  const ok = result.status === "approved" || result.status === "already_live";
  (ok ? console.log : console.error)(`${ok ? "✓" : "✗"} ${result.message}`);
  return ok ? 0 : 1;
}

// Set the exit code and let the event loop drain (process.exit() while HTTP handles are
// still closing can abort on Windows).
main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error("✗ Failed:", error);
    process.exitCode = 2;
  },
);
