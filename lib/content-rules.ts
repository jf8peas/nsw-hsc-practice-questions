// Build-time content rules for concepts, tombstones and wrong-option explanations
// (constitution Principles III and IV; specs/002-learn-from-mistakes/research.md R1, R3).
//
// A plain module: no `server-only`, no I/O. scripts/validate-content.ts feeds it the loaded
// units and answer sets, and tests/content-rules.test.ts feeds it small fixtures. Every
// message starts with the unit or question id it is about.

import { GLOSSARY } from "@/content/glossary";
import { LIMITS, PART_ORDER, TIPS, conceptIdsForPart, tipConceptId } from "@/lib/paragraph/parts";
import { createHash } from "node:crypto";

import type { AnswerSet, BriefField, EssayKey, ParagraphQuestion, PartNo, Unit, UnseenQuestion, UnseenText } from "@/lib/types";
import { MEDIAN_WORDS } from "@/lib/unseen/limits";
import rubric from "@/lib/unseen/rubric.json";
import { SKILL_IDS, skillConceptId } from "@/lib/unseen/skills";
import { sourceOf } from "@/lib/unseen/source";
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
    // a unit that shares skill progress with another (spec 009 FR-022) lists that unit's concept ids for the shared skills
    const prefixes = [unit.id, ...(unit.sharesProgressWith ?? [])];
    if (!prefixes.some((p) => c.id.startsWith(`${p}.c-`))) {
      errors.push(`${c.id}: concept id must start with "${unit.id}.c-"${prefixes.length > 1 ? " (or the id of a unit it shares progress with)" : ""}`);
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
    if (q.type === "rewrite" || q.type === "paragraph" || q.type === "unseen" || q.type === "comparative") continue; // no options to explain (spec 005, 007, 008, 009)

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
export const PROMPT_LEAK_RUN = 60;

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

// ---- unseen-text rules (spec 008 FR-046, research R2) -------------------------------------------

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const isPastIsoDate = (value: string | undefined, today: Date): boolean =>
  typeof value === "string" && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value)) && value <= today.toISOString().slice(0, 10);

const squash = (v: string): string => v.replace(/\s+/g, " ").trim().toLowerCase();

/** True when `run` characters of `key` (checked every 5) appear in `publicText` outside the question's own stimulus. */
export function sharedRun(key: string, publicText: string, run: number, stimulus: string): boolean {
  const k = squash(key);
  const p = squash(publicText);
  const own = squash(stimulus);
  for (let i = 0; i + run <= k.length; i += 5) {
    const w = k.slice(i, i + run);
    if (p.includes(w) && !(own && own.includes(w))) return true;
  }
  return false;
}

/** The images folder's size limit (research R3). */
export const MAX_IMAGE_BYTES = 300 * 1024;

/** The public stimulus as one string, so quotation of it is not mistaken for a leak. */
export function renderStimulus(text: UnseenText): string {
  const body =
    text.body.kind === "poem" ? text.body.stanzas.flat().join("\n") : text.body.kind === "prose" ? text.body.paragraphs.join("\n") : "";
  return [text.title, text.author, body, ...(text.footnotes ?? []).map((f) => f.text)].join("\n");
}

/**
 * Unseen-text rules (spec 008 FR-046): every shipped question has a source in the school-paper
 * format, a resolvable text with an HSC check date, 1 to 3 skill tags, a mark value and verb, a
 * suggested length, the school's criteria with a band line per mark, a model answer a student could
 * submit, drafted material marked reviewed, and, for a visual text, an image within the size limit, a
 * neutral alt, a description and a passed, current description check. No key text appears in a public
 * string unless it is quotation of the question's own stimulus. `imageSizeOf` returns the size in bytes
 * of a text's image file, or null when there is none (the validator script supplies the file system).
 */
export function validateUnseenRules(
  unit: Unit,
  answers: AnswerSet,
  today: Date = new Date(),
  imageSizeOf: (imageName: string) => number | null = () => null,
): string[] {
  const errors: string[] = [];
  const questions = unit.questions.filter((q): q is UnseenQuestion => q.type === "unseen");
  if (questions.length === 0) return errors;

  // the seven skills as concepts, clearing after 2
  const concepts = new Map((unit.concepts ?? []).map((c) => [c.id, c]));
  for (const id of SKILL_IDS) {
    const c = concepts.get(skillConceptId(id));
    if (!c) errors.push(`${unit.id}: missing skill concept ${skillConceptId(id)}`);
    else if (c.clearAfter !== 2) errors.push(`${c.id}: clearAfter must be 2`);
  }
  if (concepts.size !== SKILL_IDS.length) errors.push(`${unit.id}: expected the 7 skills as concepts, found ${concepts.size}`);
  if (!unit.draw) errors.push(`${unit.id}: an unseen-text unit must declare draw: { kind: "unseen-weighted" }`);

  const texts = new Map<string, UnseenText>();
  for (const t of unit.texts ?? []) {
    if (texts.has(t.id)) errors.push(`${unit.id}: duplicate text id ${t.id}`);
    texts.set(t.id, t);
  }
  const used = new Set(questions.map((q) => q.textId));
  for (const t of texts.values()) if (!used.has(t.id)) errors.push(`${t.id}: no question points at this text`);

  const publicStrings: Array<{ text: string; run: number }> = [
    { text: unit.description, run: 40 },
    ...(unit.guide?.items.map((i) => ({ text: i.text, run: 40 })) ?? []),
    ...(unit.concepts ?? []).map((c) => ({ text: c.description, run: 40 })),
  ];
  const directiveVerbs = (rubric as { directiveVerbs: Record<string, string> }).directiveVerbs;
  const validTags = new Set(SKILL_IDS.map(skillConceptId));

  for (const q of questions) {
    const key = answers[q.id]?.unseen;
    const text = texts.get(q.textId);

    // 1. source
    if (!q.paper) errors.push(`${q.id}: no paper fields (school, year, exam, question number)`);
    else {
      if (![1, 2, 3, 4, 5].includes(q.paper.qNo)) errors.push(`${q.id}: paper.qNo must be 1 to 5`);
      if (q.paper.year < 2023 || q.paper.year > 2026) errors.push(`${q.id}: paper.year ${q.paper.year} is outside 2023 to 2026`);
      if (q.paper.exam !== "Trial" && q.paper.exam !== "Half-yearly") errors.push(`${q.id}: paper.exam must be Trial or Half-yearly`);
      if (q.source !== sourceOf(q.paper)) errors.push(`${q.id}: source "${q.source}" must be "${sourceOf(q.paper)}"`);
    }

    // 2. the text
    if (!text) errors.push(`${q.id}: text ${q.textId} not found`);
    else {
      if (!isPastIsoDate(text.hscChecked, today)) errors.push(`${text.id}: hscChecked must be a past ISO date (the text was compared with the NESA HSC papers)`);
      if ((text.form === "visual") !== (text.body.kind === "image")) errors.push(`${text.id}: form "${text.form}" does not match its body kind "${text.body.kind}"`);
      // the paper does not always give a title (an extract or an image has only its heading and author)
      if (!text.heading.trim()) errors.push(`${text.id}: the heading as on the paper is required`);
    }

    // 3. skill tags
    const tags = q.concepts ?? [];
    if (tags.length < 1 || tags.length > 3) errors.push(`${q.id}: needs 1 to 3 skill tags, has ${tags.length}`);
    if (new Set(tags).size !== tags.length) errors.push(`${q.id}: repeated skill tag`);
    for (const t of tags) if (!validTags.has(t)) errors.push(`${q.id}: concepts has "${t}", which is not one of the seven skills`);

    // 4. marks, parts, verb, outcome
    if (!Number.isInteger(q.maxMarks) || q.maxMarks < 1 || q.maxMarks > 6) errors.push(`${q.id}: maxMarks must be a whole number from 1 to 6`);
    if (q.parts && q.parts.reduce((n, p) => n + p.marks, 0) !== q.maxMarks) errors.push(`${q.id}: parts marks do not add up to maxMarks ${q.maxMarks}`);
    if (!(q.verb in directiveVerbs)) errors.push(`${q.id}: verb "${q.verb}" has no definition in lib/unseen/rubric.json directiveVerbs`);
    if (!["EAV-12-01", "EAV-12-02", "EAV-12-04"].includes(q.outcome)) errors.push(`${q.id}: outcome must be EAV-12-01, EAV-12-02 or EAV-12-04`);

    // 5. suggested length
    if (!Number.isInteger(q.suggestedWords) || q.suggestedWords <= 0) errors.push(`${q.id}: suggestedWords must be set`);
    else if (q.suggestedFrom === "lines" && q.suggestedWords % 12 !== 0) errors.push(`${q.id}: suggestedWords ${q.suggestedWords} must be answer lines × 12`);
    else if (q.suggestedFrom === "median" && q.suggestedWords !== MEDIAN_WORDS[q.maxMarks]) {
      errors.push(`${q.id}: suggestedWords ${q.suggestedWords} must be the median ${MEDIAN_WORDS[q.maxMarks]} for ${q.maxMarks} marks`);
    }

    // 6 and 7. the key
    if (!key) {
      errors.push(`${q.id}: no unseen answer key`);
      continue;
    }
    if (!key.criteria.trim()) errors.push(`${q.id}: criteria are empty`);
    else {
      const bands = new Set([...key.criteria.matchAll(/^\s*(\d+)\s*[–-]/gm)].map((m) => Number(m[1])));
      for (let m = q.maxMarks; m >= 1; m--) if (!bands.has(m)) errors.push(`${q.id}: criteria have no band line for ${m} mark${m === 1 ? "" : "s"}`);
    }
    if (!key.notes.trim()) errors.push(`${q.id}: notes are empty (use "None provided by the school.")`);
    const modelWords = countWords(key.model);
    const submittable = Math.floor((q.suggestedWords * 12) / 10);
    if (modelWords < 40) errors.push(`${q.id}: the model answer has ${modelWords} words; at least 40`);
    else if (Number.isInteger(q.suggestedWords) && modelWords > submittable) {
      errors.push(`${q.id}: the model answer has ${modelWords} words, more than a student could submit (${submittable})`);
    }
    if (key.modelOrigin === "drafted" || key.criteriaOrigin === "drafted") {
      if (!isPastIsoDate(key.reviewedOn, today)) errors.push(`${q.id}: drafted criteria or model answer need a reviewedOn date before the question ships`);
    }

    // 8. a visual text
    if (text?.body.kind === "image") {
      const body = text.body;
      const size = imageSizeOf(body.image);
      if (size === null) errors.push(`${text.id}: no image file for "${body.image}" in the unit's images folder`);
      else if (size > MAX_IMAGE_BYTES) errors.push(`${text.id}: the image is ${Math.round(size / 1024)} KB; at most ${MAX_IMAGE_BYTES / 1024} KB`);
      if (!body.alt.trim() || body.alt.length > 250) errors.push(`${text.id}: alt must be a short neutral label (1 to 250 characters)`);
      const visual = key.visual;
      if (!visual || !visual.description.trim()) errors.push(`${text.id}: no written description for the marker`);
      else {
        if (sharedRun(visual.description, body.alt, 40, "")) errors.push(`${text.id}: alt shares a 40-character run with the description (alt must not be the description)`);
        const check = visual.check;
        if (!check) errors.push(`${q.id}: the description check has not been run (npm run check-unseen-descriptions)`);
        else {
          if (!check.adequate) errors.push(`${q.id}: the description check failed: the description is not enough to mark from`);
          const hash = createHash("sha256").update(visual.description, "utf8").digest("hex");
          if (check.descriptionHash !== hash) errors.push(`${q.id}: the description changed since its check passed; rerun npm run check-unseen-descriptions`);
        }
      }
    }

    // 9. key text must not appear in public strings (quotation of the question's own stimulus is fine)
    const stimulus = text && text.body.kind !== "image" ? renderStimulus(text) : "";
    const keyStrings = [key.model, key.criteria, key.notes, key.visual?.description ?? ""].filter((k) => k.trim());
    const promptStrings: Array<{ text: string; run: number }> = [
      { text: q.prompt, run: PROMPT_LEAK_RUN },
      ...(q.parts ?? []).map((p) => ({ text: p.text, run: PROMPT_LEAK_RUN })),
    ];
    const own: Array<{ text: string; run: number }> = [
      { text: q.source ?? "", run: 40 },
      ...(text?.body.kind === "image" ? [{ text: text.body.alt, run: 40 }] : []),
    ];
    for (const k of keyStrings) {
      // the marking criteria restate the question's own wording, as school criteria do, so they are
      // not compared with the (public) prompt; the model answer, notes and description still are
      const against = k === key.criteria ? [...own, ...publicStrings] : [...promptStrings, ...own, ...publicStrings];
      for (const pub of against) {
        if (pub.text && sharedRun(k, pub.text, pub.run, stimulus)) {
          errors.push(`${q.id}: key text appears in public text "${pub.text.slice(0, 40)}…"`);
          break;
        }
      }
    }
  }
  return errors;
}
