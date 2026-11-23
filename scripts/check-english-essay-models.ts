// Offline check of every English model essay against the local play (spec 011 T073, T068). Run on a teacher's machine, never at
// request time and never in a bundle:
//
//   npm run english-essay-check-models
//
// It checks (a) every essay file in gitignored resources/english-essay/content/eN.json and (b) every live key already in the
// shipped content/units/y12-english-essay-writing/answers.ts: 900 to 1,100 words, tags on the list, non-empty notes, and zero
// near or not-found quotations against the local play. It prints word counts and flags only (the flagged quotation and its near
// correction), never the model text. Exit code 1 when anything fails.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { answers } from "../content/units/y12-english-essay-writing/answers";
import { ENGLISH_ESSAY_CONCEPTS } from "../content/units/y12-english-essay-writing/concepts";
import { questions } from "../content/units/y12-english-essay-writing/questions";
import { checkModelEssay, modelProblems } from "../lib/english-essay/model-check";
import { PlayIndex } from "../lib/english-essay/play-index";

const UNIT = "y12-english-essay-writing";
const ROOT = process.cwd();
const CONTENT = join(ROOT, "resources", "english-essay", "content");
const PLAY = join(ROOT, "resources", "english-unseen", "away-by-michael-gow.txt");

if (!existsSync(PLAY)) {
  console.error(`✗ The local play ${PLAY} is missing (it is gitignored): the model quotations cannot be checked.`);
  process.exit(1);
}
const play = new PlayIndex(readFileSync(PLAY, "utf8"));
const questionOf = new Map(questions.map((q) => [q.id, q.prompt]));
const problems: string[] = [];
let checked = 0;

if (existsSync(CONTENT)) {
  for (const f of readdirSync(CONTENT).filter((n) => /^e[1-6]\.json$/.test(n)).sort()) {
    const id = f.replace(".json", "");
    const e = JSON.parse(readFileSync(join(CONTENT, f), "utf8")) as { markingNotes?: string; modelEssay?: string; conceptTags?: string[]; concepts?: string[] };
    const check = checkModelEssay(e.modelEssay ?? "", questionOf.get(`${UNIT}.${id}`) ?? "", play);
    console.log(`content ${id}: ${check.words} words, ${check.quotations} quotation(s), ${check.flags.length} flag(s)`);
    problems.push(...modelProblems(`content ${id}`, check));
    if (!e.markingNotes?.trim()) problems.push(`content ${id}: markingNotes is empty`);
    for (const k of e.conceptTags ?? e.concepts ?? []) if (!(k in ENGLISH_ESSAY_CONCEPTS)) problems.push(`content ${id}: concept key "${k}" is not on the list`);
    checked++;
  }
}

for (const q of questions) {
  const key = answers[q.id]?.englishEssay;
  if (!key) continue;
  const check = checkModelEssay(key.modelEssay, q.prompt, play);
  console.log(`shipped ${q.id.slice(UNIT.length + 1)}: ${check.words} words, ${check.quotations} quotation(s), ${check.flags.length} flag(s)`);
  problems.push(...modelProblems(`shipped ${q.id}`, check));
  checked++;
}

if (checked === 0) console.log("No model essays found yet (resources/english-essay/content/ is empty and nothing is shipped).");
if (problems.length > 0) {
  console.error(`\n✗ ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`✓ ${checked} model essay(s) pass the word range and the quote check.`);
