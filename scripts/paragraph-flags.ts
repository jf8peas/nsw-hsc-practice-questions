// Review flagged paragraph answers and turn reviewed ones into labelled test cases (spec 007
// FR-029 to FR-032). An offline teacher task: runs on your own machine, never at request time.
//
//   npm run paragraph-flags -- list
//   npm run paragraph-flags -- export 1 3        (the numbers `list` printed)
//
// `export` appends each chosen answer to resources/topic010/pilot-essays.json as an UNLABELLED
// "field" case (needsLabel: true). Edit its `fails` list to the correct label and clear needsLabel;
// then `python scripts/pilot-paragraph-marker.py --gate` reruns every case. Exported cases carry
// the student's WRITING only: no name, email, user id, attempt id or date. resources/ is gitignored.
// Reads DATABASE_URL from the environment or .env.local (constitution Principle VII).

import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { desc, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import type { Db } from "../lib/db/index.server";
import * as schema from "../lib/db/schema";
import type { ParagraphPhaseRow, ParagraphVerdicts } from "../lib/db/schema";
import { PARTS, partKeyOf } from "../lib/paragraph/parts";
import type { PartNo } from "../lib/types";

import { exportFieldCases, type FieldAnswer, type PilotFile } from "./paragraph-field-cases";

const PILOT = path.resolve(process.cwd(), "resources", "topic010", "pilot-essays.json"); // run from the repo root

/** The try that decided the recorded mark: the correction when it scored at least as well. */
export function decidingTry(row: ParagraphPhaseRow): { text: string; verdicts: ParagraphVerdicts; mark: number } {
  if (row.ending === "corrected" && row.phase2Text && row.phase2Verdicts && row.phase2Mark !== null && row.phase2Mark >= row.phase1Mark) {
    return { text: row.phase2Text, verdicts: row.phase2Verdicts, mark: row.phase2Mark };
  }
  return { text: row.phase1Text, verdicts: row.phase1Verdicts, mark: row.phase1Mark };
}

export function noteFor(verdicts: ParagraphVerdicts, promptVersion: string | null): string {
  const marks = (["a", "b", "c", "d"] as const).map((k) => `(${k}) ${verdicts[k].met ? "met" : "not met"}`).join(", ");
  return `flagged by a student. Marker: ${marks}${promptVersion ? `; prompt ${promptVersion}` : ""}. Label what the criteria SHOULD be.`;
}

async function listFlagged(db: Db): Promise<ParagraphPhaseRow[]> {
  return db.select().from(schema.paragraphPhases).where(isNotNull(schema.paragraphPhases.flaggedAt)).orderBy(desc(schema.paragraphPhases.flaggedAt));
}

function describeRow(i: number, row: ParagraphPhaseRow): string {
  const m = /\.e(\d{2})p([1-5])$/.exec(row.questionId);
  const part = m ? PARTS[partKeyOf(Number(m[2]) as PartNo)].name : row.questionId;
  const t = decidingTry(row);
  const crit = (["a", "b", "c", "d"] as const)
    .map((k) => `    (${k}) ${t.verdicts[k].met ? "met    " : "NOT MET"}  ${t.verdicts[k].reason}`)
    .join("\n");
  return `#${i + 1}  essay ${m ? Number(m[1]) : "?"} · ${part} · marker ${t.mark}/4 · recorded ${row.recordedMark}/4\n${crit}\n    text: ${t.text}\n`;
}

async function main(): Promise<number> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd !== "list" && cmd !== "export") {
    console.error("Usage: npm run paragraph-flags -- list | export <number> [<number>...]");
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
    return { questionId: row.questionId, text: t.text, note: noteFor(t.verdicts, row.phase1PromptVersion) };
  });
  const file = JSON.parse(fs.readFileSync(PILOT, "utf8")) as PilotFile;
  const out = exportFieldCases(file, answers);
  fs.writeFileSync(PILOT, JSON.stringify(out.file, null, 2) + "\n", "utf8");
  console.log(`Exported ${out.added} case(s) (${out.skipped} skipped as duplicates) to resources/topic010/pilot-essays.json.`);
  console.log("Now label each: edit `fails` to the criteria that should be NOT met and clear `needsLabel`.");
  return 0;
}

if (process.argv[1] && /paragraph-flags\.ts$/.test(process.argv[1])) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error("✗ Failed:", error);
      process.exitCode = 2;
    },
  );
}
