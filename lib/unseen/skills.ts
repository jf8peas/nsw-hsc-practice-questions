// The seven tracked skills of the Advanced English unseen-text unit (spec 008 FR-025). PUBLIC: the
// tips reach the browser (the retry's tip cards and "Things I need to know") and hold no answers.
// The prompt file lib/unseen/rubric.json is server-only; this file and the pilot script read the
// same skills.json so the ids, names and tips can never differ.

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

export const skillById = (id: SkillId): Skill => SKILLS.find((s) => s.id === id)!;
