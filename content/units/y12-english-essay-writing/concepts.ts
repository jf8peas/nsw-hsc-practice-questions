import type { Concept } from "@/lib/types";

// PUBLIC — the English essay unit's tracked concepts (spec 011, data-model §1.4). ONE source: this record builds the
// public `Concept[]`, the TypeScript marker prompt (lib/english-essay/marker.server.ts) and, through
// scripts/english-essay-concepts-json.ts, the Python pilot's concept list, so the marker can only name ids that exist.
// `line` is the prompt wording (identical to the approved eng-essay-pilot-5 list); `term` is the short name shown to
// the student. Ids are `<unit-id>.c-<key>`, never renamed or reused; reviewed content may append keys. A list edit
// changes the prompt hash: it needs a new `promptVersion`, regenerated golden fixtures and a fresh marker gate.
// A gap clears after 2 correct uses on a later, different essay (`clearAfter: 2`).

const UNIT = "y12-english-essay-writing";

export interface EnglishConceptEntry {
  term: string;
  line: string;
}

export const ENGLISH_ESSAY_CONCEPTS: Record<string, EnglishConceptEntry> = {
  "away-tom-mortality": {
    term: "Tom and mortality",
    line: "Away: Tom's terminal illness, the secret he keeps from his parents, and how he faces death",
  },
  "away-coral-grief": {
    term: "Coral's grief",
    line: "Away: Coral's grief for her son killed in Vietnam, and Roy's insistence that she 'go on'",
  },
  "away-gwen-fear": {
    term: "Gwen's fear and control",
    line: "Away: Gwen's anxiety, control and materialism, rooted in the Depression, and her change at the beach",
  },
  "away-class-migrants": {
    term: "Class and migrants",
    line: "Away: class prejudice and attitudes to English migrants (Gwen and the campers on Harry and Vic)",
  },
  "away-meg-independence": {
    term: "Meg's independence",
    line: "Away: Meg's challenge to her mother and generational conflict",
  },
  "away-harry-vic-acceptance": {
    term: "Harry and Vic's acceptance",
    line: "Away: Harry and Vic's acceptance and their choice to live in the present",
  },
  "away-storm-catalyst": {
    term: "The storm as catalyst",
    line: "Away: the storm as a catalyst that strips the characters back and moves them to the beach",
  },
  "away-shakespeare-frame": {
    term: "The Shakespeare frame",
    line: "Away: the Shakespeare frame (A Midsummer Night's Dream opening, King Lear ending) and what it suggests",
  },
  "away-play-within-play": {
    term: "The play within the play",
    line: "Away: the amateur-night play (the sailor and the mermaid) as healing for Coral and for Tom",
  },
  "away-context-1967": {
    term: "The 1967-68 context",
    line: "Away: the 1967-68 context (Vietnam and conscription, post-war prosperity, 'standard of living')",
  },
  "away-symbols": {
    term: "Objects and symbols",
    line: "Away: objects and symbols (the brooch, the carton and slippers, the Bex powders, the shells, the beach)",
  },
  "skill-answers-question": {
    term: "Answering the question",
    line: "Engaging the question's own terms in every paragraph, not a prepared essay",
  },
  "skill-thesis": {
    term: "A sustained thesis",
    line: "A clear thesis that takes a position and is sustained to the conclusion",
  },
  "skill-analysis-not-recount": {
    term: "Analysis, not recount",
    line: "Analysing how meaning is made rather than retelling the plot",
  },
  "skill-technique-effect": {
    term: "Technique and effect",
    line: "Naming a technique and explaining its effect on meaning, not just listing it",
  },
  "skill-dramatic-form": {
    term: "Dramatic form",
    line: "Using the features of drama (stage directions, dialogue, staging, structure, dramatic irony) with accurate terms",
  },
  "skill-apt-evidence": {
    term: "Apt evidence",
    line: "Choosing well-selected, accurately quoted evidence from across the text and integrating it into sentences",
  },
  "skill-human-experience": {
    term: "Human experience",
    line: "Linking the analysis to human experience and a personal, enriched understanding",
  },
  "skill-expression": {
    term: "Controlled expression",
    line: "Clear, controlled, concise expression without wordiness",
  },
};

export const conceptId = (key: string) => `${UNIT}.c-${key}`;

/** The eight writing-skill keys: the only ids a question's public `conceptIds` may carry. */
export const ENGLISH_SKILL_KEYS = Object.keys(ENGLISH_ESSAY_CONCEPTS).filter((k) => k.startsWith("skill-"));
export const ENGLISH_SKILL_IDS = ENGLISH_SKILL_KEYS.map(conceptId);
export const ENGLISH_AWAY_KEYS = Object.keys(ENGLISH_ESSAY_CONCEPTS).filter((k) => k.startsWith("away-"));

/** The prompt's key to line map: exactly the list the pilot ships (key order is the record order). */
export function englishConceptLines(): Record<string, string> {
  return Object.fromEntries(Object.entries(ENGLISH_ESSAY_CONCEPTS).map(([k, v]) => [k, v.line]));
}

/** A concept key from a concept id (undefined for an id that is not in the list). */
export function conceptKeyOf(id: string): string | undefined {
  const key = id.startsWith(`${UNIT}.c-`) ? id.slice(`${UNIT}.c-`.length) : undefined;
  return key && key in ENGLISH_ESSAY_CONCEPTS ? key : undefined;
}

export const concepts: Concept[] = Object.entries(ENGLISH_ESSAY_CONCEPTS).map(([key, entry]) => ({
  id: conceptId(key),
  term: entry.term,
  description: entry.line,
  clearAfter: 2 as const,
}));

/** Questions removed from this unit, with the concepts each carried. None yet. */
export const retired: Record<string, string | string[] | null> = {};
