import conceptList from "@/lib/essay/concepts.json";
import { TIPS } from "@/lib/paragraph/parts";
import type { Concept } from "@/lib/types";

// PUBLIC — the essay unit's tracked concepts (spec 010 FR-039). The list lives in lib/essay/concepts.json,
// the one file the app's marker (lib/essay/marker.server.ts) and scripts/pilot-essay-marker.py both read for
// the prompt's concept list, so the marker can only name ids that are here. It is a separate file from
// rubric.json (the marker prompt and band descriptors) so the prompt never reaches a browser bundle. Ids are `<unit-id>.c-<key>`, never renamed or reused. A gap
// clears after 2 later essays use the concept correctly (`clearAfter: 2`), on a different essay.
// Three shared skills take their wording from spec 007's matching writing tips so one sentence says one thing.

const UNIT = "y12-economics-essay-writing";
const tip = (slug: string): string => TIPS.find((t) => t.slug === slug)!.description;

const FROM_PARAGRAPH_TIPS: Record<string, string> = {
  "skill-models": tip("mechanism-c"),
  "skill-data-as-evidence": tip("evidence-a"),
  "skill-judgement": tip("link-a"),
};

export const conceptId = (key: string) => `${UNIT}.c-${key}`;

/** A rubric key from a concept id (undefined for an id that is not in the list). */
export function conceptKeyOf(id: string): string | undefined {
  const key = id.startsWith(`${UNIT}.c-`) ? id.slice(`${UNIT}.c-`.length) : undefined;
  return key && key in (conceptList as Record<string, string>) ? key : undefined;
}

export const concepts: Concept[] = Object.entries(conceptList as Record<string, string>).map(([key, line]) => {
  const colon = line.indexOf(":");
  const term = colon > 0 ? line.slice(0, colon).trim() : key;
  return {
    id: conceptId(key),
    term,
    description: FROM_PARAGRAPH_TIPS[key] ?? (colon > 0 ? line.slice(colon + 1).trim() : line),
    clearAfter: 2 as const,
  };
});

/** Questions removed from this unit, with the concepts each carried. None yet. */
export const retired: Record<string, string | string[] | null> = {};
