// Re-mark a sample of real full-mark paragraph answers with a STRONGER model (spec 007 FR-031).
// An offline teacher task: runs on your own machine, never at request time.
//
//   REMARK_MODEL=<a model stronger than GRADING_MODEL> npm run paragraph-remark -- --sample 40
//   ... -- --sample 40 --export        (also add the disagreements to the pilot file, unlabelled)
//
// It checks the three known leniency patterns first (Link a, Topic b, Mechanism c; see
// resources/topic010/06-findings-holdout.md) by filling the sample from those parts first. It calls
// OpenRouter directly with the same prompt the app uses, so it NEVER touches a student's daily
// allowance (LLM_DAILY_CAP) or any rate limit, and it sends only the writing to the same provider
// that marked it: no name, email or id. OPENROUTER_API_KEY, REMARK_MODEL and DATABASE_URL come from
// the environment or .env.local (constitution Principle VII). resources/ is gitignored.

import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { and, eq, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import { essays } from "../content/units/y12-economics-paragraph-writing/essays";
import { ESSAYS } from "../content/units/y12-economics-paragraph-writing/questions";
import type { Db } from "../lib/db/index.server";
import * as schema from "../lib/db/schema";
import { DEFAULT_MODEL, chatCompletion } from "../lib/openrouter.server";
import { buildParagraphMessages, parseMarkerReply } from "../lib/paragraph/marker.server";
import { LIMITS, PART_ORDER } from "../lib/paragraph/parts";
import { buildVerdicts } from "../lib/paragraph/scoring";
import type { PartNo } from "../lib/types";
import { countWords } from "../lib/wordcount";

import { exportFieldCases, type FieldAnswer, type PilotFile } from "./paragraph-field-cases";
import { checkRemarkModels, compareVerdicts, pickSample, type Disagreement, type SampleRow } from "./paragraph-remark-lib";

const PILOT = path.resolve(process.cwd(), "resources", "topic010", "pilot-essays.json"); // run from the repo root

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const sampleSize = Number(args[args.indexOf("--sample") + 1]) || 40;
  const doExport = args.includes("--export");
  if (sampleSize < 1 || sampleSize > 200) {
    console.error("--sample must be between 1 and 200");
    return 2;
  }
  loadEnvConfig(process.cwd());
  const remarkModel = process.env.REMARK_MODEL?.trim();
  const gradingModel = process.env.GRADING_MODEL?.trim() || DEFAULT_MODEL;
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
  const stored = await db
    .select()
    .from(schema.paragraphPhases)
    .where(and(eq(schema.paragraphPhases.ending, "full_marks"), eq(schema.paragraphPhases.mode, "marker"), isNotNull(schema.paragraphPhases.phase1PromptVersion)));
  const rows: SampleRow[] = stored.flatMap((r) => {
    const m = /\.e(\d{2})p([1-5])$/.exec(r.questionId);
    return m ? [{ questionId: r.questionId, part: Number(m[2]), text: r.phase1Text, verdicts: r.phase1Verdicts }] : [];
  });
  const sample = pickSample(rows, sampleSize, true);
  console.log(`Re-marking ${sample.length} of ${rows.length} full-mark answers with ${remarkModel} (marker: ${gradingModel}) ...`);

  const found: Disagreement[] = [];
  let failed = 0;
  for (const row of sample) {
    const m = /\.(e\d{2})p([1-5])$/.exec(row.questionId)!;
    const key = essays.find((e) => e.essayId === m[1])!;
    const header = ESSAYS.find((e) => e.essayId === m[1])!;
    const part = Number(m[2]) as PartNo;
    const messages = buildParagraphMessages({
      part: PART_ORDER[part - 1],
      question: header.question,
      verb: header.verb,
      economy: header.economy,
      economyType: key.economyType,
      strategy: key.strategy,
      brief: key.brief,
      earlierModels: ([1, 2, 3, 4, 5] as PartNo[]).filter((n) => n < part).map((n) => key.models[n]),
      model: key.models[part],
      markingNotes: key.markingNotes[part],
      answer: row.text,
    });
    const res = await chatCompletion({ model: remarkModel, messages, temperature: 0, maxTokens: 1200, timeoutMs: 60_000, json: true });
    const raw = res.ok ? parseMarkerReply(res.content) : null;
    if (!raw) {
      failed++;
      continue;
    }
    const v = buildVerdicts(raw, countWords(row.text), LIMITS[PART_ORDER[part - 1]]);
    const diff = compareVerdicts(row, { a: v.a.met, b: v.b.met, c: v.c.met, d: v.d.met });
    if (diff) found.push(diff);
  }

  console.log(`\n${found.length} disagreement(s) out of ${sample.length - failed} re-marked (${failed} failed calls).`);
  const patterned = found.filter((d) => d.pattern);
  console.log(`\nKnown leniency patterns first (${patterned.length}):`);
  for (const d of patterned) console.log(`  - ${d.pattern}: ${d.row.text.slice(0, 140)}…`);
  console.log(`\nOther disagreements (${found.length - patterned.length}):`);
  for (const d of found.filter((x) => !x.pattern)) console.log(`  - (${d.lenient.join(",")}) ${d.row.text.slice(0, 140)}…`);

  if (doExport && found.length > 0) {
    const answers: FieldAnswer[] = found.map((d) => ({ questionId: d.row.questionId, text: d.row.text, note: d.note }));
    const file = JSON.parse(fs.readFileSync(PILOT, "utf8")) as PilotFile;
    const out = exportFieldCases(file, answers);
    fs.writeFileSync(PILOT, JSON.stringify(out.file, null, 2) + "\n", "utf8");
    console.log(`\nExported ${out.added} unlabelled field case(s) to resources/topic010/pilot-essays.json (${out.skipped} skipped as duplicates). Label them, then run the gate.`);
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
