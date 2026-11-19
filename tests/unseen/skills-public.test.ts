import { describe, expect, it } from "vitest";

import { SKILLS, SKILL_IDS, skillConceptId, skillOfConcept } from "@/lib/unseen/skills";

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
