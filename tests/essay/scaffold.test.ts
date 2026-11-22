import { describe, expect, it } from "vitest";

import {
  SCAFFOLD_CAP,
  SCAFFOLD_FIELDS,
  emptyScaffold,
  sanitiseScaffold,
  scaffoldWords,
  setField,
  validateScaffold,
  type EssayScaffold,
} from "@/lib/essay/scaffold";

const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");

function withJudgementAndPoint(extraWords = 0): EssayScaffold {
  let s = emptyScaffold();
  s = setField(s, { section: "intro", key: "judgement" }, "China benefited greatly");
  s = setField(s, { section: "body1", key: "point" }, "Trade grew");
  if (extraWords) s = setField(s, { section: "body2", key: "theory" }, words(extraWords));
  return s;
}

describe("the scaffold", () => {
  it("has 20 fields in five sections", () => {
    expect(SCAFFOLD_FIELDS).toHaveLength(20);
    expect(new Set(SCAFFOLD_FIELDS.map((f) => f.section)).size).toBe(5);
  });

  it("counts words across every field with the app's rule", () => {
    expect(scaffoldWords(emptyScaffold())).toBe(0);
    expect(scaffoldWords(withJudgementAndPoint())).toBe(5);
    const s = setField(emptyScaffold(), { section: "conclusion", key: "weighs" }, "well-being 2027 growth");
    expect(scaffoldWords(s)).toBe(3);
  });

  it("allows exactly 250 words and refuses 251", () => {
    const ok = withJudgementAndPoint(SCAFFOLD_CAP - 5);
    expect(scaffoldWords(ok)).toBe(250);
    expect(validateScaffold(ok, "start")).toMatchObject({ ok: true, words: 250 });
    const over = withJudgementAndPoint(SCAFFOLD_CAP - 4);
    expect(validateScaffold(over, "save").reasons).toEqual(["over_cap"]);
    expect(validateScaffold(over, "start").reasons).toContain("over_cap");
  });

  it("needs the judgement and at least one body point to move on, but not to save", () => {
    expect(validateScaffold(emptyScaffold(), "save").ok).toBe(true);
    expect(validateScaffold(emptyScaffold(), "start").reasons).toEqual(["no_judgement", "no_body_point"]);
    const noPoint = setField(emptyScaffold(), { section: "intro", key: "judgement" }, "A judgement");
    expect(validateScaffold(noPoint, "start").reasons).toEqual(["no_body_point"]);
    const noJudgement = setField(emptyScaffold(), { section: "body3", key: "point" }, "A point");
    expect(validateScaffold(noJudgement, "start").reasons).toEqual(["no_judgement"]);
    expect(validateScaffold(withJudgementAndPoint(), "start").ok).toBe(true);
  });

  it("treats a whitespace-only judgement as empty", () => {
    const s = setField(withJudgementAndPoint(), { section: "intro", key: "judgement" }, "   \n ");
    expect(validateScaffold(s, "start").reasons).toEqual(["no_judgement"]);
  });

  it("sanitises untrusted input: unknown keys dropped, non-strings rejected, fields capped", () => {
    expect(sanitiseScaffold(null)).toBeNull();
    expect(sanitiseScaffold("x")).toBeNull();
    // a non-string value anywhere makes the input invalid
    expect(sanitiseScaffold({ intro: { judgement: "J" }, body: [{ point: 1 }] })).toBeNull();
    expect(sanitiseScaffold({ intro: { judgement: 5 } })).toBeNull();
    const ok = sanitiseScaffold({ intro: { judgement: "J", evil: "x" }, body: [{ point: "P" }], zzz: 1 });
    expect(ok?.intro).toEqual({ judgement: "J", terms: "", economies: "" });
    expect(ok?.body[0].point).toBe("P");
    expect(ok?.body[1].point).toBe("");
    expect(JSON.stringify(ok)).not.toContain("evil");
    const long = sanitiseScaffold({ intro: { judgement: "a".repeat(5000) } });
    expect(long?.intro.judgement).toHaveLength(1500);
  });
});
