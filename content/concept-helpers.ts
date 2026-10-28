import type { Concept, Question } from "@/lib/types";

// PUBLIC — helpers for a unit's concepts.ts and concept-tags.ts (spec 002). No answer keys.

/** Concepts for a unit: `[slug, one-line description]` pairs become `{ id: "<unit>.c-<slug>", description }`. */
export function defineConcepts(unitId: string, list: Array<[slug: string, description: string]>): Concept[] {
  return list.map(([slug, description]) => ({ id: `${unitId}.c-${slug}`, description }));
}

/** The questions with their `concept` set from a `{ questionId: conceptId }` map. */
export function tagQuestions(questions: Question[], tags: Record<string, string>): Question[] {
  return questions.map((q) => ({ ...q, concept: tags[q.id] }));
}

/**
 * `{ conceptSlug: ["m01", "s02", ...] }` (question numbers within the unit) becomes
 * `{ questionId: conceptId }`. A question tagged twice, or a concept slug that is not in `concepts`,
 * is an error at load time; a question left out is caught by `npm run validate`.
 */
export function defineTags(
  unitId: string,
  concepts: Concept[],
  tags: Record<string, string[]>,
): Record<string, string> {
  const known = new Set(concepts.map((c) => c.id));
  const out: Record<string, string> = {};
  for (const [slug, numbers] of Object.entries(tags)) {
    const conceptId = `${unitId}.c-${slug}`;
    if (!known.has(conceptId)) throw new Error(`${conceptId} is tagged but is not in concepts.ts`);
    for (const n of numbers) {
      const id = `${unitId}.${n}`;
      if (id in out) throw new Error(`${id} is tagged twice (${slug})`);
      out[id] = conceptId;
    }
  }
  return out;
}
