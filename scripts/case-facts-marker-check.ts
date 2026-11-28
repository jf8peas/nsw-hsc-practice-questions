// Marker check of the case-study facts unit (spec 012 SC-005, research §9).
//
//   npm run case-facts:marker-check
//
// Marks each case of marker-cases.json three times with the app's own short-answer marker (same prompt, key and
// GRADING_MODEL) and compares the marks with the expected ones. A case passes only if all three runs match. Runs on your
// own machine: OPENROUTER_API_KEY comes from the environment, .env.local or .env. It touches no database and no daily
// cap, and sends only the invented answers in the case file, never student data.

import fs from "node:fs";
import path from "node:path";

import { loadEnvConfig } from "@next/env";

import { gradeAnswer } from "../lib/grading.server";
import { DEFAULT_MODEL } from "../lib/openrouter.server";

const CASES = path.resolve(process.cwd(), "specs", "012-economics-case-study-facts", "marker-cases.json");
const RUNS = 3;

interface Case {
  id: string;
  tolerance: string;
  questionId: string;
  answer: string;
  expected: number;
}

async function main(): Promise<number> {
  loadEnvConfig(process.cwd());
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("✗ OPENROUTER_API_KEY must be set (environment, .env.local or .env).");
    return 2;
  }
  console.log(`Model: ${process.env.GRADING_MODEL || DEFAULT_MODEL}`);
  const { cases } = JSON.parse(fs.readFileSync(CASES, "utf8")) as { cases: Case[] };

  let failed = 0;
  for (const c of cases) {
    const marks: string[] = [];
    const mismatches: string[] = [];
    for (let run = 1; run <= RUNS; run++) {
      const graded = await gradeAnswer(c.questionId, c.answer);
      if (!graded) {
        marks.push("error");
        mismatches.push(`run ${run}: unknown question (is the unit registered?)`);
      } else if (graded.result.type !== "short" || graded.result.needsSelfMark) {
        marks.push("error");
        mismatches.push(`run ${run}: the marker gave no mark (self-mark fallback)`);
      } else {
        marks.push(String(graded.result.marksAwarded));
        if (graded.result.marksAwarded !== c.expected) mismatches.push(`run ${run}: ${graded.result.feedback ?? ""}`);
      }
    }
    const passed = mismatches.length === 0;
    if (!passed) failed += 1;
    console.log(`${passed ? "✓" : "✗"} ${c.id} (${c.tolerance}): expected ${c.expected}, got ${marks.join(", ")}`);
    for (const line of mismatches) console.log(`    ${line}`);
  }

  console.log(`\n${cases.length - failed} of ${cases.length} cases matched on all ${RUNS} runs.`);
  return failed === 0 ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
