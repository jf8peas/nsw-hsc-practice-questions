import type { Concept } from "@/lib/types";
import { TIPS, tipConceptId } from "@/lib/paragraph/parts";

// PUBLIC — the 17 tracked writing tips of this unit (spec 007): three per part and the two
// shared conventions tips, one per criterion. Wording lives in lib/paragraph/parts.ts so the tip
// cards and this list can never differ. The connectors advice is feedback only and is NOT a
// concept. Ids are `<unit-id>.c-<slug>`, never renamed or reused. Part tips clear after 2 correct
// first tries, all-parts tips after 3 (`clearAfter`).

export const concepts: Concept[] = TIPS.map((t) => ({
  id: tipConceptId(t.slug),
  term: t.term,
  description: t.description,
  clearAfter: t.clearAfter,
}));

/** Questions removed from this unit, with the concept(s) each carried. None so far. */
export const retired: Record<string, string | string[] | null> = {};
