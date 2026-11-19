import { describe, expect, it } from "vitest";

import type { SkillVerdicts } from "@/lib/db/schema";
import {
  cappedMark,
  conceptOutcomes,
  endingAfterFirstTry,
  metSkills,
  missedSkills,
  pillFor,
  recordedMark,
  retryCap,
  retryOffered,
  summaryLines,
} from "@/lib/unseen/scoring";
import { SKILL_IDS, skillConceptId, type SkillId } from "@/lib/unseen/skills";

const verdicts = (missed: SkillId[] = []): SkillVerdicts =>
  Object.fromEntries(SKILL_IDS.map((id) => [id, { met: !missed.includes(id), reason: "r" }])) as SkillVerdicts;

describe("the retry cap", () => {
  it("is one mark below full marks for 2, 3 and 4 marks", () => {
    expect(retryCap(2)).toBe(1);
    expect(retryCap(3)).toBe(2);
    expect(retryCap(4)).toBe(3);
    expect(cappedMark(4, 4)).toBe(3);
    expect(cappedMark(3, 4)).toBe(3);
    expect(cappedMark(1, 4)).toBe(1);
    expect(cappedMark(3, 3)).toBe(2);
  });
});

describe("retryOffered and endingAfterFirstTry", () => {
  it("offers a retry below full marks only, and never on a 1-mark question", () => {
    expect(retryOffered(2, 3)).toBe(true);
    expect(retryOffered(0, 4)).toBe(true);
    expect(retryOffered(3, 3)).toBe(false);
    expect(retryOffered(0, 1)).toBe(false);
  });

  it("ends at once on full marks or on a 1-mark question, and otherwise waits for the retry choice", () => {
    expect(endingAfterFirstTry(4, 4)).toBe("full_marks");
    expect(endingAfterFirstTry(1, 1)).toBe("full_marks");
    expect(endingAfterFirstTry(0, 1)).toBe("no_retry");
    expect(endingAfterFirstTry(2, 3)).toBeNull();
  });
});

describe("recordedMark", () => {
  it("is the higher try and keeps the first try when the retry scores lower", () => {
    expect(recordedMark(2, 3)).toBe(3);
    expect(recordedMark(3, 2)).toBe(3);
    expect(recordedMark(2, null)).toBe(2);
    expect(recordedMark(2)).toBe(2);
  });
});

describe("skills and outcomes", () => {
  it("lists missed and met skills in rubric order", () => {
    const v = verdicts(["apt-evidence", "directive-verb"]);
    expect(missedSkills(v)).toEqual(["directive-verb", "apt-evidence"]);
    expect(metSkills(v)).toHaveLength(5);
  });

  it("gives seven first-try outcomes, one per skill, whatever the question's tags", () => {
    const out = conceptOutcomes(verdicts(["technique-effect"]));
    expect(out).toHaveLength(7);
    expect(out.map((o) => o.conceptId)).toEqual(SKILL_IDS.map(skillConceptId));
    expect(out.find((o) => o.conceptId === skillConceptId("technique-effect"))?.correct).toBe(false);
    expect(out.filter((o) => o.correct)).toHaveLength(6);
  });
});

describe("pillFor", () => {
  const t1 = verdicts(["technique-effect", "apt-evidence"]);
  const t2 = verdicts(["apt-evidence"]);
  it("reads First try, Fixed in retry or Missed", () => {
    expect(pillFor("succinct", t1, t2)).toBe("first-try");
    expect(pillFor("technique-effect", t1, t2)).toBe("fixed-in-retry");
    expect(pillFor("apt-evidence", t1, t2)).toBe("missed");
    expect(pillFor("apt-evidence", t1, null)).toBe("missed");
    expect(pillFor("technique-effect", t1)).toBe("missed");
  });
});

describe("summaryLines", () => {
  it("covers every ending", () => {
    expect(summaryLines({ ending: "full_marks", try1Mark: 4, maxMarks: 4 })).toEqual(["Full marks on your first try."]);
    expect(summaryLines({ ending: "no_retry", try1Mark: 0, maxMarks: 1 })).toEqual(["Your first try is recorded: 0 / 1."]);
    expect(summaryLines({ ending: "declined", try1Mark: 2, maxMarks: 4 })).toEqual([
      "You skipped the retry, so your first try is recorded: 2 / 4.",
    ]);
  });

  it("explains the cap when the retry reached it, and the better try when the first scored higher", () => {
    expect(summaryLines({ ending: "retried", try1Mark: 2, try2Mark: 3, maxMarks: 4 })).toEqual([
      "A retry can earn at most 3 out of 4. Meet every skill on the first try next time for the full 4.",
    ]);
    expect(summaryLines({ ending: "retried", try1Mark: 2, try2Mark: 2, maxMarks: 4 })).toEqual([]);
    expect(summaryLines({ ending: "retried", try1Mark: 3, try2Mark: 2, maxMarks: 4 })).toEqual([
      "Your recorded mark is 3 / 4 (your better try).",
    ]);
  });
});
