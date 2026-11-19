// Re-mark a sample of real first-try unseen-text answers with a STRONGER model (spec 008 FR-037).
// An offline teacher task: runs on your own machine, never at request time.
//
//   REMARK_MODEL=<a model stronger than ENGLISH_ADV_GRADING_MODEL> npm run unseen-remark -- --sample 40
//   ... -- --sample 40 --export        (also add the disagreements to the pilot file, unlabelled)
//
// The sample is first tries marked at full marks or one below, half and half, so the middle-band
// leniency the pilot saw is checked, not only top marks. Disagreements where the stronger model gave
// FEWER marks (the app marked too high) come first, lower bands first. It calls OpenRouter directly
// with the same prompt the app builds, reads the database read-only, and NEVER reserves a slot or
// touches daily_ai_usage, so it never counts against a student's allowance. It sends only the writing
// to the same provider that marked it: no name, email or id. OPENROUTER_API_KEY, REMARK_MODEL and
// DATABASE_URL come from the environment or .env.local (constitution Principle VII).

import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { getEnglishAdvModel } from "../lib/config.server";
import type { Db } from "../lib/db/index.server";
import * as schema from "../lib/db/schema";
import { chatCompletion } from "../lib/openrouter.server";
import { MAX_TOKENS, buildUnseenMessages, parseUnseenReply } from "../lib/unseen/marker.server";

import { exportFieldCases, markerInputFor, type FieldAnswer, type PilotFile } from "./unseen-field-cases";
import { DEFAULT_SAMPLE, checkRemarkModels, compareMarks, orderDisagreements, pickSample, type Disagreement, type SampleRow } from "./unseen-remark-lib";

const PILOT = path.resolve(process.cwd(), "resources", "english-unseen", "pilot-questions.json"); // run from the repo root

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const sampleSize = Number(args[args.indexOf("--sample") + 1]) || DEFAULT_SAMPLE;
  const doExport = args.includes("--export");
  if (sampleSize < 1 || sampleSize > 200) {
    console.error("--sample must be between 1 and 200");
    return 2;
  }
  loadEnvConfig(process.cwd());
  const remarkModel = process.env.REMARK_MODEL?.trim();
  const gradingModel = getEnglishAdvModel();
  const modelProblem = checkRemarkModels(remarkModel, gradingModel);
  if (modelProblem || !remarkModel) {
    console.error(`✗ ${modelProblem}`);
    return 2;
  }
  if (!process.env.OPENROUTER_API_KEY || !process.env.DATABASE_URL) {
    console.error("✗ OPENROUTER_API_KEY and DATABASE_URL must be set (environment or .env.local).");
    return 2;
  }

  const db = drizzle({ client: neon(process.env.DATABASE_URL), schema }) as unknown as Db;
  const stored = await db.select().from(schema.unseenPhases);
  const rows: SampleRow[] = stored.map((r) => ({ questionId: r.questionId, maxMarks: r.maxMarks, mark: r.try1Mark, text: r.try1Text }));
  const sample = pickSample(rows, sampleSize);
  console.log(`Re-marking ${sample.length} of ${rows.length} first tries with ${remarkModel} (marker: ${gradingModel}) ...`);

  const found: Disagreement[] = [];
  let failed = 0;
  for (const row of sample) {
    let input;
    try {
      input = markerInputFor(row.questionId, row.text);
    } catch {
      failed++; // a question no longer in the bank
      continue;
    }
    const res = await chatCompletion({ model: remarkModel, messages: buildUnseenMessages(input), temperature: 0, maxTokens: MAX_TOKENS, timeoutMs: 60_000, json: true });
    const parsed = res.ok && res.finishReason !== "length" ? parseUnseenReply(res.content, row.maxMarks) : null;
    if (!parsed) {
      failed++;
      continue;
    }
    const diff = compareMarks(row, parsed.mark);
    if (diff) found.push(diff);
  }

  const ordered = orderDisagreements(found);
  console.log(`\n${ordered.length} disagreement(s) out of ${sample.length - failed} re-marked (${failed} failed or skipped).`);
  console.log(`\nMarked too high by the app (${ordered.filter((d) => d.tooHigh).length}), lower bands first:`);
  for (const d of ordered.filter((x) => x.tooHigh)) console.log(`  - ${d.row.questionId.split(".").pop()} ${d.row.mark}→${d.strongMark}/${d.row.maxMarks}: ${d.row.text.slice(0, 140)}…`);
  console.log(`\nMarked too low by the app (${ordered.filter((d) => !d.tooHigh).length}):`);
  for (const d of ordered.filter((x) => !x.tooHigh)) console.log(`  - ${d.row.questionId.split(".").pop()} ${d.row.mark}→${d.strongMark}/${d.row.maxMarks}: ${d.row.text.slice(0, 140)}…`);

  if (doExport && ordered.length > 0) {
    const answers: FieldAnswer[] = ordered.map((d) => ({ questionId: d.row.questionId, text: d.row.text, note: d.note }));
    const file = JSON.parse(fs.readFileSync(PILOT, "utf8")) as PilotFile;
    const out = exportFieldCases(file, answers);
    fs.writeFileSync(PILOT, JSON.stringify(out.file, null, 2) + "\n", "utf8");
    console.log(`\nExported ${out.added} unlabelled field case(s) to resources/english-unseen/pilot-questions.json (${out.skipped} skipped as duplicates). Label them, then run the gate.`);
  }
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
