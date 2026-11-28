// Fact check of the case-study facts unit (spec 012 FR-032, research §8).
//
//   npm run case-facts:check
//
// Runs the content rules on the unit folder (registered or not) and traces every number, period and date to the fact
// file. It rewrites only the block between the script markers in the fact-check report, and exits 1 on a rule error, an
// untraced value or a fact file that does not parse. Offline authoring tool: it reads the unit's answer key and never
// runs in the app.

import fs from "node:fs";
import path from "node:path";

import { parseFactFile, type FactFile } from "../lib/case-facts/fact-file";
import { traceUnit } from "../lib/case-facts/trace";
import { validateConceptRules, validateExplanationRules } from "../lib/content-rules";
import { CASE_FACTS_FILE, CASE_FACTS_UNIT_ID, validateCaseFactRules } from "../lib/content-rules-case-facts";
import type { AnswerSet, Unit } from "../lib/types";

const UNIT_DIR = path.join(process.cwd(), "content", "units", CASE_FACTS_UNIT_ID);
const REPORT = path.join(process.cwd(), "specs", "012-economics-case-study-facts", "fact-check.md");
const START = "<!-- script:start -->";
const END = "<!-- script:end -->";

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

async function loadUnit(): Promise<{ unit: Unit; answers: AnswerSet }> {
  for (const name of ["meta", "questions", "concepts", "answers"]) {
    if (!fs.existsSync(path.join(UNIT_DIR, `${name}.ts`))) fail(`content/units/${CASE_FACTS_UNIT_ID}/${name}.ts is not there yet`);
  }
  const base = `../content/units/${CASE_FACTS_UNIT_ID}`;
  const { meta } = await import(`${base}/meta`);
  const { questions } = await import(`${base}/questions`);
  const { concepts, retired } = await import(`${base}/concepts`);
  const { answers } = await import(`${base}/answers`);
  return { unit: { ...meta, questions, concepts, retired }, answers };
}

function writeReport(block: string): void {
  const text = fs.existsSync(REPORT) ? fs.readFileSync(REPORT, "utf8") : "# Fact check: Case Study Facts (Release 1)\n";
  const start = text.indexOf(START);
  const end = text.indexOf(END);
  const next =
    start >= 0 && end > start
      ? `${text.slice(0, start)}${START}\n${block}\n${text.slice(end)}`
      : `${text.trimEnd()}\n\n${START}\n${block}\n${END}\n`;
  fs.writeFileSync(REPORT, next);
}

async function main() {
  let factFile: FactFile;
  try {
    factFile = parseFactFile(fs.readFileSync(path.join(process.cwd(), CASE_FACTS_FILE), "utf8"));
  } catch (error) {
    fail(`${CASE_FACTS_FILE}: ${(error as Error).message}`);
  }
  const { unit, answers } = await loadUnit();

  const errors = [
    ...unit.questions.filter((q) => !answers[q.id]).map((q) => `${q.id}: no entry in answers.ts`),
    ...validateConceptRules(unit),
    ...validateExplanationRules(unit, answers),
    ...validateCaseFactRules(unit, answers, factFile),
  ];
  const { findings, warnings } = traceUnit(unit, answers, factFile);
  const notOk = findings.filter((f) => f.status !== "OK");
  const untraced = notOk.filter((f) => f.status === "UNTRACED");
  const count = (status: string) => findings.filter((f) => f.status === status).length;

  const summary =
    `${unit.questions.length} questions; ${findings.length} numbers, periods and dates traced: ` +
    `${count("OK")} OK, ${count("ROUNDED")} rounded, ${count("OTHER_ROW")} from another row, ${untraced.length} untraced.`;
  const list = (items: string[]) => (items.length ? items.map((x) => `- ${x}`).join("\n") : "- none");
  const lines = notOk.map((f) => `${f.status} \`${f.value}\` in ${f.questionId.slice(unit.id.length + 1)}, ${f.where} (${f.factIds.join(", ")})`);

  writeReport(
    [
      "(written by npm run case-facts:check; do not edit)",
      "",
      summary,
      "",
      "### Rule errors",
      list(errors),
      "",
      "### Values that are not an exact match in the question's rows",
      list(lines),
      "",
      "### Warnings",
      list(warnings),
    ].join("\n"),
  );

  console.log(summary);
  for (const [title, items] of [
    ["Rule errors", errors],
    ["Not an exact match", lines],
    ["Warnings", warnings],
  ] as const) {
    console.log(`\n${title} (${items.length})`);
    for (const item of items) console.log(`  - ${item}`);
  }
  console.log(`\nReport: ${path.relative(process.cwd(), REPORT)}`);
  if (errors.length > 0 || untraced.length > 0) fail(`${errors.length} rule error(s), ${untraced.length} untraced value(s)`);
  console.log("✓ No rule error and nothing untraced");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
