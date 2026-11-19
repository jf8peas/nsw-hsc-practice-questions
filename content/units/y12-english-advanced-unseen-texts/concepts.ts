import type { Concept } from "@/lib/types";
import { SKILLS, skillConceptId } from "@/lib/unseen/skills";

// PUBLIC: the seven tracked skills of this unit (spec 008 FR-025), one concept each, each clearing
// after 2 first tries that show it. The wording lives in lib/unseen/skills.json so the tip cards, this
// list and the marker's skill ids can never differ. Ids are `<unit-id>.c-<skill id>`, never renamed or
// reused.

export const concepts: Concept[] = SKILLS.map((s) => ({
  id: skillConceptId(s.id),
  term: s.name,
  description: s.tip,
  clearAfter: 2,
}));

/** Questions removed from this unit, with the concepts each carried. None yet. */
export const retired: Record<string, string | string[] | null> = {};
