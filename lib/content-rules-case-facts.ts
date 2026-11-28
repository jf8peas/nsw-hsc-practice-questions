// Content rules for the case-study facts unit (spec 012, research §7): coverage, traceability, pool sizes, the source
// line and what a student may read. A plain module: no `server-only`, no I/O. scripts/validate-content.ts and
// scripts/check-case-facts.ts feed it the unit, its answer set and the parsed fact file. Every message starts with the
// unit, question, concept or fact id it is about.
//
// The impact-line rules (one per fact, no unknown ID, no digit) are the parser's (lib/case-facts/fact-file.ts), and the
// existing explanation rule requires every wrong option explained once `explanationsComplete` is set.

import type { FactFile } from "@/lib/case-facts/fact-file";
import type { AnswerSet, Question, Unit } from "@/lib/types";

export const CASE_FACTS_UNIT_ID = "y12-economics-case-study-facts";
export const CASE_FACTS_FILE = "docs/y12-economics-case-study-facts-research.md";
export const CASE_FACTS_SOURCE = "Original question — case study facts (checked Nov 2026)";

/** Each fact group's concept slug (data-model §3). */
export const FACT_GROUP_CONCEPT: Record<string, string> = {
  "china-a": "china-opening-up",
  "china-b": "china-growth",
  "china-c": "china-development",
  "china-d": "china-targeted-poverty-alleviation",
  "china-e": "china-inequality",
  "china-f": "china-environment",
  "china-g": "china-hindrances",
  "nepal-a": "nepal-strategies",
  "nepal-b": "nepal-growth-trade",
  "nepal-c": "nepal-flows",
  "nepal-d": "nepal-development",
  "nepal-e": "nepal-tourism-electricity",
  "nepal-f": "nepal-hindrances",
};

const QUIZ_GROUPS = ["mc-china", "mc-nepal", "sa-china", "sa-nepal", "sa-both"];
const MIN_POOL = 8;
const MAX_USES = 3;
const FACT_ID = /\b[CN]\d{2}\b/;

export function validateCaseFactRules(unit: Unit, answers: AnswerSet, factFile: FactFile): string[] {
  const errors: string[] = [];

  const groups = unit.quiz?.groups ?? [];
  if (groups.length !== QUIZ_GROUPS.length || groups.some((g, i) => g.group !== QUIZ_GROUPS[i] || g.n !== 1)) {
    errors.push(`${unit.id}: quiz groups must be ${QUIZ_GROUPS.join(", ")} in that order, 1 question each`);
  }
  if (!unit.quiz?.drawUnseenFirst) errors.push(`${unit.id}: quiz.drawUnseenFirst must be set`);
  for (const group of QUIZ_GROUPS) {
    const size = unit.questions.filter((q) => q.group === group).length;
    if (size < MIN_POOL) errors.push(`${unit.id}: pool ${group} has ${size} question(s); it needs at least ${MIN_POOL}`);
  }
  if (!unit.explanationsComplete) errors.push(`${unit.id}: explanationsComplete must be set`);

  const concepts = unit.concepts ?? [];
  const expected = new Set(Object.values(FACT_GROUP_CONCEPT).map((slug) => `${unit.id}.c-${slug}`));
  for (const id of expected) {
    if (!concepts.some((c) => c.id === id)) errors.push(`${unit.id}: concept ${id} is missing`);
  }
  for (const c of concepts) {
    if (!expected.has(c.id)) errors.push(`${unit.id}: concept ${c.id} is not one of the ${expected.size} fact-group concepts`);
    if (/\d/.test(c.description)) errors.push(`${c.id}: concept description must hold no digit (it is public)`);
  }

  const uses = new Map<string, number>();
  for (const q of unit.questions) {
    errors.push(...questionErrors(unit, q, answers, factFile));
    for (const id of new Set(answers[q.id]?.factIds ?? [])) uses.set(id, (uses.get(id) ?? 0) + 1);
  }

  for (const fact of factFile.facts.values()) {
    const n = uses.get(fact.id) ?? 0;
    if (fact.star && n === 0) errors.push(`${fact.id}: a ★ fact that no question tests`);
    if (n > MAX_USES) errors.push(`${fact.id}: tested by ${n} questions; at most ${MAX_USES}`);
  }
  for (const group of Object.keys(FACT_GROUP_CONCEPT)) {
    const tested = [...uses.keys()].some((id) => factFile.facts.get(id)?.group === group);
    if (!tested) errors.push(`${unit.id}: fact group ${group} has no question`);
  }

  return errors;
}

function questionErrors(unit: Unit, q: Question, answers: AnswerSet, factFile: FactFile): string[] {
  const errors: string[] = [];
  const err = (message: string) => errors.push(`${q.id}: ${message}`);
  const group = q.group ?? "";

  const wantType = group.startsWith("mc-") ? "mc" : "short";
  if (!QUIZ_GROUPS.includes(group)) err(`group "${group}" is not one of the five quiz groups`);
  else if (q.type !== wantType) err(`group "${group}" does not match the question type "${q.type}"`);

  if (q.source !== CASE_FACTS_SOURCE) err(`source must be exactly "${CASE_FACTS_SOURCE}"`);

  const key = answers[q.id];
  const ids = key?.factIds ?? [];
  if (ids.length === 0) err("the key names no fact");
  if (new Set(ids).size !== ids.length) err("the key names a fact twice");
  const facts = [];
  for (const id of new Set(ids)) {
    const fact = factFile.facts.get(id);
    if (!fact) {
      err(`fact ${id} is not in the fact file`);
      continue;
    }
    facts.push(fact);
    if (group.endsWith("-china") && !id.startsWith("C")) err(`fact ${id} is not a China fact, in a China pool`);
    if (group.endsWith("-nepal") && !id.startsWith("N")) err(`fact ${id} is not a Nepal fact, in a Nepal pool`);
  }

  if (q.concept === undefined) err("has no concept tag");
  else if (facts.length > 0 && !facts.some((f) => q.concept === `${unit.id}.c-${FACT_GROUP_CONCEPT[f.group]}`)) {
    err(`concept ${q.concept} matches the group of none of its facts`);
  }

  if (!key) return errors;

  if (q.type === "mc") {
    if (q.options.length !== 4) err(`needs exactly four options (has ${q.options.length})`);
    if (key.correctText === undefined || !q.options.includes(key.correctText)) err("correctText is not one of the options");
    const allowed = new Set(facts.flatMap((f) => f.sourceNumbers));
    for (const [option, text] of Object.entries(key.wrongExplanations ?? {})) {
      const cited = text.match(/\bS\d+\b/g) ?? [];
      const ok = allowed.size > 0 ? cited.some((n) => allowed.has(n)) : /secondary source/i.test(text);
      if (!ok) {
        const wanted = allowed.size > 0 ? [...allowed].join(" or ") : `"secondary source"`;
        err(`the explanation for "${option}" must cite ${wanted}`);
      }
    }
  } else if (q.type === "short") {
    if (q.maxMarks !== 2 && q.maxMarks !== 3) err("a short answer is worth 2 or 3 marks");
    if (!key.modelAnswer?.trim()) err("needs a model answer");
    if (!key.notes?.trim()) err("needs marking notes");
    if (key.rubric.length !== q.maxMarks) err(`rubric has ${key.rubric.length} points but is worth ${q.maxMarks}`);
  }

  const visible = [
    q.prompt,
    ...(q.type === "mc" ? q.options : []),
    key.correctText ?? "",
    key.modelAnswer ?? "",
    ...key.rubric,
    key.notes ?? "",
    ...Object.values(key.wrongExplanations ?? {}),
  ];
  const leaked = visible.map((text) => FACT_ID.exec(text)?.[0]).find(Boolean);
  if (leaked) err(`fact ID ${leaked} appears in text a student sees`);
  for (const number of new Set(visible.flatMap((text) => text.match(/\bS\d+\b/g) ?? []))) {
    if (!factFile.sources.has(number)) err(`cites ${number}, which is not a source of the fact file`);
  }

  return errors;
}
