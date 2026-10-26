import { describe, expect, it } from "vitest";

import { getUnit } from "@/content";
import { drawAttempt, toPublicQuestions, type RandomInt } from "@/lib/attempts/draw.server";
import type { Unit } from "@/lib/types";

/** Deterministic RNG for repeatable tests. */
function seeded(seed: number): RandomInt {
  let s = seed;
  return (max) => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return Math.floor((s / 4294967296) * max);
  };
}

const unit = (id: string): Unit => {
  const u = getUnit(id);
  if (!u) throw new Error(`unit ${id} not found`);
  return u;
};

const byId = (u: Unit) => new Map(u.questions.map((q) => [q.id, q]));

describe("groups draw (y11-economics-supply-demand)", () => {
  const u = unit("y11-economics-supply-demand");

  it("draws n from each named group, in listed order, with no duplicates", () => {
    for (let seed = 1; seed <= 25; seed++) {
      const { questionIds } = drawAttempt(u, seeded(seed));
      const q = byId(u);
      const groups = questionIds.map((id) => q.get(id)!.group);
      expect(groups).toEqual([
        ...Array(4).fill("mc"),
        ...Array(4).fill("diagram"),
        ...Array(2).fill("micro"),
      ]);
      expect(new Set(questionIds).size).toBe(questionIds.length);
    }
  });

  it("is random: different seeds give different draws", () => {
    const a = drawAttempt(u, seeded(1)).questionIds.join();
    const b = drawAttempt(u, seeded(2)).questionIds.join();
    expect(a).not.toBe(b);
  });
});

describe("shorts-first draw (y11-formula-test)", () => {
  const u = unit("y11-formula-test");

  it("draws quiz.short short answers then quiz.mc multiple choice", () => {
    const { questionIds } = drawAttempt(u, seeded(7));
    const q = byId(u);
    const types = questionIds.map((id) => q.get(id)!.type);
    expect(types).toEqual([
      ...Array(u.quiz!.short).fill("short"),
      ...Array(u.quiz!.mc).fill("mc"),
    ]);
  });
});

describe("a unit with no quiz config", () => {
  it("draws every question, shorts first", () => {
    const base = unit("y11-formula-test");
    const noQuiz: Unit = { ...base, quiz: undefined };
    const { questionIds } = drawAttempt(noQuiz, seeded(3));
    expect(questionIds).toHaveLength(base.questions.length);
    expect(new Set(questionIds).size).toBe(base.questions.length);
    const q = byId(base);
    const types = questionIds.map((id) => q.get(id)!.type);
    const firstMc = types.indexOf("mc");
    expect(types.slice(0, firstMc).every((t) => t === "short")).toBe(true);
    expect(types.slice(firstMc).every((t) => t === "mc")).toBe(true);
  });
});

describe("MC option order", () => {
  it("is a permutation per MC question and absent for short questions", () => {
    for (const id of ["y11-formula-test", "y11-economics-supply-demand"]) {
      const u = unit(id);
      const { questionIds, mcOptionOrder } = drawAttempt(u, seeded(11));
      const q = byId(u);
      for (const qid of questionIds) {
        const question = q.get(qid)!;
        if (question.type === "mc") {
          const order = mcOptionOrder[qid];
          expect(order).toBeDefined();
          expect([...order].sort((a, b) => a - b)).toEqual(question.options.map((_, i) => i));
        } else {
          expect(mcOptionOrder[qid]).toBeUndefined();
        }
      }
      expect(Object.keys(mcOptionOrder).every((k) => questionIds.includes(k))).toBe(true);
    }
  });
});

describe("toPublicQuestions", () => {
  it("returns MC options in display order and short questions unchanged", () => {
    const u = unit("y11-formula-test");
    const { questionIds, mcOptionOrder } = drawAttempt(u, seeded(5));
    const out = toPublicQuestions(questionIds, mcOptionOrder);
    expect(out.map((x) => x.id)).toEqual(questionIds);
    const q = byId(u);
    for (const pq of out) {
      const orig = q.get(pq.id)!;
      if (pq.type === "mc" && orig.type === "mc") {
        expect(pq.options).toEqual(mcOptionOrder[pq.id].map((i) => orig.options[i]));
      } else {
        expect(pq).toEqual(orig);
      }
    }
  });

  it("skips retired question ids", () => {
    const u = unit("y11-formula-test");
    const real = u.questions[0].id;
    expect(toPublicQuestions(["retired.q9", real], {}).map((x) => x.id)).toEqual([real]);
  });
});
