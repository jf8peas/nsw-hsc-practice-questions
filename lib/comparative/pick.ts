// The pick on a comparative choice question (spec 009 FR-008 to FR-010, research R5). Pure: no I/O, no key, safe in
// the browser bundle, so the quiz screen and the server apply exactly the same rule.

import type { ComparativeChoice } from "@/lib/types";

/** What the picking rule needs of a question (a ComparativeQuestion satisfies it). */
export interface PickableQuestion {
  textIds: readonly string[];
  choice: ComparativeChoice | null;
}

/**
 * True when `pick` is a complete, allowed pick for the choice: an array of distinct text ids, exactly `choice.pick`
 * of them, every one in `choice.from`. A fixed pair (no choice) has no pick.
 */
export function isCompletePick(choice: ComparativeChoice | null, pick: unknown): pick is string[] {
  if (choice === null) return false;
  if (!Array.isArray(pick) || !pick.every((p) => typeof p === "string")) return false;
  const ids = pick as string[];
  return new Set(ids).size === ids.length && ids.length === choice.pick && ids.every((id) => choice.from.includes(id));
}

/** A pick in the order the tabs show the texts, so the same pick is always stored and compared the same way. */
export function tabOrder(question: PickableQuestion, pick: readonly string[]): string[] {
  return question.textIds.filter((id) => pick.includes(id));
}

/** True when two picks name the same texts, whatever their order. */
export function samePick(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/**
 * The text ids the answer is about, in tab order: both texts of a fixed pair, or a choice question's fixed texts and
 * the student's pick. Null when a choice question has no complete pick.
 */
export function pickedTextIdsOf(question: PickableQuestion, pick: readonly string[] | undefined): string[] | null {
  if (question.choice === null) return [...question.textIds];
  if (!isCompletePick(question.choice, pick)) return null;
  const all = new Set([...question.choice.fixed, ...pick]);
  return question.textIds.filter((id) => all.has(id));
}
