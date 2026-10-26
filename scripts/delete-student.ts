// Delete one student, and everything of theirs, immediately (FR-026).
//
//   npm run delete-student -- student@example.com
//   npm run delete-student -- student@example.com --yes     (skip the prompt)
//
// Looks the student up by email (case-insensitive), shows what will be removed,
// asks you to type the email to confirm, then deletes. Their attempts, results
// and daily-usage rows go with them. If the email matches nobody it says so and
// changes nothing (exit code 1).
//
// Runs only on your own machine or in CI, never at request time (constitution
// Principle VII). Reads DATABASE_URL from the environment or .env.local.

import readline from "node:readline/promises";

import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import type { Db } from "../lib/db/index.server";
import * as schema from "../lib/db/schema";
import { findUsersByEmail } from "../lib/db/queries/users.server";
import { deleteStudentByEmail } from "../lib/retention.server";

async function confirm(email: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    console.error("✗ Not a terminal. Re-run with --yes to confirm the deletion.");
    return false;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const typed = await rl.question(`Type the email (${email}) to confirm deleting this student: `);
    return typed.trim().toLowerCase() === email.toLowerCase();
  } finally {
    rl.close();
  }
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const yes = args.includes("--yes");
  const email = args.find((a) => !a.startsWith("--"))?.trim();
  if (!email) {
    console.error("Usage: npm run delete-student -- <email> [--yes]");
    return 2;
  }

  loadEnvConfig(process.cwd());
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DATABASE_URL is not set (put it in .env.local or the environment).");
    return 2;
  }
  const db = drizzle({ client: neon(url), schema }) as unknown as Db;

  const found = await findUsersByEmail(db, email);
  if (found.length === 0) {
    console.log("No student found with that email. Nothing was changed.");
    return 1;
  }

  console.log("This will permanently delete:");
  for (const s of found) {
    console.log(`  ${s.name} <${s.email}>  (${s.attempts} attempts, ${s.results} results)`);
  }
  if (!yes && !(await confirm(email))) {
    console.log("Cancelled. Nothing was changed.");
    return 1;
  }

  const result = await deleteStudentByEmail(db, email);
  if (!result.found) {
    console.log("No student found with that email. Nothing was changed.");
    return 1;
  }
  for (const s of result.deleted) {
    console.log(`✓ Deleted ${s.name} <${s.email}>: ${s.attempts} attempts and ${s.results} results removed.`);
  }
  return 0;
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
