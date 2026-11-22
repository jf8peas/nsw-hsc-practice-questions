import type { Concept } from "@/lib/types";
import { COMPARATIVE_SKILLS, comparativeSkillConceptId } from "@/lib/unseen/skills";

// PUBLIC: the nine tracked skills of this unit (spec 009 FR-019), one concept each, each clearing after 2
// first tries that show it. Seven are spec 008's skills and keep ITS concept ids (one count across both
// units, FR-022); the two comparison skills have this unit's own ids. The wording lives in
// lib/unseen/skills.json and lib/comparative/skills.json so the tip cards, this list and the marker's skill
// ids can never differ. Ids are never renamed or reused.

export const concepts: Concept[] = COMPARATIVE_SKILLS.map((s) => ({
  id: comparativeSkillConceptId(s.id),
  term: s.name,
  description: s.tip,
  clearAfter: 2,
}));

/** Questions removed from this unit, with the concepts each carried. None yet. */
export const retired: Record<string, string | string[] | null> = {};
