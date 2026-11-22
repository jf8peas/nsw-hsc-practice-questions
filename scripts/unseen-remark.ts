// Re-mark a sample of real first-try unseen-text answers with a STRONGER model (spec 008 FR-037).
// An offline teacher task: runs on your own machine, never at request time.
//
//   REMARK_MODEL=<a model stronger than ENGLISH_ADV_GRADING_MODEL> npm run unseen-remark -- --sample 40
//   ... -- --sample 40 --export        (also add the disagreements to the pilot file, unlabelled)
//   ... -- --unit comparative          (spec 009: the comparative unit's first tries, its prompt and nine skills,
//                                      exported to pilot-comparative.json with each answer's pick)
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
import { comparativeRubric } from "../lib/comparative/rubric";
import { MAX_TOKENS, buildUnseenMessages, parseUnseenReply } from "../lib/unseen/marker.server";
import { COMPARATIVE_SKILL_IDS, COMPARATIVE_UNIT_ID, SKILL_IDS, UNIT_ID } from "../lib/unseen/skills";

import { comparativeMarkerInputFor, exportComparativeFieldCases, type ComparativeFieldAnswer, type ComparativePilotFile } from "./comparative-field-cases";
import { exportFieldCases, markerInputFor, type FieldAnswer, type PilotFile } from "./unseen-field-cases";
import { DEFAULT_SAMPLE, checkRemarkModels, compareMarks, orderDisagreements, pickSample, type Disagreement, type SampleRow } from "./unseen-remark-lib";

const PILOT = path.resolve(process.cwd(), "resources", "english-unseen", "pilot-questions.json"); // run from the repo root
const PILOT_COMPARATIVE = path.resolve(process.cwd(), "resources", "english-unseen", "pilot-comparative.json");

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const sampleSize = Number(args[args.indexOf("--sample") + 1]) || DEFAULT_SAMPLE;
  const doExport = args.includes("--export");
  const unitArg = args.indexOf("--unit") >= 0 ? args[args.indexOf("--unit") + 1] : "unseen";
  if (unitArg !== "unseen" && unitArg !== "comparative") {
    console.error("--unit must be unseen or comparative");
    return 2;
  }
  const comparative = unitArg === "comparative";
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
  // the two units share the phase table; unit_id says which one this re-mark is for (spec 009 research R10)
  const stored = (await db.select().from(schema.unseenPhases)).filter((r) => r.unitId === (comparative ? COMPARATIVE_UNIT_ID : UNIT_ID));
  const pickOf = new Map(stored.map((r) => [r.questionId, r.pickedTextIds ?? undefined]));
  const rows: SampleRow[] = stored.map((r) => ({ questionId: r.questionId, maxMarks: r.maxMarks, mark: r.try1Mark, text: r.try1Text }));
  const sample = pickSample(rows, sampleSize);
  console.log(`Re-marking ${sample.length} of ${rows.length} first tries with ${remarkModel} (marker: ${gradingModel}) ...`);

  const found: Disagreement[] = [];
  let failed = 0;
  for (const row of sample) {
    let input;
    try {
      input = comparative ? comparativeMarkerInputFor(row.questionId, row.text, pickOf.get(row.questionId)) : markerInputFor(row.questionId, row.text);
    } catch {
      failed++; // a question no longer in the bank
      continue;
    }
    const messages = comparative ? buildUnseenMessages(input, comparativeRubric) : buildUnseenMessages(input);
    const res = await chatCompletion({ model: remarkModel, messages, temperature: 0, maxTokens: MAX_TOKENS, timeoutMs: 60_000, json: true });
    const parsed = res.ok && res.finishReason !== "length" ? parseUnseenReply(res.content, row.maxMarks, comparative ? COMPARATIVE_SKILL_IDS : SKILL_IDS) : null;
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

  if (doExport && ordered.length > 0 && comparative) {
    const answers: ComparativeFieldAnswer[] = ordered.map((d) => ({ questionId: d.row.questionId, text: d.row.text, pick: pickOf.get(d.row.questionId), note: d.note }));
    const file = JSON.parse(fs.readFileSync(PILOT_COMPARATIVE, "utf8")) as ComparativePilotFile;
    const out = exportComparativeFieldCases(file, answers);
    fs.writeFileSync(PILOT_COMPARATIVE, JSON.stringify(out.file, null, 2) + "\n", "utf8");
    console.log(`\nExported ${out.added} unlabelled field case(s) to resources/english-unseen/pilot-comparative.json (${out.skipped} skipped as duplicates). Label them, then run the gate.`);
  } else if (doExport && ordered.length > 0) {
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
