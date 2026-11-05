// Pure scoring for the paragraph-writing unit (spec 007, research R4). No I/O, no secrets, no key:
// safe anywhere. The model supplies the judgements code cannot make (four verdicts and a reason
// each, a conventions reason, one feedback line); code decides the word-limit half of (d), the mark,
// the phase 2 cap, the higher-mark rule, the lost criteria and the tip outcomes.

import type { ParagraphCriterionVerdict, ParagraphVerdicts } from "@/lib/db/schema";
import { conceptIdsForPart, tipConceptId, type CriterionKey, type PartKey } from "@/lib/paragraph/parts";

export const PARAGRAPH_MAX_MARKS = 4;
/** A correction is worth at most this (FR-015). */
export const CORRECTION_CAP = 3;

export const CRITERIA: CriterionKey[] = ["a", "b", "c", "d"];

/** What the model returns once parsed (reasons and feedback already trimmed and capped). */
export interface RawMarkerVerdicts {
  a: { met: boolean; reason: string };
  b: { met: boolean; reason: string };
  c: { met: boolean; reason: string };
  conventions: { reason: string; preciseLanguage: boolean; noPadding: boolean };
  feedback: string;
}

/**
 * The four stored verdicts. Criterion d = precise language AND no padding AND within the word
 * limit. The word limit is decided here from the shared word count (FR-009), not by the model;
 * when over, the stored reason says so.
 */
export function buildVerdicts(raw: RawMarkerVerdicts, wordCount: number, limit: number): ParagraphVerdicts {
  const withinLimit = wordCount <= limit;
  const { preciseLanguage, noPadding } = raw.conventions;
  const reason = withinLimit
    ? raw.conventions.reason
    : `Over the ${limit}-word limit (${wordCount} words). ${raw.conventions.reason}`.trim();
  return {
    a: { met: raw.a.met, reason: raw.a.reason },
    b: { met: raw.b.met, reason: raw.b.reason },
    c: { met: raw.c.met, reason: raw.c.reason },
    d: {
      met: preciseLanguage && noPadding && withinLimit,
      reason,
      subs: { preciseLanguage, noPadding, withinLimit },
    },
  };
}

/** The mark: how many of the four criteria are met. */
export function markOf(v: ParagraphVerdicts): number {
  return CRITERIA.filter((k) => v[k].met).length;
}

/** The mark for a correction: the same count, capped at 3. */
export function phase2Mark(rawMark: number): number {
  return Math.min(rawMark, CORRECTION_CAP);
}

/** The recorded mark: the higher of the first try and the (already capped) correction. */
export function recordedMark(phase1: number, phase2?: number | null): number {
  return Math.max(phase1, phase2 ?? 0);
}

/** The criteria not met, in a-to-d order. */
export function lostCriteria(v: ParagraphVerdicts): CriterionKey[] {
  return CRITERIA.filter((k) => !v[k].met);
}

/**
 * The tip slugs to show for the lost criteria. Criterion d maps to the all-parts tips whose half
 * failed: precise language, and/or concise (padding or over the limit).
 */
export function lostTipSlugs(part: PartKey, v: ParagraphVerdicts): string[] {
  const slugs: string[] = [];
  for (const k of ["a", "b", "c"] as const) if (!v[k].met) slugs.push(`${part}-${k}`);
  if (!v.d.met) {
    const subs = v.d.subs;
    if (!subs || !subs.preciseLanguage) slugs.push("all-precise");
    if (!subs || !subs.noPadding || !subs.withinLimit) slugs.push("all-concise");
  }
  return slugs;
}

export interface ConceptOutcome {
  conceptId: string;
  correct: boolean;
}

/**
 * The five concept outcomes of a PHASE 1 (or a self-mark): the part's a, b, c tips and the two
 * all-parts tips. Stored on the result row; phase 2 and the FR-019a ending never add any.
 */
export function conceptOutcomes(part: PartKey, v: ParagraphVerdicts): ConceptOutcome[] {
  const ids = conceptIdsForPart(part);
  const precise = v.d.subs ? v.d.subs.preciseLanguage : v.d.met;
  const concise = v.d.subs ? v.d.subs.noPadding && v.d.subs.withinLimit : v.d.met;
  return [
    { conceptId: ids[0], correct: v.a.met },
    { conceptId: ids[1], correct: v.b.met },
    { conceptId: ids[2], correct: v.c.met },
    { conceptId: tipConceptId("all-precise"), correct: precise },
    { conceptId: tipConceptId("all-concise"), correct: concise },
  ];
}

/** Synthetic verdicts for the self-mark path: a tick is "met", with no reason and no halves. */
export function verdictsFromTicks(ticks: Record<CriterionKey, boolean>): ParagraphVerdicts {
  const one = (met: boolean): ParagraphCriterionVerdict => ({ met, reason: "" });
  return { a: one(ticks.a), b: one(ticks.b), c: one(ticks.c), d: one(ticks.d) };
}
