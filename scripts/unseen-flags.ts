// Review flagged unseen-text answers and turn reviewed ones into labelled test cases (spec 008 FR-036,
// research R11). An offline teacher task: runs on your own machine, never at request time.
//
//   npm run unseen-flags -- list
//   npm run unseen-flags -- export 1 3        (the numbers `list` printed)
//
// `export` appends each chosen answer to resources/english-unseen/pilot-questions.json as an
// UNLABELLED "field" case (needsLabel: true) under a field question that carries the question's context
// and the model answer as its anchor. Edit its expectMark and expectMissed, clear needsLabel, then
// `python scripts/pilot-unseen-marker.py --gate` reruns every case. Exported cases carry the student's
// WRITING only: no name, email, user id, attempt id or date. resources/ is gitignored.
// Reads DATABASE_URL from the environment or .env.local (constitution Principle VII).

import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { desc, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import type { Db } from "../lib/db/index.server";
import * as schema from "../lib/db/schema";
import type { UnseenPhaseRow } from "../lib/db/schema";
import { SKILL_IDS } from "../lib/unseen/skills";

import { decidingTry, exportFieldCases, noteFor, type FieldAnswer, type PilotFile } from "./unseen-field-cases";

const PILOT = path.resolve(process.cwd(), "resources", "english-unseen", "pilot-questions.json"); // run from the repo root

async function listFlagged(db: Db): Promise<UnseenPhaseRow[]> {
  return db.select().from(schema.unseenPhases).where(isNotNull(schema.unseenPhases.flaggedAt)).orderBy(desc(schema.unseenPhases.flaggedAt));
}

function describeRow(i: number, row: UnseenPhaseRow): string {
  const t = decidingTry(row);
  const slug = row.questionId.split(".").pop();
  const skills = SKILL_IDS.map((id) => `    ${t.verdicts[id]?.met ? "met    " : "MISSED "}  ${id}: ${t.verdicts[id]?.reason ?? ""}`).join("\n");
  return `#${i + 1}  ${slug} · marker ${t.mark}/${row.maxMarks} · recorded ${row.recordedMark}/${row.maxMarks}\n${skills}\n    text: ${t.text}\n`;
}

async function main(): Promise<number> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd !== "list" && cmd !== "export") {
    console.error("Usage: npm run unseen-flags -- list | export <number> [<number>...]");
    return 2;
  }
  loadEnvConfig(process.cwd());
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DATABASE_URL is not set (put it in .env.local or the environment).");
    return 2;
  }
  const db = drizzle({ client: neon(url), schema }) as unknown as Db;
  const rows = await listFlagged(db);

  if (cmd === "list") {
    if (rows.length === 0) console.log("No flagged answers.");
    rows.forEach((r, i) => console.log(describeRow(i, r)));
    return 0;
  }

  const picks = rest.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= rows.length);
  if (picks.length === 0) {
    console.error("Give the number(s) shown by `list`, e.g. export 1 3");
    return 2;
  }
  const answers: FieldAnswer[] = picks.map((n) => {
    const row = rows[n - 1];
    const t = decidingTry(row);
    return { questionId: row.questionId, text: t.text, note: noteFor(t.verdicts, t.mark, row.maxMarks, row.try1PromptVersion) };
  });
  const file = JSON.parse(fs.readFileSync(PILOT, "utf8")) as PilotFile;
  const out = exportFieldCases(file, answers);
  fs.writeFileSync(PILOT, JSON.stringify(out.file, null, 2) + "\n", "utf8");
  console.log(`Exported ${out.added} case(s) (${out.skipped} skipped as duplicates) to resources/english-unseen/pilot-questions.json.`);
  console.log("Now label each: set expectMark and expectMissed, and clear needsLabel.");
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    console.error("✗ Failed:", error);
    process.exitCode = 2;
  },
);
