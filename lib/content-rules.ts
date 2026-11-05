// Build-time content rules for concepts, tombstones and wrong-option explanations
// (constitution Principles III and IV; specs/002-learn-from-mistakes/research.md R1, R3).
//
// A plain module: no `server-only`, no I/O. scripts/validate-content.ts feeds it the loaded
// units and answer sets, and tests/content-rules.test.ts feeds it small fixtures. Every
// message starts with the unit or question id it is about.

import { GLOSSARY } from "@/content/glossary";
import { LIMITS, PART_ORDER, TIPS, conceptIdsForPart, tipConceptId } from "@/lib/paragraph/parts";
import type { AnswerSet, BriefField, EssayKey, ParagraphQuestion, PartNo, Unit } from "@/lib/types";
import { countWords } from "@/lib/wordcount";

export const MAX_CONCEPT_DESCRIPTION = 120;

/** What `content/shipped-ids.json` holds: every question and concept id that has shipped. */
export interface ShippedIds {
  questions: string[];
  concepts: string[];
  /**
   * Units removed on purpose. Their shipped question and concept ids may be absent from the
   * content (students' saved results for them stay in the database). A unit listed here must
   * not also exist.
   */
  retiredUnits?: string[];
}

/**
 * Concept list, tags and tombstones.
 *  - Any `concept` on a question must be a concept of its own unit (every unit).
 *  - A concept list is checked whenever it exists: ids unique and `<unit-id>.c-` prefixed,
 *    descriptions non-empty and one line.
 *  - `conceptsReady` needs concepts and a tag on every question.
 *  - A `retired` tombstone must be namespaced to the unit, must not be a live question, and
 *    must name a real concept, or be `null` (removed before the unit was tagged), but a
 *    concept-ready unit may not hold `null` tombstones.
 */
export function validateConceptRules(unit: Unit): string[] {
  const errors: string[] = [];
  const concepts = unit.concepts ?? [];

  const seen = new Set<string>();
  for (const c of concepts) {
    if (seen.has(c.id)) errors.push(`${unit.id}: duplicate concept id ${c.id}`);
    seen.add(c.id);
    if (!c.id.startsWith(`${unit.id}.c-`)) {
      errors.push(`${c.id}: concept id must start with "${unit.id}.c-"`);
    }
    if (!c.description.trim()) {
      errors.push(`${c.id}: concept description is empty`);
    } else if (c.description.length > MAX_CONCEPT_DESCRIPTION || /[\r\n]/.test(c.description)) {
      errors.push(`${c.id}: concept description must be one line of at most ${MAX_CONCEPT_DESCRIPTION} characters`);
    }
  }

  const conceptIds = new Set(concepts.map((c) => c.id));
  for (const q of unit.questions) {
    if (q.concept !== undefined && !conceptIds.has(q.concept)) {
      errors.push(`${q.id}: concept "${q.concept}" is not a concept of ${unit.id}`);
    }
    // a rewrite question may carry several concepts (spec 005)
    for (const c of q.concepts ?? []) {
      if (!conceptIds.has(c)) {
        errors.push(`${q.id}: concepts entry ${c} is not a concept of ${unit.id}`);
      }
    }
  }

  if (unit.conceptsReady) {
    if (concepts.length === 0) {
      errors.push(`${unit.id}: conceptsReady is set but the unit has no concepts (content/units/${unit.id}/concepts.ts)`);
    }
    for (const q of unit.questions) {
      if (q.concept === undefined && (!q.concepts || q.concepts.length === 0)) {
        errors.push(`${q.id}: has no concept tag, but ${unit.id} is marked conceptsReady`);
      }
    }
  }

  const live = new Set(unit.questions.map((q) => q.id));
  for (const [questionId, conceptId] of Object.entries(unit.retired ?? {})) {
    if (live.has(questionId)) {
      errors.push(`${questionId}: listed in retired but it is a live question in ${unit.id}`);
    }
    if (!questionId.startsWith(`${unit.id}.`)) {
      errors.push(`${questionId}: retired question id is not namespaced to ${unit.id}`);
    }
    if (conceptId === null) {
      if (unit.conceptsReady) {
        errors.push(
          `${questionId}: retired as null (no concept) but ${unit.id} is concept-ready; give it the concept it belonged to`,
        );
      }
    } else {
      const ids = Array.isArray(conceptId) ? conceptId : [conceptId];
      for (const id of ids) {
        if (!conceptIds.has(id)) {
          errors.push(`${questionId}: retired concept ${id} is not a concept of ${unit.id}`);
        }
      }
    }
  }

  return errors;
}

/**
 * Wrong-option explanations. Where present they must be well formed (keyed by a wrong
 * option's text, non-empty, never on a short question); an `explanationsComplete` unit must
 * also cover every wrong option of every MC question.
 */
export function validateExplanationRules(unit: Unit, answers: AnswerSet): string[] {
  const errors: string[] = [];
  for (const q of unit.questions) {
    const a = answers[q.id];
    if (!a) continue; // a missing answer entry is reported by the existing checks
    const explanations = a.wrongExplanations;

    if (q.type === "short") {
      if (explanations !== undefined) errors.push(`${q.id}: short questions cannot have wrongExplanations`);
      continue;
    }
    if (q.type === "rewrite" || q.type === "paragraph") continue; // no options to explain (spec 005, 007)

    const correct = a.correctText ?? (typeof a.correctIndex === "number" ? q.options[a.correctIndex] : undefined);
    if (explanations !== undefined) {
      for (const [option, text] of Object.entries(explanations)) {
        if (option === correct) {
          errors.push(`${q.id}: wrongExplanations has an entry for the correct option "${option}"`);
        } else if (!q.options.includes(option)) {
          errors.push(`${q.id}: wrongExplanations key "${option}" is not one of the options`);
        } else if (typeof text !== "string" || !text.trim()) {
          errors.push(`${q.id}: the explanation for "${option}" is empty`);
        }
      }
    }
    if (unit.explanationsComplete) {
      for (const option of q.options) {
        if (option === correct) continue;
        if (!explanations || !(option in explanations)) {
          errors.push(`${q.id}: no explanation for wrong option "${option}", but ${unit.id} is marked explanationsComplete`);
        }
      }
    }
  }
  return errors;
}

/**
 * Rewrite questions (spec 005 FR-008): every rewrite question has a model sentence and 1-3
 * target terms each with a definition; every target term's conceptId is a concept of the
 * unit; every `concepts[]` entry is a valid concept id; every concept of the unit appears in
 * at least 4 questions (FR-007).
 */
export function validateRewriteRules(unit: Unit, answers: AnswerSet): string[] {
  const errors: string[] = [];
  const conceptIds = new Set((unit.concepts ?? []).map((c) => c.id));
  const conceptTerms = new Map((unit.concepts ?? []).map((c) => [c.id, c.term]));
  const rewriteQuestions = unit.questions.filter((q) => q.type === "rewrite");
  if (rewriteQuestions.length === 0) return errors;

  const conceptCount = new Map<string, number>();
  for (const q of rewriteQuestions) {
    const a = answers[q.id];
    if (!a) continue; // a missing answer entry is reported by the existing checks
    if (!a.modelSentences || a.modelSentences.length === 0) {
      errors.push(`${q.id}: rewrite question needs at least one model sentence`);
    }
    const terms = a.targetTerms ?? [];
    if (terms.length < 1 || terms.length > 3) {
      errors.push(`${q.id}: rewrite question needs 1-3 target terms (got ${terms.length})`);
    }
    for (const t of terms) {
      if (!t.term.trim()) errors.push(`${q.id}: a target term has no term text`);
      if (!t.definition.trim()) errors.push(`${q.id}: target term "${t.term}" has no definition`);
      if (!conceptIds.has(t.conceptId)) {
        errors.push(`${q.id}: target term "${t.term}" concept ${t.conceptId} is not a concept of ${unit.id}`);
      } else if (conceptTerms.get(t.conceptId) !== t.term) {
        // "Concepts to review" shows the concept's term, so it must be the term being marked
        errors.push(`${q.id}: target term "${t.term}" does not match concept ${t.conceptId}'s term "${conceptTerms.get(t.conceptId) ?? ""}"`);
      }
      conceptCount.set(t.conceptId, (conceptCount.get(t.conceptId) ?? 0) + 1);
    }
  }
  for (const c of unit.concepts ?? []) {
    const count = conceptCount.get(c.id) ?? 0;
    if (count < 4) {
      errors.push(
        `${unit.id}: concept ${c.id} appears in ${count} rewrite question(s); every concept must appear in at least 4 (FR-007)`,
      );
    }
  }
  return errors;
}

/**
 * The memory the validator otherwise lacks. A shipped question id that is gone fails unless
 * the unit records it in `retired` (a renumber looks like a removal, so it fails too unless
 * its old id is tombstoned on purpose). A shipped concept id may never disappear. Ids that
 * are new since the snapshot are fine.
 */
export function validateShippedIds(snapshot: ShippedIds, units: Unit[]): string[] {
  const errors: string[] = [];
  const retiredUnits = snapshot.retiredUnits ?? [];
  const inRetiredUnit = (id: string) => retiredUnits.some((unitId) => id.startsWith(`${unitId}.`));

  for (const unitId of retiredUnits) {
    if (units.some((u) => u.id === unitId)) {
      errors.push(`${unitId}: listed in retiredUnits of content/shipped-ids.json but the unit still exists`);
    }
  }

  for (const questionId of snapshot.questions) {
    if (inRetiredUnit(questionId)) continue;
    // the longest matching unit id, in case one unit id is a prefix of another
    const owner = units
      .filter((u) => questionId.startsWith(`${u.id}.`))
      .sort((a, b) => b.id.length - a.id.length)[0];
    if (!owner) {
      errors.push(
        `${questionId}: shipped question id, but its unit no longer exists. If the unit was removed on purpose, ` +
          `add its id to retiredUnits in content/shipped-ids.json`,
      );
      continue;
    }
    if (owner.questions.some((q) => q.id === questionId)) continue;
    if (owner.retired && questionId in owner.retired) continue;
    errors.push(
      `${questionId}: shipped question id has disappeared from ${owner.id}. If it was removed on purpose, ` +
        `add it to retired in content/units/${owner.id}/concepts.ts (its concept, or null before the unit is tagged)`,
    );
  }

  const concepts = new Set(units.flatMap((u) => (u.concepts ?? []).map((c) => c.id)));
  for (const conceptId of snapshot.concepts) {
    if (inRetiredUnit(conceptId)) continue;
    if (!concepts.has(conceptId)) {
      errors.push(`${conceptId}: shipped concept id has disappeared; concept ids are never renamed, reused or removed`);
    }
  }

  return errors;
}


// ---- paragraph-writing rules (spec 007 FR-039, research R2) --------------------------------

const BRIEF_FIELDS: BriefField[] = ["economy", "argument", "counterpoint", "chainSteps", "facts", "limitation"];
const LIMITATION_TAGS = ["inequality", "sustainability", "external-shocks", "dependence", "time-lags"];
/** A figure placeholder from the design (US$x bn, 0.xxx), a TODO, or the design's own caveat. */
const PLACEHOLDER_RE = /\bUS\$x\b|\b0\.x{2,}\b|\bx{1,3}\b(?=\s*(?:bn|%|m\b))|\bTODO\b|\bTBC\b|supplied by the content task/i;
/** The shortest run of key text that must never appear in a public file. */
const LEAK_RUN = 30;
/**
 * A longer run for the essay question itself: it legitimately shares everyday wording with the model
 * ("the impact of globalisation on"), because the Link is meant to echo the question's words.
 */
const PROMPT_LEAK_RUN = 60;

/** Every number, percentage or year-like token in a text, e.g. "774%", "16.8%", "1986". */
function figuresIn(text: string): string[] {
  return (text.match(/\d[\d,]*(?:\.\d+)?%?/g) ?? []).map((t) => t.replace(/[,.]+$/, ""));
}

function briefText(b: EssayKey["brief"]): string {
  return [b.economy, b.argument, b.counterpoint, ...b.chainSteps, ...b.facts, ...b.limitation].join("\n");
}

/** Every string of an essay key that must stay server-side (models, notes, brief). */
function keyTexts(e: EssayKey): string[] {
  return [
    ...Object.values(e.models),
    ...Object.values(e.markingNotes),
    e.brief.argument,
    e.brief.counterpoint,
    ...e.brief.chainSteps,
    ...e.brief.facts,
    ...e.brief.limitation,
  ];
}

/**
 * Paragraph-writing rules: the 17 tips and their clear-after counts; the bank shape (five parts
 * per essay, ids `eNNpK` in order); per essay all five parts with a model within its word limit,
 * four guidance lines (the last naming the limit), the brief fields each part uses, commentary and
 * marking notes; the counterpoint thread (anchor phrases in the Topic Sentence and Evaluation
 * models); no figure in a model that the brief lacks (FR-007); no placeholder figures; a past
 * `figuresVerified` date; and no run of key text in any public file (Principle I).
 */
export function validateParagraphRules(unit: Unit, answers: AnswerSet, today: Date = new Date()): string[] {
  const errors: string[] = [];
  const questions = unit.questions.filter((q): q is ParagraphQuestion => q.type === "paragraph");
  if (questions.length === 0) return errors;

  // the 17 tips
  const concepts = new Map((unit.concepts ?? []).map((c) => [c.id, c]));
  if (concepts.size !== TIPS.length) {
    errors.push(`${unit.id}: expected the 17 tips as concepts, found ${concepts.size}`);
  }
  for (const tip of TIPS) {
    const c = concepts.get(tipConceptId(tip.slug));
    if (!c) errors.push(`${unit.id}: missing tip concept ${tipConceptId(tip.slug)}`);
    else if ((c.clearAfter ?? 3) !== tip.clearAfter) {
      errors.push(`${c.id}: clearAfter must be ${tip.clearAfter} (part tips 2, all-parts tips 3)`);
    }
  }

  // bank shape
  if (questions.length % 5 !== 0) errors.push(`${unit.id}: ${questions.length} paragraph questions; a bank is a multiple of 5 (5 parts per essay)`);
  const byEssay = new Map<string, ParagraphQuestion[]>();
  for (const q of questions) byEssay.set(q.essayId, [...(byEssay.get(q.essayId) ?? []), q]);

  const publicTexts: Array<{ text: string; run: number }> = [
    { text: unit.description, run: LEAK_RUN },
    ...(unit.guide?.items.map((i) => ({ text: i.text, run: LEAK_RUN })) ?? []),
    ...(unit.concepts ?? []).map((c) => ({ text: c.description, run: LEAK_RUN })),
    ...questions.map((q) => ({ text: q.prompt, run: PROMPT_LEAK_RUN })),
  ];

  let essayIndex = 0;
  for (const [essayId, qs] of byEssay) {
    essayIndex += 1;
    const label = `${unit.id} ${essayId}`;
    if (qs.length !== 5) errors.push(`${label}: ${qs.length} parts; an essay has 5 parts`);
    qs.forEach((q, i) => {
      if (q.part !== i + 1) errors.push(`${q.id}: part ${q.part} is out of order (expected part ${i + 1})`);
      if (q.id !== `${unit.id}.${essayId}p${i + 1}`) errors.push(`${q.id}: id must be ${unit.id}.${essayId}p${i + 1}`);
      if (q.essayNo !== essayIndex) errors.push(`${q.id}: essayNo ${q.essayNo} but this is essay ${essayIndex} in the bank`);
      if (q.maxMarks !== 4) errors.push(`${q.id}: maxMarks must be 4`);
      if (q.prompt !== qs[0].prompt || q.verb !== qs[0].verb) errors.push(`${q.id}: every part of an essay must share its question and verb`);
      const want = conceptIdsForPart(PART_ORDER[i]);
      if (JSON.stringify(q.concepts ?? []) !== JSON.stringify(want)) {
        errors.push(`${q.id}: concepts must be the part's tips ${want.join(", ")}`);
      }
    });

    const verb = qs[0].verb;
    if (!(verb in GLOSSARY)) errors.push(`${label}: verb "${verb}" is not in content/glossary.ts`);
    if (!new RegExp(`\\b${verb}\\b`, "i").test(qs[0].prompt)) errors.push(`${label}: the question does not contain its verb "${verb}"`);

    const key: EssayKey | undefined = answers[qs[0].id]?.paragraph?.essay;
    if (!key) {
      errors.push(`${label}: no essay key in answers.ts`);
      continue;
    }
    for (const q of qs) {
      if (answers[q.id]?.paragraph?.essay !== key) errors.push(`${q.id}: its answer entry must point at the essay's one key`);
    }
    if (key.essayId !== essayId) errors.push(`${label}: key essayId is ${key.essayId}`);

    // per part
    for (let i = 0; i < 5; i++) {
      const no = (i + 1) as PartNo;
      const limit = LIMITS[PART_ORDER[i]];
      const model = key.models[no];
      if (!model || !model.trim()) errors.push(`${label}: missing model for part ${no}`);
      else if (countWords(model) > limit) {
        errors.push(`${label}: part ${no} model is ${countWords(model)} words (limit ${limit})`);
      }
      const g = key.guidance[no];
      if (!g || g.length !== 4 || g.some((l) => !l.trim())) errors.push(`${label}: part ${no} needs 4 non-empty guidance lines`);
      else if (!g[3].includes(`${limit} words`)) errors.push(`${label}: part ${no} guidance line 4 must name the limit ("${limit} words")`);
      const uses = key.uses[no];
      if (!uses || uses.length === 0) errors.push(`${label}: part ${no} uses no brief field`);
      else for (const f of uses) if (!BRIEF_FIELDS.includes(f)) errors.push(`${label}: part ${no} uses unknown brief field "${f}"`);
      if (!key.commentary[no]?.trim()) errors.push(`${label}: part ${no} has no commentary`);
      if (!key.markingNotes[no]?.trim()) errors.push(`${label}: part ${no} has no marking notes`);
    }

    // brief fields present
    const b = key.brief;
    for (const [name, v] of Object.entries({ economy: b.economy, argument: b.argument, counterpoint: b.counterpoint })) {
      if (!v.trim()) errors.push(`${label}: brief ${name} is empty`);
    }
    for (const [name, v] of Object.entries({ chainSteps: b.chainSteps, facts: b.facts, limitation: b.limitation })) {
      if (v.length === 0 || v.some((x) => !x.trim())) errors.push(`${label}: brief ${name} is empty`);
    }

    // counterpoint thread
    if (!LIMITATION_TAGS.includes(key.limitation.tag)) errors.push(`${label}: unknown limitation tag "${key.limitation.tag}"`);
    if (!key.models[1]?.toLowerCase().includes(key.limitation.topicPhrase.toLowerCase())) {
      errors.push(`${label}: limitation.topicPhrase is not in the model Topic Sentence`);
    }
    if (!key.models[4]?.toLowerCase().includes(key.limitation.evaluationPhrase.toLowerCase())) {
      errors.push(`${label}: limitation.evaluationPhrase is not in the model Evaluation`);
    }

    // no new facts: every figure in a model is in the brief
    const brief = briefText(b);
    for (let i = 0; i < 5; i++) {
      const no = (i + 1) as PartNo;
      for (const fig of new Set(figuresIn(key.models[no] ?? ""))) {
        if (!brief.includes(fig)) errors.push(`${label}: part ${no} model has the figure "${fig}" that the brief does not`);
      }
    }

    // placeholders
    const everyText = [brief, ...Object.values(key.models), ...Object.values(key.commentary), ...Object.values(key.guidance).flat()];
    if (everyText.some((t) => PLACEHOLDER_RE.test(t))) errors.push(`${label}: contains a placeholder (US$x, 0.xxx, TODO, TBC or "supplied by the content task")`);

    // verified date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key.figuresVerified ?? "")) {
      errors.push(`${label}: figuresVerified must be an ISO date`);
    } else if (new Date(key.figuresVerified + "T00:00:00Z").getTime() > today.getTime()) {
      errors.push(`${label}: figuresVerified is in the future`);
    }

    // public files hold no key text (Principle I)
    for (const k of keyTexts(key)) {
      for (let s = 0; s + LEAK_RUN <= k.length; s += 5) {
        const hit = publicTexts.find((p) => s + p.run <= k.length && p.text.includes(k.slice(s, s + p.run)));
        if (hit !== undefined) {
          errors.push(`${label}: public text contains a run of key text ("${k.slice(s, s + 30)}…"): model parts, notes and the brief stay server-side`);
          break;
        }
      }
    }
  }
  return errors;
}
