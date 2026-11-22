// The seven tracked skills of the Advanced English unseen-text unit (spec 008 FR-025). PUBLIC: the
// tips reach the browser (the retry's tip cards and "Things I need to know") and hold no answers.
// The prompt file lib/unseen/rubric.json is server-only; this file and the pilot script read the
// same skills.json so the ids, names and tips can never differ.

import comparativeSkillsJson from "../comparative/skills.json";
import skillsJson from "./skills.json";

export const SKILL_IDS = [
  "answers-question",
  "directive-verb",
  "analyses-not-retells",
  "technique-effect",
  "apt-evidence",
  "human-experience",
  "succinct",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export interface Skill {
  id: SkillId;
  name: string;
  /** One sentence of advice, shown on the retry's tip cards and in "Things I need to know". */
  tip: string;
  /** What a full-mark answer does, in one line. */
  description: string;
}

export const SKILLS: readonly Skill[] = skillsJson as unknown as Skill[];

export const UNIT_ID = "y12-english-advanced-unseen-texts";

export const skillConceptId = (id: SkillId): string => `${UNIT_ID}.c-${id}`;

export function skillOfConcept(conceptId: string): SkillId | null {
  const found = SKILL_IDS.find((id) => skillConceptId(id) === conceptId);
  return found ?? null;
}

/** Any of the nine skills (the seven shared ones are spec 008's; the two comparison skills are the comparative unit's). */
export const skillById = (id: ComparativeSkillId): Skill => COMPARATIVE_SKILLS.find((s) => s.id === id)! as unknown as Skill;

// ---- the comparative unit's nine skills (spec 009 FR-019, FR-021) ---------------------------------
// The seven above are shared with spec 008 (same ids, names and tips, one count across both units);
// the two below belong to the comparative unit and live in lib/comparative/skills.json. PUBLIC.

export const COMPARATIVE_ONLY_SKILL_IDS = ["compares-texts", "treats-both-in-depth"] as const;
export type ComparativeOnlySkillId = (typeof COMPARATIVE_ONLY_SKILL_IDS)[number];

/** The nine skills of the comparative unit, in rubric order: the seven, then the two comparison skills. */
export const COMPARATIVE_SKILL_IDS = [...SKILL_IDS, ...COMPARATIVE_ONLY_SKILL_IDS] as const;
export type ComparativeSkillId = SkillId | ComparativeOnlySkillId;

export interface ComparativeSkill {
  id: ComparativeSkillId;
  name: string;
  tip: string;
  description: string;
}

export const COMPARATIVE_SKILLS: readonly ComparativeSkill[] = [...SKILLS, ...(comparativeSkillsJson as unknown as ComparativeSkill[])];

export const COMPARATIVE_UNIT_ID = "y12-english-advanced-comparative-texts";

/** A comparative skill's concept id: the seven shared skills keep spec 008's ids (one count across both units). */
export const comparativeSkillConceptId = (id: ComparativeSkillId): string =>
  (COMPARATIVE_ONLY_SKILL_IDS as readonly string[]).includes(id) ? `${COMPARATIVE_UNIT_ID}.c-${id}` : skillConceptId(id as SkillId);

export function comparativeSkillOfConcept(conceptId: string): ComparativeSkillId | null {
  return COMPARATIVE_SKILL_IDS.find((id) => comparativeSkillConceptId(id) === conceptId) ?? null;
}

export const comparativeSkillById = (id: ComparativeSkillId): ComparativeSkill => COMPARATIVE_SKILLS.find((s) => s.id === id)!;
