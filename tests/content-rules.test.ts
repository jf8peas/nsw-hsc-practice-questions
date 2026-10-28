// Build-time content rules for concepts, tombstones and wrong-option explanations
// (constitution Principles III and IV; research R1, R3).

import { describe, expect, it } from "vitest";

import {
  validateConceptRules,
  validateExplanationRules,
  validateShippedIds,
} from "@/lib/content-rules";
import type { AnswerSet, Question, Unit } from "@/lib/types";

const U = "unit-a";

function mc(n: number, concept?: string): Question {
  return {
    id: `${U}.m${n}`,
    type: "mc",
    prompt: `Question ${n}`,
    maxMarks: 1,
    options: ["Right", "Wrong one", "Wrong two", "Wrong three"],
    ...(concept ? { concept } : {}),
  };
}

function short(n: number, concept?: string): Question {
  return {
    id: `${U}.s${n}`,
    type: "short",
    prompt: `Short ${n}`,
    maxMarks: 2,
    ...(concept ? { concept } : {}),
  };
}

function unit(over: Partial<Unit> = {}): Unit {
  return {
    id: U,
    year: "Year 11",
    topic: "T",
    type: "Topic Quiz",
    title: "Unit A",
    description: "d",
    created: "2026-10-01",
    order: 1,
    questions: [mc(1), mc(2), short(1)],
    ...over,
  };
}

const C1 = `${U}.c-one`;
const C2 = `${U}.c-two`;
const concepts = [
  { id: C1, description: "The first idea" },
  { id: C2, description: "The second idea" },
];

describe("validateConceptRules", () => {
  it("is clean for a unit with no concepts and no markers", () => {
    expect(validateConceptRules(unit())).toEqual([]);
  });

  it("is clean for a ready unit with every question tagged", () => {
    const u = unit({
      conceptsReady: true,
      concepts,
      questions: [mc(1, C1), mc(2, C2), short(1, C1)],
    });
    expect(validateConceptRules(u)).toEqual([]);
  });

  it("flags a tag that is not a concept of the unit, ready or not", () => {
    const errors = validateConceptRules(unit({ concepts, questions: [mc(1, `${U}.c-typo`), mc(2), short(1)] }));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(`${U}.m1`);
    expect(errors[0]).toContain(`${U}.c-typo`);
    expect(validateConceptRules(unit({ questions: [mc(1, C1), mc(2), short(1)] }))).toHaveLength(1);
  });

  it("flags an untagged question in a ready unit", () => {
    const errors = validateConceptRules(unit({ conceptsReady: true, concepts, questions: [mc(1, C1), mc(2), short(1, C2)] }));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(`${U}.m2`);
  });

  it("flags a ready unit with no concepts", () => {
    const errors = validateConceptRules(unit({ conceptsReady: true, questions: [mc(1), mc(2), short(1)] }));
    expect(errors.some((e) => e.includes("conceptsReady") && e.includes(U))).toBe(true);
  });

  it("flags a duplicate or un-prefixed concept id and an empty or over-long description", () => {
    const errors = validateConceptRules(
      unit({
        concepts: [
          { id: C1, description: "ok" },
          { id: C1, description: "duplicate id" },
          { id: "other-unit.c-x", description: "wrong prefix" },
          { id: `${U}.c-empty`, description: "   " },
          { id: `${U}.c-long`, description: "x".repeat(121) },
        ],
      }),
    );
    expect(errors.some((e) => e.includes("duplicate") && e.includes(C1))).toBe(true);
    expect(errors.some((e) => e.includes("other-unit.c-x"))).toBe(true);
    expect(errors.some((e) => e.includes(`${U}.c-empty`))).toBe(true);
    expect(errors.some((e) => e.includes(`${U}.c-long`))).toBe(true);
  });

  describe("retired tombstones", () => {
    it("accepts a tombstone for a removed question with a real concept", () => {
      expect(validateConceptRules(unit({ concepts, retired: { [`${U}.m9`]: C1 } }))).toEqual([]);
    });

    it("flags a key that equals a live question id", () => {
      const errors = validateConceptRules(unit({ concepts, retired: { [`${U}.m1`]: C1 } }));
      expect(errors.some((e) => e.includes(`${U}.m1`) && e.includes("live"))).toBe(true);
    });

    it("flags a key that is not namespaced to the unit", () => {
      const errors = validateConceptRules(unit({ concepts, retired: { "other.m1": C1 } }));
      expect(errors.some((e) => e.includes("other.m1"))).toBe(true);
    });

    it("flags a tombstone pointing at an unknown concept", () => {
      const errors = validateConceptRules(unit({ concepts, retired: { [`${U}.m9`]: `${U}.c-nope` } }));
      expect(errors.some((e) => e.includes(`${U}.m9`) && e.includes(`${U}.c-nope`))).toBe(true);
    });

    it("accepts a null tombstone in a unit that is not concept-ready", () => {
      expect(validateConceptRules(unit({ retired: { [`${U}.m9`]: null } }))).toEqual([]);
    });

    it("flags a null tombstone in a concept-ready unit", () => {
      const errors = validateConceptRules(
        unit({ conceptsReady: true, concepts, questions: [mc(1, C1), mc(2, C2), short(1, C1)], retired: { [`${U}.m9`]: null } }),
      );
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain(`${U}.m9`);
      expect(errors[0]).toContain("null");
    });
  });
});

describe("validateExplanationRules", () => {
  const answers = (over: Record<string, Partial<AnswerSet[string]>> = {}): AnswerSet => ({
    [`${U}.m1`]: {
      correctText: "Right",
      rubric: ["r"],
      wrongExplanations: { "Wrong one": "because 1", "Wrong two": "because 2", "Wrong three": "because 3" },
      ...over[`${U}.m1`],
    },
    [`${U}.m2`]: {
      correctText: "Right",
      rubric: ["r"],
      wrongExplanations: { "Wrong one": "x", "Wrong two": "y", "Wrong three": "z" },
      ...over[`${U}.m2`],
    },
    [`${U}.s1`]: { modelAnswer: "m", rubric: ["a", "b"], ...over[`${U}.s1`] },
  });
  const complete = (over: Partial<Unit> = {}) => unit({ explanationsComplete: true, ...over });

  it("is clean for an explanations-complete unit that covers every wrong option", () => {
    expect(validateExplanationRules(complete(), answers())).toEqual([]);
  });

  it("does not require explanations in a unit that is not marked", () => {
    const bare: AnswerSet = {
      [`${U}.m1`]: { correctText: "Right", rubric: ["r"] },
      [`${U}.m2`]: { correctText: "Right", rubric: ["r"] },
      [`${U}.s1`]: { modelAnswer: "m", rubric: ["a", "b"] },
    };
    expect(validateExplanationRules(unit(), bare)).toEqual([]);
  });

  it("flags a missing explanation for one wrong option", () => {
    const errors = validateExplanationRules(
      complete(),
      answers({ [`${U}.m1`]: { wrongExplanations: { "Wrong one": "a", "Wrong two": "b" } } }),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(`${U}.m1`);
    expect(errors[0]).toContain("Wrong three");
  });

  it("flags an explanation keyed by the correct option, by a non-option, or empty", () => {
    const errors = validateExplanationRules(
      complete(),
      answers({
        [`${U}.m1`]: {
          wrongExplanations: { "Wrong one": "a", "Wrong two": "b", "Wrong three": "c", Right: "no", Invented: "no" },
        },
        [`${U}.m2`]: { wrongExplanations: { "Wrong one": "a", "Wrong two": "   ", "Wrong three": "c" } },
      }),
    );
    expect(errors.some((e) => e.includes(`${U}.m1`) && e.includes("Right"))).toBe(true);
    expect(errors.some((e) => e.includes(`${U}.m1`) && e.includes("Invented"))).toBe(true);
    expect(errors.some((e) => e.includes(`${U}.m2`) && e.includes("Wrong two"))).toBe(true);
  });

  it("flags an explanation on a short question, in any unit", () => {
    const errors = validateExplanationRules(unit(), answers({ [`${U}.s1`]: { wrongExplanations: { x: "y" } } }));
    expect(errors.some((e) => e.includes(`${U}.s1`))).toBe(true);
  });

  it("finds the correct option from a legacy correctIndex", () => {
    const errors = validateExplanationRules(
      complete(),
      answers({
        [`${U}.m1`]: {
          correctText: undefined,
          correctIndex: 0,
          wrongExplanations: { "Wrong one": "a", "Wrong two": "b", "Wrong three": "c" },
        },
      }),
    );
    expect(errors).toEqual([]);
  });

  it("is clean for a unit with only short questions (nothing to explain)", () => {
    const u = complete({ questions: [short(1), short(2)] });
    const a: AnswerSet = {
      [`${U}.s1`]: { modelAnswer: "m", rubric: ["a", "b"] },
      [`${U}.s2`]: { modelAnswer: "m", rubric: ["a", "b"] },
    };
    expect(validateExplanationRules(u, a)).toEqual([]);
  });
});

describe("validateShippedIds", () => {
  const snapshot = { questions: [`${U}.m1`, `${U}.m2`, `${U}.s1`], concepts: [C1, C2] };
  const current = (over: Partial<Unit> = {}) => unit({ concepts, ...over });

  it("is clean when every shipped id still exists", () => {
    expect(validateShippedIds(snapshot, [current()])).toEqual([]);
  });

  it("allows ids that are new since the snapshot", () => {
    const u = current({ questions: [mc(1), mc(2), short(1), mc(3)], concepts: [...concepts, { id: `${U}.c-three`, description: "New" }] });
    expect(validateShippedIds(snapshot, [u])).toEqual([]);
  });

  it("flags a shipped question that is gone and has no tombstone", () => {
    const errors = validateShippedIds(snapshot, [current({ questions: [mc(1), short(1)] })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(`${U}.m2`);
    expect(errors[0]).toContain("retired");
  });

  it("accepts a removal that is tombstoned, with a concept or with null", () => {
    expect(validateShippedIds(snapshot, [current({ questions: [mc(1), short(1)], retired: { [`${U}.m2`]: C1 } })])).toEqual([]);
    expect(validateShippedIds(snapshot, [current({ questions: [mc(1), short(1)], retired: { [`${U}.m2`]: null } })])).toEqual([]);
  });

  it("flags a renumbered question like any other removal, unless its old id is tombstoned on purpose", () => {
    const renumbered = current({ questions: [mc(1), mc(7), short(1)] });
    const errors = validateShippedIds(snapshot, [renumbered]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(`${U}.m2`);
    expect(validateShippedIds(snapshot, [{ ...renumbered, retired: { [`${U}.m2`]: null } }])).toEqual([]);
  });

  it("always flags a shipped concept id that disappears", () => {
    const errors = validateShippedIds(snapshot, [current({ concepts: [concepts[0]] })]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(C2);
  });

  it("flags a shipped question whose whole unit is gone, and says how to retire a unit on purpose", () => {
    const errors = validateShippedIds({ questions: ["gone-unit.m1"], concepts: [] }, [current()]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("gone-unit.m1");
    expect(errors[0]).toContain("retiredUnits");
  });

  it("accepts a unit retired on purpose: its question and concept ids may be gone", () => {
    const retired = { questions: ["gone-unit.m1", "gone-unit.s2"], concepts: ["gone-unit.c-a"], retiredUnits: ["gone-unit"] };
    expect(validateShippedIds(retired, [current()])).toEqual([]);
  });

  it("a retired unit does not excuse ids of other units, and must really be gone", () => {
    const withOther = { ...snapshot, retiredUnits: ["gone-unit"] };
    expect(validateShippedIds(withOther, [current({ questions: [mc(1), short(1)] })])).toHaveLength(1); // m2 still missing
    const stillThere = { questions: [], concepts: [], retiredUnits: [U] };
    const errors = validateShippedIds(stillThere, [current()]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("still exists");
  });

  it("does not treat a unit whose id merely starts the same as retired", () => {
    const errors = validateShippedIds({ questions: ["gone-unit-2.m1"], concepts: [], retiredUnits: ["gone-unit"] }, [current()]);
    expect(errors).toHaveLength(1);
  });
});
