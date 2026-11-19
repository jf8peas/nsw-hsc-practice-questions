// "Things I need to know" for the unseen-text unit (spec 008 FR-025, FR-026, SC-003): counts are
// replayed from the FIRST try's seven outcomes, whatever the question's tags; a skill missed and fixed
// in the retry stays missed; it clears after 2 first tries that show it. lib/concepts/progress.ts is
// unchanged: it already reads each result's stored outcomes and the concept's clearAfter.

import { describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { conceptProgress, conceptReviewCounts, type ConceptResult } from "@/lib/concepts/progress";
import type { SkillVerdicts } from "@/lib/db/schema";
import { conceptOutcomes } from "@/lib/unseen/scoring";
import { SKILL_IDS, skillConceptId, type SkillId } from "@/lib/unseen/skills";

const unit = UNITS.find((u) => u.id === "y12-english-advanced-unseen-texts")!;
const QID = unit.questions[0].id;

const verdicts = (missed: SkillId[] = []): SkillVerdicts =>
  Object.fromEntries(SKILL_IDS.map((id) => [id, { met: !missed.includes(id), reason: "r" }])) as SkillVerdicts;

let n = 0;
const result = (firstTryMissed: SkillId[], marks = 3): ConceptResult => {
  n += 1;
  return {
    id: `r${String(n).padStart(3, "0")}`,
    questionId: QID,
    marks,
    max: 3,
    answeredAt: new Date(2026, 10, 19, 9, n),
    conceptOutcomes: conceptOutcomes(verdicts(firstTryMissed)),
  };
};
const uncleared = (rs: ConceptResult[]) => conceptProgress(unit, rs);
const ids = (rs: ConceptResult[]) => uncleared(rs).map((s) => s.conceptId).sort();

describe("the seven skills as concepts", () => {
  it("are all in the unit, each clearing after 2", () => {
    expect(unit.concepts).toHaveLength(7);
    expect(unit.concepts!.every((c) => c.clearAfter === 2)).toBe(true);
    expect(unit.conceptsReady).toBe(true);
  });
});

describe("what a first try adds", () => {
  it("adds every skill missed on the first try, each starting at 2", () => {
    const state = uncleared([result(["technique-effect", "apt-evidence"], 1)]);
    expect(state.map((s) => s.conceptId).sort()).toEqual([skillConceptId("apt-evidence"), skillConceptId("technique-effect")].sort());
    expect(state.every((s) => s.count === 2)).toBe(true);
  });

  it("adds nothing for a first try that shows every skill", () => {
    expect(uncleared([result([])])).toEqual([]);
  });

  it("counts a skill the question's tags do not name (all seven count, whatever the tags)", () => {
    // the starter question is tagged technique-effect and human-experience; an untagged skill still counts
    const tags = (unit.questions[0] as { concepts: string[] }).concepts;
    expect(tags).not.toContain(skillConceptId("succinct"));
    expect(ids([result(["succinct"])])).toEqual([skillConceptId("succinct")]);
  });

  it("a skill fixed in the retry is still missed: only the first try's outcomes are stored", () => {
    // the retry's verdicts are never turned into outcomes (conceptOutcomes takes the first try only)
    expect(ids([result(["technique-effect"], 2)])).toEqual([skillConceptId("technique-effect")]);
  });
});

describe("clearing after 2 first tries that show it", () => {
  it("takes 1 away per first try that meets it, and clears it at 0", () => {
    const rs = [result(["technique-effect"], 2)];
    expect(uncleared(rs)[0].count).toBe(2);
    rs.push(result([]));
    expect(uncleared(rs)[0].count).toBe(1);
    rs.push(result([]));
    expect(uncleared(rs)).toEqual([]);
  });

  it("a miss in between sets it back to 2", () => {
    const rs = [result(["apt-evidence"]), result([]), result(["apt-evidence"])];
    expect(uncleared(rs).find((s) => s.conceptId === skillConceptId("apt-evidence"))!.count).toBe(2);
  });

  it("one skill clears without disturbing another", () => {
    // apt-evidence is met on the next two first tries (so it clears); succinct is missed again each time
    const rs = [result(["apt-evidence", "succinct"]), result(["succinct"]), result(["succinct"])];
    const state = uncleared(rs);
    expect(state.map((s) => s.conceptId)).toEqual([skillConceptId("succinct")]);
    expect(state[0].count).toBe(2);
  });
});

describe("the home page count", () => {
  it("counts the unit as having skills to review while any are uncleared", () => {
    expect(conceptReviewCounts([unit], [{ ...result(["technique-effect", "succinct"]), unitId: unit.id }]).get(unit.id)).toBe(2);
    expect(conceptReviewCounts([unit], [{ ...result([]), unitId: unit.id }]).get(unit.id)).toBeUndefined();
  });
});
