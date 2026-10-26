import "server-only";

import { randomInt } from "node:crypto";

import { getQuestion } from "@/content";
import type { Question, Unit } from "@/lib/types";

/** A source of random integers in [0, max). Injectable so tests can be deterministic. */
export type RandomInt = (max: number) => number;

export const DEFAULT_PASS_MARK = 70;

export interface Drawn {
  /** The ordered question ids for this attempt. */
  questionIds: string[];
  /** { [mc questionId]: optionOrder } where optionOrder[displayIndex] = original option index. */
  mcOptionOrder: Record<string, number[]>;
}

function shuffle<T>(items: readonly T[], rand: RandomInt): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(items: readonly T[], n: number, rand: RandomInt): T[] {
  return shuffle(items, rand).slice(0, n);
}

/**
 * Draw the questions for a new attempt. This is `prepare()` from the old
 * components/Quiz.tsx, moved server-side, with the same behaviour:
 *  - `meta.quiz.groups`: draw n from each named group, in listed order;
 *  - otherwise short answers first, then MC, random within each (`quiz.short` /
 *    `quiz.mc` counts, or everything when the unit has no `quiz` config).
 * Each MC question gets a random option order, stored on the attempt.
 */
export function drawAttempt(unit: Unit, rand: RandomInt = randomInt): Drawn {
  let chosen: Question[];
  if (unit.quiz?.groups) {
    chosen = unit.quiz.groups.flatMap(({ group, n }) =>
      pick(unit.questions.filter((q) => q.group === group), n, rand),
    );
  } else {
    const shorts = unit.questions.filter((q) => q.type === "short");
    const mcs = unit.questions.filter((q) => q.type === "mc");
    chosen = unit.quiz
      ? [...pick(shorts, unit.quiz.short, rand), ...pick(mcs, unit.quiz.mc, rand)]
      : [...shuffle(shorts, rand), ...shuffle(mcs, rand)];
  }

  const mcOptionOrder: Record<string, number[]> = {};
  for (const q of chosen) {
    if (q.type === "mc") {
      mcOptionOrder[q.id] = shuffle(
        q.options.map((_, i) => i),
        rand,
      );
    }
  }
  return { questionIds: chosen.map((q) => q.id), mcOptionOrder };
}

/**
 * The public questions for an attempt, in quiz order, with MC options already
 * in display order. Uses only public content (never content/answers). Ids that
 * no longer exist in content (retired questions) are skipped.
 */
export function toPublicQuestions(
  questionIds: readonly string[],
  mcOptionOrder: Record<string, number[]>,
): Question[] {
  const out: Question[] = [];
  for (const id of questionIds) {
    const found = getQuestion(id);
    if (!found) continue;
    const q = found.question;
    if (q.type === "mc") {
      const order = mcOptionOrder[id];
      const options = order && order.length === q.options.length ? order.map((i) => q.options[i]) : q.options;
      out.push({ ...q, options });
    } else {
      out.push(q);
    }
  }
  return out;
}
