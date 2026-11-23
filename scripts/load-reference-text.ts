// Loads the gitignored local copy of the prescribed play into the server-only `reference_texts` table
// (spec 011, constitution Principles I and V). Run for local, Preview and Production databases:
//
//   npm run reference-text:load -- --id away
//
// Reads ONLY resources/english-unseen/away-by-michael-gow.txt, requires non-empty content with the first-act marker,
// upserts by id with its SHA-256 and prints just the id, hash and byte count. It never prints any of the text, and
// the text is never committed or served to a browser.

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { referenceTexts } from "../lib/db/schema";

const SOURCES: Record<string, string> = {
  away: path.join("resources", "english-unseen", "away-by-michael-gow.txt"),
};

async function main() {
  loadEnvConfig(process.cwd());
  const args = process.argv.slice(2);
  const at = args.indexOf("--id");
  const id = at >= 0 ? args[at + 1] : "away";
  const source = SOURCES[id];
  if (!source) {
    console.error(`✗ Unknown reference text id "${id}". Known: ${Object.keys(SOURCES).join(", ")}`);
    process.exit(1);
  }
  const file = path.resolve(process.cwd(), source);
  if (!existsSync(file)) {
    console.error(`✗ ${source} is missing. It is gitignored: put your local copy there.`);
    process.exit(1);
  }
  const content = readFileSync(file, "utf8");
  if (!content.trim()) {
    console.error(`✗ ${source} is empty.`);
    process.exit(1);
  }
  if (id === "away" && !content.includes("ACT ONE")) {
    console.error(`✗ ${source} has no "ACT ONE" marker; refusing to load an unexpected file.`);
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DATABASE_URL is not set (put it in .env.local or the environment).");
    process.exit(1);
  }
  const hash = createHash("sha256").update(content, "utf8").digest("hex");
  const db = drizzle({ client: neon(url) });
  await db
    .insert(referenceTexts)
    .values({ id, content, contentHash: hash })
    .onConflictDoUpdate({ target: referenceTexts.id, set: { content, contentHash: hash, loadedAt: new Date() } });
  console.log(`✓ Loaded reference text: id=${id} hash=${hash} bytes=${Buffer.byteLength(content, "utf8")}`);
}

main().catch((error) => {
  console.error("✗ Loading the reference text failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
