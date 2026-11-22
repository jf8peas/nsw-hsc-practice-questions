// The nine skills' tips (spec 009 FR-019, FR-021, task T045): each has a one-sentence tip within the concept line limit,
// the concept lines of the comparative unit use them, the seven shared ones are spec 008's word for word, and no
// shipped key text (of either unit) appears in a tip, name or description.

import { describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { answers } from "@/content/units/y12-english-advanced-unseen-texts/answers";
import { concepts } from "@/content/units/y12-english-advanced-comparative-texts/concepts";
import type { UnseenQuestion } from "@/lib/types";
import { COMPARATIVE_SKILLS, COMPARATIVE_ONLY_SKILL_IDS, SKILLS, comparativeSkillConceptId } from "@/lib/unseen/skills";

const unit = UNITS.find((u) => u.id === "y12-english-advanced-unseen-texts")!;
const questions = unit.questions.filter((q): q is UnseenQuestion => q.type === "unseen");
const squash = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
const sharedRun = (key: string, pub: string, run = 30): string | null => {
  const k = squash(key);
  const p = squash(pub);
  for (let i = 0; i + run <= k.length; i++) if (p.includes(k.slice(i, i + run))) return k.slice(i, i + run);
  return null;
};

describe("the two comparison skills", () => {
  it("each has a name, a one-sentence tip within the 120-character concept limit and a description", () => {
    for (const id of COMPARATIVE_ONLY_SKILL_IDS) {
      const s = COMPARATIVE_SKILLS.find((x) => x.id === id)!;
      expect(s.name.length, id).toBeGreaterThan(5);
      expect(s.tip.length, id).toBeLessThanOrEqual(120);
      expect(s.tip, id).toMatch(/[.]$/);
      expect(s.description.length, id).toBeGreaterThan(20);
    }
  });

  it("tell the student what the verdict means: comparing as you go, and equal depth in both texts", () => {
    const byId = Object.fromEntries(COMPARATIVE_SKILLS.map((s) => [s.id, s]));
    expect(byId["compares-texts"].tip).toMatch(/whereas|by contrast/i);
    expect(byId["treats-both-in-depth"].tip).toMatch(/both texts/i);
  });
});

describe("the comparative unit's concept lines", () => {
  it("use the tip as the description and the skill name as the term, for all nine, so Things I need to know shows the same text as the retry's tip cards", () => {
    expect(concepts).toHaveLength(9);
    for (const s of COMPARATIVE_SKILLS) {
      const c = concepts.find((x) => x.id === comparativeSkillConceptId(s.id))!;
      expect(c.description).toBe(s.tip);
      expect(c.term).toBe(s.name);
    }
  });

  it("the seven shared skills read exactly as in spec 008's unit", () => {
    for (const s of SKILLS) {
      const mine = concepts.find((x) => x.id === comparativeSkillConceptId(s.id))!;
      const theirs = unit.concepts!.find((x) => x.id === mine.id)!;
      expect([mine.term, mine.description, mine.clearAfter]).toEqual([theirs.term, theirs.description, theirs.clearAfter]);
    }
  });
});

describe("no key text in a tip", () => {
  it.each(questions.map((q) => [q.id, q] as const))("%s: no run of its key appears in the comparison skills' tips, names or descriptions", (_id, q) => {
    const key = answers[q.id].unseen!;
    const publicStrings = COMPARATIVE_ONLY_SKILL_IDS.flatMap((id) => {
      const s = COMPARATIVE_SKILLS.find((x) => x.id === id)!;
      return [s.tip, s.name, s.description];
    });
    for (const k of [key.model, key.criteria, key.notes, key.visual?.description ?? ""]) {
      if (!k) continue;
      for (const pub of publicStrings) expect(sharedRun(k, pub), `${q.id}: "${pub}"`).toBeNull();
    }
  });
});
