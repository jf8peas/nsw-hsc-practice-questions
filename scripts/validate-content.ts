/**
 * Build-time content check. Runs on `npm run validate` and before `npm run build`.
 *
 * Convention enforced: each unit lives in content/units/<unit.id>/ with
 * meta.ts, questions.ts and answers.ts, and every question id is
 * "<unit.id>.<something>".
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { UNITS } from "../content/index";
import { EXAMS } from "../content/exams";
import { F } from "../content/formulas";
import { FORMULA_HTML } from "../content/formulas.generated";
import {
  validateConceptRules,
  validateExplanationRules,
  validateShippedIds,
  type ShippedIds,
} from "../lib/content-rules";
import type { AnswerSet } from "../lib/types";

const UNITS_DIR = join(process.cwd(), "content", "units");
const SHIPPED_FILE = join(process.cwd(), "content", "shipped-ids.json");
const UPDATE_SHIPPED = process.argv.includes("--update-shipped");
const errors: string[] = [];
const err = (m: string) => errors.push(m);

function readShipped(): ShippedIds {
  if (!existsSync(SHIPPED_FILE)) return { questions: [], concepts: [], retiredUnits: [] };
  try {
    const raw = JSON.parse(readFileSync(SHIPPED_FILE, "utf8")) as Partial<ShippedIds>;
    return {
      questions: Array.isArray(raw.questions) ? raw.questions.filter((x): x is string => typeof x === "string") : [],
      concepts: Array.isArray(raw.concepts) ? raw.concepts.filter((x): x is string => typeof x === "string") : [],
      retiredUnits: Array.isArray(raw.retiredUnits) ? raw.retiredUnits.filter((x): x is string => typeof x === "string") : [],
    };
  } catch {
    err("content/shipped-ids.json is not valid JSON");
    return { questions: [], concepts: [], retiredUnits: [] };
  }
}

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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(unit.created)) {
      err(`Unit "${unit.id}": created "${unit.created}" is not YYYY-MM-DD`);
    }

    let answers: AnswerSet;
    try {
      answers = (await import(`../content/units/${unit.id}/answers`)).answers;
    } catch {
      err(`Cannot load content/units/${unit.id}/answers.ts`);
      continue;
    }

    // a concepts.ts the registry never imported would be silently ignored
    if (existsSync(join(UNITS_DIR, unit.id, "concepts.ts")) && unit.concepts === undefined) {
      err(`Unit "${unit.id}" has content/units/${unit.id}/concepts.ts but content/index.ts never imported it`);
    }
    for (const m of validateConceptRules(unit)) err(m);
    for (const m of validateExplanationRules(unit, answers)) err(m);

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
      } else if (q.type === "short" && a.rubric.length !== q.maxMarks) {
        err(`${q.id}: short rubric has ${a.rubric.length} points but maxMarks is ${q.maxMarks}`);
      }

      if (q.type === "mc") {
        if (q.options.length < 2) err(`${q.id}: mc needs at least 2 options`);
        if (typeof a.correctText === "string") {
          if (!q.options.includes(a.correctText)) {
            err(`${q.id}: correctText is not one of the options`);
          }
        } else if (typeof a.correctIndex === "number") {
          if (a.correctIndex < 0 || a.correctIndex >= q.options.length) {
            err(`${q.id}: correctIndex ${a.correctIndex} out of range`);
          }
        } else {
          err(`${q.id}: mc question needs correctText (or correctIndex)`);
        }
        if (new Set(q.options).size !== q.options.length) {
          err(`${q.id}: mc has duplicate option text`);
        }
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

  // shipped ids: a removed or renumbered question, or any removed concept, fails the build
  // unless it is tombstoned (spec 002 FR-003, FR-008). `--update-shipped` records new ids first
  // and never removes one, so it cannot hide a removal.
  const snapshot = readShipped();
  if (UPDATE_SHIPPED) {
    const next: ShippedIds = {
      questions: [...new Set([...snapshot.questions, ...UNITS.flatMap((u) => u.questions.map((q) => q.id))])].sort(),
      concepts: [...new Set([...snapshot.concepts, ...UNITS.flatMap((u) => (u.concepts ?? []).map((c) => c.id))])].sort(),
      ...(snapshot.retiredUnits?.length ? { retiredUnits: [...snapshot.retiredUnits].sort() } : {}),
    };
    writeFileSync(SHIPPED_FILE, JSON.stringify(next, null, 2) + "\n");
    console.log(
      `Updated content/shipped-ids.json: ${next.questions.length} question id(s), ${next.concepts.length} concept id(s)`,
    );
    snapshot.questions = next.questions;
    snapshot.concepts = next.concepts;
  } else if (!existsSync(SHIPPED_FILE)) {
    err("content/shipped-ids.json is missing; run `npm run validate:shipped` and commit it");
  }
  for (const m of validateShippedIds(snapshot, UNITS)) err(m);

  // pre-rendered formula HTML must cover every formula
  for (const def of Object.values(F)) {
    if (!FORMULA_HTML[def.text]) {
      err(`formulas.generated.ts is missing "${def.text}" — run \`npm run gen:formulas\``);
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
  const ready = UNITS.filter((u) => u.conceptsReady).length;
  const explained = UNITS.filter((u) => u.explanationsComplete).length;
  console.log(
    `✓ Content OK — ${UNITS.length} unit(s), ${seenQuestionIds.size} question(s), ${EXAMS.length} exam(s); ` +
      `${ready} concept-ready, ${explained} explanations-complete`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
