import type { Concept } from "@/lib/types";
import { TIPS, conceptIdsForPart, tipConceptId } from "@/lib/paragraph/parts";

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

/**
 * Questions removed from this unit, with the concepts each carried. e01 (Vietnam) and e02
 * (Bangladesh) were archived on 17 Nov 2026 (content/archive/y12-economics-paragraph-writing/).
 */
export const retired: Record<string, string | string[] | null> = {
  "y12-economics-paragraph-writing.e01p1": conceptIdsForPart("topic"),
  "y12-economics-paragraph-writing.e01p2": conceptIdsForPart("mechanism"),
  "y12-economics-paragraph-writing.e01p3": conceptIdsForPart("evidence"),
  "y12-economics-paragraph-writing.e01p4": conceptIdsForPart("evaluation"),
  "y12-economics-paragraph-writing.e01p5": conceptIdsForPart("link"),
  "y12-economics-paragraph-writing.e02p1": conceptIdsForPart("topic"),
  "y12-economics-paragraph-writing.e02p2": conceptIdsForPart("mechanism"),
  "y12-economics-paragraph-writing.e02p3": conceptIdsForPart("evidence"),
  "y12-economics-paragraph-writing.e02p4": conceptIdsForPart("evaluation"),
  "y12-economics-paragraph-writing.e02p5": conceptIdsForPart("link"),
};
