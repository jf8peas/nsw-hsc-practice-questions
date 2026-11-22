// Build-time content rules for the Economics essay-writing unit (spec 010, research R2).
// A plain module: no `server-only`, no I/O. scripts/validate-content.ts feeds it the unit and its answer
// set; tests/essay/content-rules.test.ts feeds it small fixtures. Every message starts with the unit or
// question id it is about.

import { GLOSSARY } from "@/content/glossary";
import type { AnswerSet, EssayQuestion, Unit } from "@/lib/types";
import { ESSAY_MAX, ESSAY_MIN } from "@/lib/essay/counter";
import { countWords } from "@/lib/wordcount";

/** The three essays copied word for word from school trial papers (they alone carry a source and school criteria). */
const TRIAL_SUFFIXES = new Set(["e1", "e3", "e4"]);
const LEAK_RUN = 60;

const squash = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/** True when `needle` shares a run of `run` characters with `haystack` (a window of the needle occurs in it). */
function sharesRun(needle: string, haystack: string, run: number): boolean {
  const n = squash(needle);
  const h = squash(haystack);
  for (let i = 0; i + run <= n.length; i++) {
    const w = n.slice(i, i + run);
    if (!w.startsWith(" ") && !w.endsWith(" ") && h.includes(w)) return true;
  }
  return false;
}

export function validateEssayRules(unit: Unit, answers: AnswerSet, otherUnits: readonly Unit[] = []): string[] {
  const errors: string[] = [];
  const essays = unit.questions.filter((q): q is EssayQuestion => q.type === "essay");
  if (essays.length === 0) return errors;

  const conceptIds = new Set((unit.concepts ?? []).map((c) => c.id));
  const paragraphPrompts = new Set(
    otherUnits.flatMap((u) => u.questions.filter((q) => q.type === "paragraph").map((q) => squash(q.prompt))),
  );

  if (essays.length !== 6) errors.push(`${unit.id}: ${essays.length} essays; the unit has six (e1 to e6)`);
  const offers = essays.map((q) => q.offer).sort();
  if (JSON.stringify(offers) !== JSON.stringify([1, 2, 3, 4, 5, 6].slice(0, essays.length))) {
    errors.push(`${unit.id}: essay offer positions must be 1 to ${essays.length}, each once (found ${offers.join(", ")})`);
  }

  const publicTexts = [
    unit.description,
    ...(unit.guide?.items.map((i) => i.text) ?? []),
    ...(unit.concepts ?? []).map((c) => c.description),
    ...essays.map((q) => q.prompt),
  ];

  for (const q of essays) {
    const suffix = q.id.startsWith(`${unit.id}.`) ? q.id.slice(unit.id.length + 1) : "";
    if (!/^e[1-6]$/.test(suffix)) errors.push(`${q.id}: id must be ${unit.id}.e1 to ${unit.id}.e6`);
    if (q.maxMarks !== 20) errors.push(`${q.id}: maxMarks must be 20`);
    if (!q.prompt.trim()) errors.push(`${q.id}: prompt is empty`);
    if (!(q.verb in GLOSSARY)) errors.push(`${q.id}: verb "${q.verb}" is not in content/glossary.ts`);
    if (!["china", "nepal", "both"].includes(q.economy)) errors.push(`${q.id}: economy must be china, nepal or both`);
    if (paragraphPrompts.has(squash(q.prompt))) errors.push(`${q.id}: repeats a question of the paragraph-writing unit`);

    const trial = TRIAL_SUFFIXES.has(suffix);
    if (trial && !q.source) errors.push(`${q.id}: a school-trial essay must show its source`);
    if (!trial && q.source) errors.push(`${q.id}: an original essay must not carry a source`);

    if (!q.live) continue;

    // a live essay is complete
    const key = answers[q.id]?.essay;
    if (!key) {
      errors.push(`${q.id}: is live but has no essay key in answers.ts`);
      continue;
    }
    if (!key.markingNotes.trim()) errors.push(`${q.id}: marking notes are empty`);
    const words = countWords(key.modelEssay);
    if (words < ESSAY_MIN || words > ESSAY_MAX) {
      errors.push(`${q.id}: the model essay is ${words} words; it must be ${ESSAY_MIN} to ${ESSAY_MAX}`);
    }
    if (key.concepts.length === 0) errors.push(`${q.id}: has no concept tags`);
    for (const c of key.concepts) if (!conceptIds.has(c)) errors.push(`${q.id}: concept tag ${c} is not a concept of ${unit.id}`);
    if (trial && !(key.schoolCriteria && key.schoolCriteria.trim())) {
      errors.push(`${q.id}: a school-trial essay needs the school's marking criteria (schoolCriteria)`);
    }
    if (!trial && key.schoolCriteria !== null) errors.push(`${q.id}: an original essay has no school criteria (schoolCriteria must be null)`);

    // the key must not appear in anything public
    for (const [label, text] of [["marking notes", key.markingNotes], ["model essay", key.modelEssay], ["school criteria", key.schoolCriteria ?? ""]] as const) {
      if (text && publicTexts.some((p) => sharesRun(text, p, LEAK_RUN))) {
        errors.push(`${q.id}: the ${label} share a run of ${LEAK_RUN} characters with public text`);
      }
    }
  }

  // the bank's other essays' model texts must not be copies of each other
  const liveKeys = essays.filter((q) => q.live).map((q) => [q.id, answers[q.id]?.essay?.modelEssay] as const);
  for (let i = 0; i < liveKeys.length; i++) {
    for (let j = i + 1; j < liveKeys.length; j++) {
      const a = liveKeys[i]![1];
      const b = liveKeys[j]![1];
      if (a && b && sharesRun(a, b, 200)) errors.push(`${liveKeys[i]![0]} and ${liveKeys[j]![0]}: model essays share a run of 200 characters`);
    }
  }
  return errors;
}
