// Pure scoring for the unseen-text unit (spec 008, research R5, R8, R10). No I/O, no secrets, no key:
// safe anywhere. The model supplies the mark and the seven verdicts; code decides the retry cap, the
// higher-mark rule, the no-retry rule for a 1-mark question, the first-try concept outcomes and the
// summary wording.

import type { SkillVerdicts } from "@/lib/db/schema";
import { SKILL_IDS, skillConceptId, type SkillId } from "@/lib/unseen/skills";
import type { UnseenEnding } from "@/lib/unseen/types";

/** A retry is offered below full marks, and never on a 1-mark question (its cap would be 0). */
export function retryOffered(mark: number, maxMarks: number): boolean {
  return mark < maxMarks && maxMarks > 1;
}

/** A retry earns at most one mark below full marks (FR-020). */
export function retryCap(maxMarks: number): number {
  return maxMarks - 1;
}

export function cappedMark(rawMark: number, maxMarks: number): number {
  return Math.min(rawMark, retryCap(maxMarks));
}

/** The recorded mark: the higher of the first try and the (already capped) retry. */
export function recordedMark(try1: number, try2?: number | null): number {
  return Math.max(try1, try2 ?? 0);
}

/** How a question ends straight after its first try, or null when a retry choice follows. */
export function endingAfterFirstTry(mark: number, maxMarks: number): UnseenEnding | null {
  if (mark >= maxMarks) return "full_marks";
  if (!retryOffered(mark, maxMarks)) return "no_retry";
  return null;
}

/** Skill ids in rubric order. */
export function missedSkills(v: SkillVerdicts): SkillId[] {
  return SKILL_IDS.filter((id) => !v[id].met);
}

export function metSkills(v: SkillVerdicts): SkillId[] {
  return SKILL_IDS.filter((id) => v[id].met);
}

export interface ConceptOutcome {
  conceptId: string;
  correct: boolean;
}

/**
 * The seven concept outcomes of the FIRST try, in rubric order, whatever the question's tags
 * (spec 008 FR-026). Stored on the result row; the retry and a decline never add any.
 */
export function conceptOutcomes(try1: SkillVerdicts): ConceptOutcome[] {
  return SKILL_IDS.map((id) => ({ conceptId: skillConceptId(id), correct: try1[id].met }));
}

export type Pill = "first-try" | "fixed-in-retry" | "missed";

/** First try if met on the first try; Fixed in retry if met only in the retry; else Missed. */
export function pillFor(id: SkillId, try1: SkillVerdicts, try2?: SkillVerdicts | null): Pill {
  if (try1[id].met) return "first-try";
  if (try2?.[id].met) return "fixed-in-retry";
  return "missed";
}

export const PILL_LABEL: Record<Pill, string> = {
  "first-try": "First try",
  "fixed-in-retry": "Fixed in retry",
  missed: "Missed",
};

/** The summary lines under the recorded mark at the discussion (data-model.md §3.3). */
export function summaryLines(input: {
  ending: UnseenEnding;
  try1Mark: number;
  try2Mark?: number | null;
  maxMarks: number;
}): string[] {
  const { ending, try1Mark, try2Mark, maxMarks } = input;
  const recorded = recordedMark(try1Mark, try2Mark);
  if (ending === "full_marks") return ["Full marks on your first try."];
  if (ending === "no_retry") return [`Your first try is recorded: ${recorded} / ${maxMarks}.`];
  if (ending === "declined") return [`You skipped the retry, so your first try is recorded: ${recorded} / ${maxMarks}.`];
  const lines: string[] = [];
  if (try2Mark !== null && try2Mark !== undefined && try2Mark >= retryCap(maxMarks)) {
    lines.push(
      `A retry can earn at most ${retryCap(maxMarks)} out of ${maxMarks}. Meet every skill on the first try next time for the full ${maxMarks}.`,
    );
  }
  if (try2Mark !== null && try2Mark !== undefined && try1Mark > try2Mark) {
    lines.push(`Your recorded mark is ${recorded} / ${maxMarks} (your better try).`);
  }
  return lines;
}
