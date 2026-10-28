// Concept progress: the count rule, replayed in answer order (spec 002 FR-004 to FR-008,
// constitution Principle II). Pure function; no database.

import { describe, expect, it } from "vitest";

import { conceptProgress, type ConceptResult } from "@/lib/concepts/progress";
import type { Unit } from "@/lib/types";

import { READY, conceptId, readyUnit } from "../helpers/concept-fixtures";

const A = conceptId("a");
const B = conceptId("b");
const C = conceptId("c");

// concept a is tagged on m01, m07 (MC, 1 mark) and s01, s07 (short, 2 marks); b on m02, m08, s02, s08; ...
const T0 = Date.UTC(2026, 9, 1, 9, 0, 0);
let seq = 0;
function result(questionId: string, marks: number, max: number, minute: number, id?: string): ConceptResult {
  seq += 1;
  return { id: id ?? `r${String(seq).padStart(4, "0")}`, questionId, marks, max, answeredAt: new Date(T0 + minute * 60_000) };
}
const wrong = (q: string, minute: number) => result(q, 0, q.includes(".s") ? 2 : 1, minute);
const right = (q: string, minute: number) => result(q, q.includes(".s") ? 2 : 1, q.includes(".s") ? 2 : 1, minute);

const states = (results: ConceptResult[], unit: Unit = readyUnit) =>
  conceptProgress(unit, results).map((s) => [s.conceptId, s.count] as const);

describe("the count rule (FR-004)", () => {
  it("a first miss sets the count to 3", () => {
    expect(states([wrong(`${READY}.m01`, 1)])).toEqual([[A, 3]]);
  });

  it("a wrong answer at 2 sets it back to 3, not 4", () => {
    const r = [wrong(`${READY}.m01`, 1), right(`${READY}.s01`, 2), wrong(`${READY}.m07`, 3)];
    expect(states(r)).toEqual([[A, 3]]);
  });

  it("a correct answer on any question with the same tag takes 1 away, even a different question", () => {
    expect(states([wrong(`${READY}.m01`, 1), right(`${READY}.s07`, 2)])).toEqual([[A, 2]]);
  });

  it("three correct answers clear a concept, and it disappears from the list", () => {
    const r = [
      wrong(`${READY}.m01`, 1),
      right(`${READY}.m01`, 2),
      right(`${READY}.m07`, 3),
      right(`${READY}.s01`, 4),
    ];
    expect(states(r.slice(0, 3))).toEqual([[A, 1]]);
    expect(states(r)).toEqual([]);
  });

  it("a correct answer on a concept that was never missed does not list it", () => {
    expect(states([right(`${READY}.m01`, 1), right(`${READY}.m07`, 2)])).toEqual([]);
  });

  it("the count never goes below 0: extra correct answers after clearing change nothing", () => {
    const r = [wrong(`${READY}.m01`, 1), right(`${READY}.m01`, 2), right(`${READY}.m07`, 3), right(`${READY}.s01`, 4), right(`${READY}.s07`, 5)];
    expect(states(r)).toEqual([]);
  });

  it("a cleared concept returns at 3 after another wrong answer", () => {
    const r = [
      wrong(`${READY}.m01`, 1),
      right(`${READY}.m01`, 2),
      right(`${READY}.m07`, 3),
      right(`${READY}.s01`, 4),
      wrong(`${READY}.s07`, 5),
    ];
    expect(states(r)).toEqual([[A, 3]]);
  });

  it("each answer counts in order within one quiz: wrong then right leaves 2, right then wrong leaves 3", () => {
    expect(states([wrong(`${READY}.m01`, 1), right(`${READY}.m07`, 2)])).toEqual([[A, 2]]);
    expect(states([right(`${READY}.m07`, 1), wrong(`${READY}.m01`, 2)])).toEqual([[A, 3]]);
  });
});

describe("what counts as correct (FR-005)", () => {
  it("partial credit counts as wrong; only full marks is correct", () => {
    const miss = wrong(`${READY}.m01`, 1);
    expect(states([miss, result(`${READY}.s01`, 1, 2, 2)])).toEqual([[A, 3]]); // 1 of 2 is still wrong
    expect(states([miss, result(`${READY}.s01`, 2, 2, 2)])).toEqual([[A, 2]]); // 2 of 2 is correct
  });

  it("a wrong short answer sets the count too", () => {
    expect(states([result(`${READY}.s02`, 0, 2, 1)])).toEqual([[B, 3]]);
  });
});

describe("ordering of the list (FR-010)", () => {
  it("orders by count first, then by the most recent miss, then by concept id", () => {
    const r = [
      wrong(`${READY}.m01`, 1), // a: 3, missed at 1
      wrong(`${READY}.m02`, 5), // b: 3, missed at 5
      wrong(`${READY}.m03`, 3), // c: 3, then one correct below -> 2
      right(`${READY}.m09`, 6),
    ];
    // b (3, newest miss) before a (3, older miss) before c (2)
    expect(states(r)).toEqual([
      [B, 3],
      [A, 3],
      [C, 2],
    ]);
  });

  it("equal counts and equal miss times fall back to concept id", () => {
    const r = [wrong(`${READY}.m02`, 1), wrong(`${READY}.m01`, 1)];
    expect(states(r)).toEqual([
      [A, 3],
      [B, 3],
    ]);
  });

  it("reports when each concept was last missed", () => {
    const out = conceptProgress(readyUnit, [wrong(`${READY}.m01`, 1), right(`${READY}.m07`, 2), wrong(`${READY}.s01`, 7)]);
    expect(out).toHaveLength(1);
    expect(out[0].lastMissedAt).toEqual(new Date(T0 + 7 * 60_000));
  });
});

describe("answer order, not save order (FR-007)", () => {
  const sequence = () => [
    wrong(`${READY}.m01`, 1),
    right(`${READY}.m01`, 2),
    wrong(`${READY}.m02`, 3),
    right(`${READY}.s01`, 4),
    wrong(`${READY}.m07`, 5),
    right(`${READY}.s02`, 6),
  ];

  it("replays by answer time even when the results arrive in another order", () => {
    const ordered = states(sequence());
    const base = sequence();
    const shuffled = [base[3], base[0], base[5], base[2], base[1], base[4]];
    expect(states(shuffled)).toEqual(ordered);
  });

  it("breaks ties on result id so the outcome is deterministic", () => {
    const first = result(`${READY}.m01`, 0, 1, 1, "a-first");
    const second = result(`${READY}.m07`, 1, 1, 1, "b-second");
    expect(states([second, first])).toEqual(states([first, second]));
    expect(states([first, second])).toEqual([[A, 2]]); // wrong (3) then correct (2)
  });

  it("a result saved late keeps its place: an older answer replayed before a newer one", () => {
    // wrong at minute 1 saved after a correct at minute 5 would give 3 if replayed in save order
    const late = wrong(`${READY}.m01`, 1);
    const early = right(`${READY}.m07`, 5);
    expect(states([early, late])).toEqual([[A, 2]]);
  });
});

describe("which concept a result counts toward (FR-006, FR-008)", () => {
  it("uses the question's current tag, so a corrected tag applies to old results", () => {
    const retagged: Unit = {
      ...readyUnit,
      questions: readyUnit.questions.map((q) => (q.id === `${READY}.m01` ? { ...q, concept: B } : q)),
    };
    const r = [wrong(`${READY}.m01`, 1)];
    expect(states(r, readyUnit)).toEqual([[A, 3]]);
    expect(states(r, retagged)).toEqual([[B, 3]]);
  });

  it("a removed question counts toward the concept recorded for it", () => {
    const withTombstone: Unit = { ...readyUnit, retired: { [`${READY}.m99`]: C } };
    expect(states([wrong(`${READY}.m99`, 1)], withTombstone)).toEqual([[C, 3]]);
  });

  it("a removed question recorded as having no concept counts toward none", () => {
    const withNull: Unit = { ...readyUnit, retired: { [`${READY}.m99`]: null } };
    expect(states([wrong(`${READY}.m99`, 1)], withNull)).toEqual([]);
  });

  it("a result for a question with no tag and no tombstone is ignored", () => {
    const untagged: Unit = {
      ...readyUnit,
      questions: readyUnit.questions.map((q) => (q.id === `${READY}.m01` ? { ...q, concept: undefined } : q)),
    };
    expect(states([wrong(`${READY}.m01`, 1), wrong(`${READY}.zzz`, 2)], untagged)).toEqual([]);
  });

  it("an empty history has no weak concepts", () => {
    expect(states([])).toEqual([]);
  });

  it("only looks at results it is given: two students' histories do not mix", () => {
    const alice = [wrong(`${READY}.m01`, 1)];
    const bob = [right(`${READY}.m02`, 1)];
    expect(states(alice)).toEqual([[A, 3]]);
    expect(states(bob)).toEqual([]);
  });
});
