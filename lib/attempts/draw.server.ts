import "server-only";

import { randomInt } from "node:crypto";

import { getQuestion } from "@/content";
import type { Weighting } from "@/lib/concepts/weighting.server";
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

interface Quota {
  /** The group name (or "short" / "mc" for a unit that draws by type). */
  key: string;
  /** How many this quiz draws from the group, limited to what the bank has. */
  want: number;
  /** Every bank question in the group. */
  pool: Question[];
}

/** The quiz's shape as groups with quotas, in the order the quiz presents them; null if it has none. */
function quotasOf(unit: Unit): Quota[] | null {
  if (!unit.quiz) return null; // the whole bank is drawn: there is nothing to weight
  const specs = unit.quiz.groups
    ? unit.quiz.groups.map(({ group, n }) => ({ key: group, n, pool: unit.questions.filter((q) => q.group === group) }))
    : [
        { key: "short", n: unit.quiz.short, pool: unit.questions.filter((q) => q.type === "short") },
        { key: "mc", n: unit.quiz.mc, pool: unit.questions.filter((q) => q.type === "mc") },
      ];
  return specs.map((s) => ({ key: s.key, want: Math.min(s.n, s.pool.length), pool: s.pool }));
}

/**
 * A quiz weighted toward the student's weak concepts (spec 002 FR-033 to FR-038, research R4).
 * Exactly half the places, rounded up, go to questions on their uncleared concepts whenever
 * enough exist; the rest are drawn as usual. Returns null when it cannot apply, so the caller
 * falls back to the ordinary draw.
 *
 * Weighted picks go round-robin across the concepts (highest count, then most recently missed)
 * so no concept takes every weighted place while others have questions. For each pick the
 * preference is: unseen within the unit's usual group mix; seen (last answered wrong first, then
 * least recently) within the mix; unseen over the mix; seen over the mix. Exact half comes first;
 * the usual MC / short-answer mix is kept only as far as it does not cost a weighted place.
 */
function drawWeighted(unit: Unit, weighting: Weighting, rand: RandomInt): Question[] | null {
  const quotas = quotasOf(unit);
  if (!quotas) return null;
  const total = quotas.reduce((sum, q) => sum + q.want, 0);
  if (total === 0) return null;
  const places = Math.ceil(total / 2);

  const groupOf = new Map<string, Quota>();
  for (const q of quotas) for (const question of q.pool) groupOf.set(question.id, q);

  // candidates per concept, in the order a pick should take them
  const seenFirst = (id: string) => weighting.seen.has(id);
  const lists = weighting.states.map((state) => {
    const mine = unit.questions.filter((q) => q.concept === state.conceptId && groupOf.has(q.id));
    const unseen = shuffle(
      mine.filter((q) => !seenFirst(q.id)),
      rand,
    );
    const seen = shuffle(
      mine.filter((q) => seenFirst(q.id)),
      rand,
    ).sort((a, b) => {
      const la = weighting.lastAnswer.get(a.id);
      const lb = weighting.lastAnswer.get(b.id);
      const wrongA = la && !la.correct ? 0 : 1;
      const wrongB = lb && !lb.correct ? 0 : 1;
      return wrongA - wrongB || (la?.at.getTime() ?? 0) - (lb?.at.getTime() ?? 0);
    });
    return { unseen, seen };
  });

  const taken = new Set<string>();
  const used = new Map<Quota, number>(quotas.map((q) => [q, 0]));
  const weightedPicks: Question[] = [];
  const room = (q: Quota) => (used.get(q) ?? 0) < q.want;

  const passes: Array<{ from: "unseen" | "seen"; withinMix: boolean }> = [
    { from: "unseen", withinMix: true },
    { from: "seen", withinMix: true },
    { from: "unseen", withinMix: false },
    { from: "seen", withinMix: false },
  ];
  for (const pass of passes) {
    let progressed = true;
    while (weightedPicks.length < places && progressed) {
      progressed = false;
      for (const list of lists) {
        if (weightedPicks.length >= places) break;
        const next = list[pass.from].find((q) => !taken.has(q.id) && (!pass.withinMix || room(groupOf.get(q.id)!)));
        if (!next) continue;
        taken.add(next.id);
        weightedPicks.push(next);
        used.set(groupOf.get(next.id)!, (used.get(groupOf.get(next.id)!) ?? 0) + 1);
        progressed = true;
      }
    }
    if (weightedPicks.length >= places) break;
  }

  // the rest are drawn as usual: each group's remaining quota, trimmed from the largest if a
  // group went over its quota, so the quiz is the same length as an ordinary one
  const remaining = quotas.map((q) => Math.max(0, q.want - (used.get(q) ?? 0)));
  const spare = total - weightedPicks.length;
  let sum = remaining.reduce((a, b) => a + b, 0);
  while (sum > spare) {
    let largest = -1;
    remaining.forEach((r, i) => {
      if (r > 0 && (largest === -1 || r >= remaining[largest])) largest = i; // ties go to the later group
    });
    remaining[largest] -= 1;
    sum -= 1;
  }
  const usual = new Map<Quota, Question[]>();
  quotas.forEach((q, i) => {
    const drawn = pick(q.pool.filter((x) => !taken.has(x.id)), remaining[i], rand);
    drawn.forEach((x) => taken.add(x.id));
    usual.set(q, drawn);
  });
  // if a group had too few questions left, top up from the others in listed order
  let short = total - taken.size;
  for (const q of quotas) {
    if (short <= 0) break;
    const more = pick(q.pool.filter((x) => !taken.has(x.id)), short, rand);
    more.forEach((x) => taken.add(x.id));
    usual.set(q, [...(usual.get(q) ?? []), ...more]);
    short -= more.length;
  }

  // present in the quiz's usual group order, with weighted and usual picks mixed inside each group
  return quotas.flatMap((q) =>
    shuffle([...weightedPicks.filter((x) => groupOf.get(x.id) === q), ...(usual.get(q) ?? [])], rand),
  );
}

/**
 * Draw the questions for a new attempt. This is `prepare()` from the old
 * components/Quiz.tsx, moved server-side, with the same behaviour:
 *  - `meta.quiz.groups`: draw n from each named group, in listed order;
 *  - otherwise short answers first, then MC, random within each (`quiz.short` /
 *    `quiz.mc` counts, or everything when the unit has no `quiz` config).
 * Each MC question gets a random option order, stored on the attempt.
 */
export function drawAttempt(unit: Unit, rand: RandomInt = randomInt, weighting?: Weighting): Drawn {
  let chosen: Question[];
  const weighted = weighting && unit.conceptsReady ? drawWeighted(unit, weighting, rand) : null;
  if (weighted) {
    chosen = weighted;
  } else if (unit.quiz?.groups) {
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
