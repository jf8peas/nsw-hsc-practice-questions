import { describe, expect, it } from "vitest";

import {
  COMPARATIVE_SKILLS,
  COMPARATIVE_SKILL_IDS,
  SKILLS,
  SKILL_IDS,
  comparativeSkillConceptId,
  comparativeSkillOfConcept,
  skillConceptId,
  skillOfConcept,
} from "@/lib/unseen/skills";

describe("the seven skills", () => {
  it("are the ids in the code, in order, each with a name, a tip and a description", () => {
    expect(SKILLS.map((s) => s.id)).toEqual([...SKILL_IDS]);
    for (const s of SKILLS) {
      expect(s.name.length).toBeGreaterThan(5);
      expect(s.tip.length).toBeGreaterThan(20);
      expect(s.description.length).toBeGreaterThan(20);
    }
  });

  it("map to concept ids and back", () => {
    for (const id of SKILL_IDS) expect(skillOfConcept(skillConceptId(id))).toBe(id);
    expect(skillOfConcept("y12-english-advanced-unseen-texts.c-nope")).toBeNull();
    expect(skillConceptId("succinct")).toBe("y12-english-advanced-unseen-texts.c-succinct");
  });
});

describe("the comparative unit's nine skills (spec 009)", () => {
  it("are the seven shared skills then the two comparison skills, each with a name, a tip and a description", () => {
    expect(COMPARATIVE_SKILL_IDS).toEqual([...SKILL_IDS, "compares-texts", "treats-both-in-depth"]);
    expect(COMPARATIVE_SKILLS.map((s) => s.id)).toEqual([...COMPARATIVE_SKILL_IDS]);
    for (const s of COMPARATIVE_SKILLS) {
      expect(s.name.length).toBeGreaterThan(5);
      expect(s.tip.length).toBeGreaterThan(20);
      expect(s.description.length).toBeGreaterThan(20);
    }
    // the seven keep spec 008's wording exactly
    expect(COMPARATIVE_SKILLS.slice(0, 7)).toEqual([...SKILLS]);
  });

  it("share spec 008's concept ids for the seven and have their own for the two", () => {
    for (const id of SKILL_IDS) expect(comparativeSkillConceptId(id)).toBe(skillConceptId(id));
    expect(comparativeSkillConceptId("compares-texts")).toBe("y12-english-advanced-comparative-texts.c-compares-texts");
    for (const id of COMPARATIVE_SKILL_IDS) expect(comparativeSkillOfConcept(comparativeSkillConceptId(id))).toBe(id);
    expect(comparativeSkillOfConcept("y12-english-advanced-comparative-texts.c-nope")).toBeNull();
  });
});
