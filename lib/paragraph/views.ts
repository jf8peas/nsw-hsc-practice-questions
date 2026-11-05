// Pure helpers over the criterion views a browser receives (spec 007). No key, no I/O: safe in the
// browser bundle. They give the same answer as lib/paragraph/scoring.ts does from stored verdicts.

import type { CriterionView } from "@/lib/paragraph/types";
import type { PartKey } from "@/lib/paragraph/parts";

/**
 * The tip slugs for the criteria NOT met, in a-to-d order. Criterion d maps to the all-parts tips
 * whose half failed: precise language, and/or concise (padding, or over the word limit). A d with
 * no recorded halves (the self-mark path) is both.
 */
export function lostTipSlugsFromViews(part: PartKey, criteria: CriterionView[]): string[] {
  const slugs: string[] = [];
  for (const c of criteria) {
    if (c.met) continue;
    if (c.key !== "d") {
      slugs.push(`${part}-${c.key}`);
      continue;
    }
    const subs = c.subs;
    if (!subs || !subs.preciseLanguage) slugs.push("all-precise");
    if (!subs || !subs.noPadding || !subs.withinLimit) slugs.push("all-concise");
  }
  return slugs;
}
