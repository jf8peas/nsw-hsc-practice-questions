/**
 * Build-time content check. Runs on `npm run validate` and before `npm run build`.
 *
 * Convention enforced: each unit lives in content/units/<unit.id>/ with
 * meta.ts, questions.ts and answers.ts, and every question id is
 * "<unit.id>.<something>".
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { UNITS } from "../content/index";
import { EXAMS } from "../content/exams";
import { F } from "../content/formulas";
import { FORMULA_HTML } from "../content/formulas.generated";
import {
  validateConceptRules,
  validateExplanationRules,
  validateParagraphRules,
  validateUnseenRules,
  validateRewriteRules,
  validateShippedIds,
  type ShippedIds,
} from "../lib/content-rules";
import { parseFactFile } from "../lib/case-facts/fact-file";
import { CASE_FACTS_FILE, CASE_FACTS_SOURCE, CASE_FACTS_UNIT_ID, validateCaseFactRules } from "../lib/content-rules-case-facts";
import { validateComparativeRules } from "../lib/content-rules-comparative";
import { validateEssayRules } from "../lib/content-rules-essay";
import { validateEnglishEssayRules } from "../lib/content-rules-english-essay";
import { checkModelEssay, modelProblems } from "../lib/english-essay/model-check";
import { PlayIndex } from "../lib/english-essay/play-index";
import comparativeRubric from "../lib/comparative/rubric.json";
import type { AnswerSet, Unit } from "../lib/types";

const UNITS_DIR = join(process.cwd(), "content", "units");

// The comparative prompt's directive verbs (spec 009 FR-014): lib/comparative/rubric.json, the comparative prompt file.
const comparativeVerbs = (comparativeRubric as { directiveVerbs: Record<string, string> }).directiveVerbs;

/** The size in bytes of a text's image file in the unit's images folder, or null when it is not there. */
function imageSize(unitId: string, name: string): number | null {
  const file = join(UNITS_DIR, unitId, "images", `${name}.webp`);
  return existsSync(file) ? statSync(file).size : null;
}
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

// A short-answer part may name its part, e.g. "Q24(a)" or "Q22(a)(i)".
const SOURCE_RE = /^[A-Z][A-Za-z'’ .-]+ (19|20)\d{2} (Trial|Half-yearly|Common Test 1|Interim), Q\d{1,2}(\([a-z]\))?(\((i|ii|iii|iv|v|vi)\))?$/;

// In a unit whose other questions are copied from school papers, a question written new for the
// unit says so, so that every question in the unit shows where it came from.
const ORIGINAL_SOURCE = "Original question";

/**
 * Spec 011 T068: every LIVE English model essay must be 900 to 1,100 words with zero near or not-found quotations against the
 * play. The play is gitignored, so this runs only where the local copy exists (a teacher's machine); on a build machine without
 * it the check is skipped with a notice, never failed, and validation stays independent of the database.
 */
function validateEnglishModels(unit: Unit, answers: AnswerSet): string[] {
  const live = unit.questions.filter((q) => q.type === "englishEssay" && q.live);
  if (live.length === 0) return [];
  const playFile = join(process.cwd(), "resources", "english-unseen", "away-by-michael-gow.txt");
  if (!existsSync(playFile)) {
    console.log(`  (the local play is not present, so the live English model quotations were not checked)`);
    return [];
  }
  const play = new PlayIndex(readFileSync(playFile, "utf8"));
  const out: string[] = [];
  for (const q of live) {
    const key = answers[q.id]?.englishEssay;
    if (key) out.push(...modelProblems(q.id, checkModelEssay(key.modelEssay, q.prompt, play)));
  }
  return out;
}

/**
 * Spec 012: the case-study facts unit is checked against its fact file, the only list of facts, ★ flags and impact lines.
 * A missing or unreadable file stops the build, because nothing could then be traced.
 */
function validateCaseFacts(unit: Unit, answers: AnswerSet): string[] {
  if (unit.id !== CASE_FACTS_UNIT_ID) return [];
  const file = join(process.cwd(), CASE_FACTS_FILE);
  if (!existsSync(file)) return [`${unit.id}: the fact file ${CASE_FACTS_FILE} is missing`];
  try {
    return validateCaseFactRules(unit, answers, parseFactFile(readFileSync(file, "utf8")));
  } catch (error) {
    return [`${unit.id}: ${CASE_FACTS_FILE} does not parse: ${(error as Error).message}`];
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
    for (const m of validateRewriteRules(unit, answers)) err(m);
    for (const m of validateParagraphRules(unit, answers)) err(m);
    for (const m of validateEssayRules(unit, answers, UNITS)) err(m);
    for (const m of validateEnglishEssayRules(unit, answers)) err(m);
    for (const m of validateEnglishModels(unit, answers)) err(m);
    for (const m of validateCaseFacts(unit, answers)) err(m);
    for (const m of validateUnseenRules(unit, answers, new Date(), (name) => imageSize(unit.id, name))) err(m);
    // the comparative unit's images live in the shared text store, which is spec 008's unit folder
    for (const m of validateComparativeRules(unit, answers, comparativeVerbs, UNITS, new Date(), (name) => imageSize("y12-english-advanced-unseen-texts", name))) err(m);

    for (const q of unit.questions) {
      if (!q.id.startsWith(`${unit.id}.`)) {
        err(`Question "${q.id}" is not namespaced as "${unit.id}.*"`);
      }
      if (seenQuestionIds.has(q.id)) err(`Duplicate question id: ${q.id}`);
      seenQuestionIds.add(q.id);

      if (q.maxMarks < 1) err(`${q.id}: maxMarks must be >= 1`);

      // Principle V: a verbatim school-paper question names its source, and never an HSC paper
      if (q.source !== undefined) {
        // spec 012 FR-014: one longer original-question line, allowed for that unit only
        const caseFactsLine = unit.id === CASE_FACTS_UNIT_ID && q.source === CASE_FACTS_SOURCE;
        if (q.source !== ORIGINAL_SOURCE && !caseFactsLine && !SOURCE_RE.test(q.source)) {
          err(`${q.id}: source "${q.source}" must look like "<School> <Year> <Trial|Half-yearly|Common Test 1>, Q<n>", optionally with a part such as Q<n>(a) or Q<n>(a)(i)`);
        }
        if (/\b(HSC|NESA)\b/i.test(q.source)) err(`${q.id}: source "${q.source}" names an HSC/NESA paper; HSC questions are not allowed`);
      }

      const a = answers[q.id];
      // an essay that is not live has no key yet (spec 010); validateEssayRules checks a live essay's key
      if ((q.type === "essay" || q.type === "englishEssay") && !q.live && !a) continue;
      if (!a) {
        err(`${q.id}: no entry in answers.ts`);
        continue;
      }
      if (q.type === "paragraph" || q.type === "unseen" || q.type === "comparative" || q.type === "essay" || q.type === "englishEssay") {
        // the essay key is checked by the paragraph rules (spec 007 FR-039) and the unseen-text key by the
        // unseen rules (spec 008 FR-046); no rubric or model answer here
      } else if (!a.rubric || a.rubric.length === 0) {
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
      } else if (q.type === "rewrite" || q.type === "paragraph" || q.type === "unseen" || q.type === "comparative" || q.type === "essay" || q.type === "englishEssay") {
        // model sentences, target terms and essay keys are checked by their own rules (FR-008, spec 007)
      } else {
        if (!a.modelAnswer) err(`${q.id}: short question needs a modelAnswer`);
      }
    }

    // a unit either sources every question or none (no silent gaps in attribution); the essay unit sources its trial essays only (spec 010)
    const sourced = unit.questions.filter((q) => q.source !== undefined).length;
    if (unit.flow !== "essay" && sourced > 0 && sourced < unit.questions.length) {
      err(`Unit "${unit.id}": ${unit.questions.length - sourced} question(s) have no source but others do`);
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

  // The essay unit (spec 010) is registered only once an essay is live, but its content is checked either way.
  const essayUnitId = "y12-economics-essay-writing";
  if (!UNITS.some((u) => u.id === essayUnitId)) {
    const { meta } = await import("../content/units/y12-economics-essay-writing/meta");
    const { questions } = await import("../content/units/y12-economics-essay-writing/questions");
    const { concepts, retired } = await import("../content/units/y12-economics-essay-writing/concepts");
    const { answers } = (await import(`../content/units/${essayUnitId}/answers`)) as { answers: AnswerSet };
    const unlisted = { ...meta, questions, concepts, retired } as Unit;
    for (const m of validateConceptRules(unlisted)) err(m);
    for (const m of validateEssayRules(unlisted, answers, UNITS)) err(m);
  }

  // The English essay unit (spec 011) is registered only once an essay is live, but its content is checked either way.
  const englishEssayUnitId = "y12-english-essay-writing";
  if (!UNITS.some((u) => u.id === englishEssayUnitId)) {
    const { meta } = await import("../content/units/y12-english-essay-writing/meta");
    const { questions } = await import("../content/units/y12-english-essay-writing/questions");
    const { concepts, retired } = await import("../content/units/y12-english-essay-writing/concepts");
    const { answers } = (await import(`../content/units/${englishEssayUnitId}/answers`)) as { answers: AnswerSet };
    const unlisted = { ...meta, questions, concepts, retired } as Unit;
    for (const m of validateConceptRules(unlisted)) err(m);
    for (const m of validateEnglishEssayRules(unlisted, answers)) err(m);
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
