import { describe, expect, it } from "vitest";

import { containsKeyEcho, parseEnglishEssayReply } from "@/lib/english-essay/marker.server";

import { englishMarkerContent } from "../helpers/english-essay";

const U = "y12-english-essay-writing";
const parse = (o: unknown) => parseEnglishEssayReply(typeof o === "string" ? o : JSON.stringify(o));
const valid = () => JSON.parse(englishMarkerContent());

describe("parseEnglishEssayReply", () => {
  it("accepts a complete reply and maps concepts to full ids", () => {
    const r = parse(englishMarkerContent({ gaps: [{ concept: "skill-thesis", detail: "d" }], used: ["skill-expression", "away-symbols"] }));
    expect(r).toMatchObject({ band: 2, mark: 14, questionFocus: "fully" });
    expect(r!.gaps).toEqual([{ conceptId: `${U}.c-skill-thesis`, detail: "d" }]);
    expect(r!.usedWell).toEqual([`${U}.c-skill-expression`, `${U}.c-away-symbols`]);
    expect(Object.keys(r!.criteria).sort()).toEqual(["analysis", "argument", "expression", "knowledge"]);
  });

  it("takes the first JSON block out of surrounding prose", () => {
    expect(parse(`Here you go:\n${englishMarkerContent()}\nThanks`)).not.toBeNull();
    expect(parse("no json here")).toBeNull();
    expect(parse("{ not json }")).toBeNull();
  });

  it("fails the whole reply when a required field is missing or invalid", () => {
    const base = valid();
    const without = (k: string) => {
      const c = structuredClone(base);
      delete c[k];
      return c;
    };
    for (const k of ["criteria", "band", "mark", "questionFocus", "questionFocusReason", "bandReason", "liftYourMark", "knowledgeErrors", "gaps", "conceptsUsedWell"]) {
      expect(parse(without(k)), k).toBeNull();
    }
    for (const bad of [0, 6, 2.5, "2", null]) expect(parse({ ...base, band: bad })).toBeNull();
    for (const bad of [-1, 21, 14.2, "14"]) expect(parse({ ...base, mark: bad })).toBeNull();
    expect(parse({ ...base, mark: 0 })).not.toBeNull();
    expect(parse({ ...base, questionFocus: "mostly" })).toBeNull();
    expect(parse({ ...base, questionFocusReason: "  " })).toBeNull();
    expect(parse({ ...base, bandReason: "" })).toBeNull();
    expect(parse({ ...base, liftYourMark: [] })).toBeNull();
    expect(parse({ ...base, gaps: "none" })).toBeNull();
    expect(parse({ ...base, knowledgeErrors: {} })).toBeNull();
  });

  it("requires all four criteria with a valid verdict, and trims reasons to 300 characters", () => {
    const base = valid();
    for (const id of ["argument", "analysis", "knowledge", "expression"]) {
      const c = structuredClone(base);
      delete c.criteria[id];
      expect(parse(c), id).toBeNull();
      const d = structuredClone(base);
      d.criteria[id].verdict = "excellent";
      expect(parse(d), id).toBeNull();
    }
    const long = structuredClone(base);
    long.criteria.argument.reason = "x".repeat(500);
    delete long.criteria.analysis.reason;
    const r = parse(long)!;
    expect(r.criteria.argument.reason).toHaveLength(300);
    expect(r.criteria.analysis.reason).toBe("");
  });

  it("keeps the first two lift points, accepts a single string and trims each", () => {
    expect(parse({ ...valid(), liftYourMark: ["a", "b", "c"] })!.lift).toEqual(["a", "b"]);
    expect(parse({ ...valid(), liftYourMark: "only one" })!.lift).toEqual(["only one"]);
    expect(parse({ ...valid(), liftYourMark: ["x".repeat(400), "y"] })!.lift[0]).toHaveLength(300);
    expect(parse({ ...valid(), bandReason: "z".repeat(900) })!.bandReason).toHaveLength(600);
    expect(parse({ ...valid(), questionFocusReason: "q".repeat(900) })!.questionFocusReason).toHaveLength(400);
  });

  it("drops invalid knowledge errors and off-list gaps and used-well ids, dedupes gaps and removes gaps from used-well", () => {
    const r = parse({
      ...valid(),
      knowledgeErrors: [{ quote: "a b c", why: "w" }, { quote: "", why: "w" }, { quote: "q", why: "" }, "junk", null],
      gaps: [
        { concept: "skill-thesis", detail: "first" },
        { concept: "skill-thesis", detail: "dup" },
        { concept: "not-a-concept", detail: "x" },
        { concept: "away-symbols", detail: "y".repeat(500) },
      ],
      conceptsUsedWell: ["skill-thesis", "skill-expression", "skill-expression", "bogus", 5],
    })!;
    expect(r.knowledgeErrors).toEqual([{ quote: "a b c", why: "w" }]);
    expect(r.gaps.map((g) => g.conceptId)).toEqual([`${U}.c-skill-thesis`, `${U}.c-away-symbols`]);
    expect(r.gaps[1]!.detail).toHaveLength(200);
    expect(r.usedWell).toEqual([`${U}.c-skill-expression`]);
  });

  it("keeps at most five gaps and eight used-well ids, ignores unknown keys", () => {
    const keys = ["skill-thesis", "skill-answers-question", "skill-analysis-not-recount", "skill-technique-effect", "skill-dramatic-form", "skill-apt-evidence"];
    const r = parse({ ...valid(), gaps: keys.map((k) => ({ concept: k, detail: "d" })), conceptsUsedWell: [], mark_extra: 3, rewrittenEssay: "no" })!;
    expect(r.gaps).toHaveLength(5);
    expect(JSON.stringify(r)).not.toContain("rewrittenEssay");
    const many = parse({
      ...valid(),
      gaps: [],
      conceptsUsedWell: ["away-tom-mortality", "away-coral-grief", "away-gwen-fear", "away-class-migrants", "away-meg-independence", "away-harry-vic-acceptance", "away-storm-catalyst", "away-shakespeare-frame", "away-symbols"],
    })!;
    expect(many.usedWell).toHaveLength(8);
  });

  it("rewrites references to the hidden notes in student-facing text", () => {
    const r = parse({ ...valid(), bandReason: "As the marking notes expect, the thesis is clear." })!;
    expect(r.bandReason.toLowerCase()).not.toContain("marking notes");
  });
});

describe("containsKeyEcho", () => {
  const notes = "The lantern keeper counts the hours until the harbour bell rings across the water at dusk.";
  const reply = (over: Record<string, unknown>) => parse({ ...valid(), ...over })!;

  it("flags a 60-character run of the notes in a student-facing string", () => {
    expect(containsKeyEcho(reply({ bandReason: `Good. ${notes} Well done.` }), [notes], [])).toBe(true);
    expect(containsKeyEcho(reply({ liftYourMark: [`Try: ${notes}`] }), [notes], [])).toBe(true);
  });

  it("allows runs that are also in the question or the student's own essay, and short runs", () => {
    expect(containsKeyEcho(reply({ bandReason: `Good. ${notes}` }), [notes], [notes])).toBe(false);
    expect(containsKeyEcho(reply({ bandReason: "The lantern keeper counts the hours." }), [notes], [])).toBe(false);
  });

  it("does not treat the student's quoted words in a knowledge error as an echo", () => {
    expect(containsKeyEcho(reply({ knowledgeErrors: [{ quote: notes, why: "Check the speaker." }] }), [notes], [])).toBe(false);
  });
});
