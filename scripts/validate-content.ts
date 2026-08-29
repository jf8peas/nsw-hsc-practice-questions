/**
 * Build-time content check. Runs on `npm run validate` and before `npm run build`.
 *
 * Convention enforced: each unit lives in content/units/<unit.id>/ with
 * meta.ts, questions.ts and answers.ts, and every question id is
 * "<unit.id>.<something>".
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { UNITS } from "../content/index";
import { EXAMS } from "../content/exams";
import type { AnswerSet } from "../lib/types";

const UNITS_DIR = join(process.cwd(), "content", "units");
const errors: string[] = [];
const err = (m: string) => errors.push(m);

async function main() {
  const seenQuestionIds = new Set<string>();
  const seenUnitIds = new Set<string>();
  const folderNames = new Set(
    readdirSync(UNITS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name),
  );

  for (const unit of UNITS) {
    if (seenUnitIds.has(unit.id)) err(`Duplicate unit id: ${unit.id}`);
    seenUnitIds.add(unit.id);

    if (!folderNames.has(unit.id)) {
      err(`Unit "${unit.id}" has no content/units/${unit.id}/ folder`);
      continue;
    }

    if (unit.questions.length === 0) err(`Unit "${unit.id}" has no questions`);

    let answers: AnswerSet;
    try {
      answers = (await import(`../content/units/${unit.id}/answers`)).answers;
    } catch {
      err(`Cannot load content/units/${unit.id}/answers.ts`);
      continue;
    }

    for (const q of unit.questions) {
      if (!q.id.startsWith(`${unit.id}.`)) {
        err(`Question "${q.id}" is not namespaced as "${unit.id}.*"`);
      }
      if (seenQuestionIds.has(q.id)) err(`Duplicate question id: ${q.id}`);
      seenQuestionIds.add(q.id);

      if (q.maxMarks < 1) err(`${q.id}: maxMarks must be >= 1`);

      const a = answers[q.id];
      if (!a) {
        err(`${q.id}: no entry in answers.ts`);
        continue;
      }
      if (!a.rubric || a.rubric.length === 0) {
        err(`${q.id}: rubric must have at least one point`);
      }

      if (q.type === "mc") {
        if (typeof a.correctIndex !== "number") {
          err(`${q.id}: mc question needs a numeric correctIndex`);
        } else if (a.correctIndex < 0 || a.correctIndex >= q.options.length) {
          err(`${q.id}: correctIndex ${a.correctIndex} out of range`);
        }
        if (q.options.length < 2) err(`${q.id}: mc needs at least 2 options`);
      } else {
        if (!a.modelAnswer) err(`${q.id}: short question needs a modelAnswer`);
      }
    }

    // answer keys with no matching question
    for (const id of Object.keys(answers)) {
      if (!unit.questions.some((q) => q.id === id)) {
        err(`answers.ts has "${id}" but no such question in ${unit.id}`);
      }
    }
  }

  for (const exam of EXAMS) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exam.date)) {
      err(`Exam "${exam.id}": date "${exam.date}" is not YYYY-MM-DD`);
    }
    for (const uid of exam.unitIds) {
      if (!seenUnitIds.has(uid)) {
        err(`Exam "${exam.id}" references unknown unit "${uid}"`);
      }
    }
  }

  if (errors.length) {
    console.error(`\n✗ Content validation failed (${errors.length}):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error("");
    process.exit(1);
  }
  console.log(
    `✓ Content OK — ${UNITS.length} unit(s), ${seenQuestionIds.size} question(s), ${EXAMS.length} exam(s)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
