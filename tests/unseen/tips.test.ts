// Tip cards and the skill list never hold model-answer text (spec 008 FR-022): the seven tips are
// generic sentences from lib/unseen/skills.json, and no 30-character run of any shipped question's model
// answer, criteria or marking notes appears in any tip, name or description.

import { describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { answers } from "@/content/units/y12-english-advanced-unseen-texts/answers";
import type { UnseenQuestion } from "@/lib/types";
import { SKILLS } from "@/lib/unseen/skills";

const unit = UNITS.find((u) => u.id === "y12-english-advanced-unseen-texts")!;
const questions = unit.questions.filter((q): q is UnseenQuestion => q.type === "unseen");
const squash = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

function sharedRun(key: string, pub: string, run = 30): string | null {
  const k = squash(key);
  const p = squash(pub);
  for (let i = 0; i + run <= k.length; i++) {
    const w = k.slice(i, i + run);
    if (p.includes(w)) return w;
  }
  return null;
}

describe("the skill tips", () => {
  it("are generic: each is one sentence of advice for a skill, within the concept line limit", () => {
    for (const s of SKILLS) {
      expect(s.tip.length, s.id).toBeLessThanOrEqual(120);
      expect(s.tip, s.id).toMatch(/[.]$/);
    }
  });

  it.each(questions.map((q) => [q.id, q] as const))("%s: no run of its key appears in any tip, name or description", (_id, q) => {
    const key = answers[q.id].unseen!;
    const publicStrings = SKILLS.flatMap((s) => [s.tip, s.name, s.description]);
    for (const k of [key.model, key.criteria, key.notes, key.visual?.description ?? ""]) {
      if (!k) continue;
      for (const pub of publicStrings) expect(sharedRun(k, pub), `${q.id}: "${pub}"`).toBeNull();
    }
  });
});

describe("the concept lines built from the skills", () => {
  it("use the tip as the description, so what students see in Things I need to know is the same text", () => {
    for (const s of SKILLS) {
      const concept = unit.concepts!.find((c) => c.id.endsWith(`.c-${s.id}`))!;
      expect(concept.description).toBe(s.tip);
      expect(concept.term).toBe(s.name);
    }
  });
});
