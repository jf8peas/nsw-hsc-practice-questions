// Build-time content rules for concepts, tombstones and wrong-option explanations
// (constitution Principles III and IV; specs/002-learn-from-mistakes/research.md R1, R3).
//
// A plain module: no `server-only`, no I/O. scripts/validate-content.ts feeds it the loaded
// units and answer sets, and tests/content-rules.test.ts feeds it small fixtures. Every
// message starts with the unit or question id it is about.

import type { AnswerSet, Unit } from "@/lib/types";

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
    if (q.type === "rewrite") continue; // no options to explain (spec 005)

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
