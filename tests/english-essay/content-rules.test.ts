import { describe, expect, it } from "vitest";

import { concepts } from "@/content/units/y12-english-essay-writing/concepts";
import { meta } from "@/content/units/y12-english-essay-writing/meta";
import { questions } from "@/content/units/y12-english-essay-writing/questions";
import { answers } from "@/content/units/y12-english-essay-writing/answers";
import { findDirective, directiveInfo } from "@/content/units/y12-english-essay-writing/directives";
import { validateConceptRules } from "@/lib/content-rules";
import { EXPECTED_QUESTIONS, validateEnglishEssayRules } from "@/lib/content-rules-english-essay";
import type { AnswerSet, EnglishEssayQuestion, Unit } from "@/lib/types";

const UNIT = "y12-english-essay-writing";
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

function unit(patch: (q: EnglishEssayQuestion[]) => EnglishEssayQuestion[] = (q) => q): Unit {
  const base = (structuredClone(questions) as EnglishEssayQuestion[]).map((q) => ({ ...q, live: false }));
  return { ...meta, questions: patch(base), concepts, retired: {} } as Unit;
}
const live = (id: string) => (qs: EnglishEssayQuestion[]) => qs.map((q) => (q.id === `${UNIT}.${id}` ? { ...q, live: true } : q));

function key(over: Partial<NonNullable<AnswerSet[string]["englishEssay"]>> = {}): AnswerSet[string] {
  return {
    rubric: [],
    englishEssay: {
      markingNotes: "Cover the lantern keeper and the harbour bell.",
      modelEssay: words(1000),
      conceptTags: [`${UNIT}.c-skill-thesis`, `${UNIT}.c-away-symbols`],
      ...over,
    },
  };
}

describe("the six English essays as shipped", () => {
  it("pass the rules with nothing live and no keys", () => {
    expect(validateEnglishEssayRules(unit(), {})).toEqual([]);
    expect(validateEnglishEssayRules({ ...meta, questions, concepts, retired: {} } as Unit, answers)).toEqual([]);
    expect(validateConceptRules(unit())).toEqual([]);
  });

  it("keep the six verbatim questions, sources and directives in offer order", () => {
    const qs = [...(questions as EnglishEssayQuestion[])].sort((a, b) => a.offer - b.offer);
    expect(qs.map((q) => q.id)).toEqual([1, 2, 3, 4, 5, 6].map((n) => `${UNIT}.e${n}`));
    for (const [i, e] of EXPECTED_QUESTIONS.entries()) {
      expect(qs[i]).toMatchObject({ prompt: e.prompt, source: e.source, directive: e.directive, maxMarks: 20, type: "englishEssay" });
    }
    expect(qs.map((q) => q.directive)).toEqual(["to what extent", "to what extent", "discuss", "how", "evaluate", "discuss"]);
  });

  it("highlights each stored directive in its own question", () => {
    for (const q of questions as EnglishEssayQuestion[]) expect(findDirective(q.prompt, q.directive)).not.toBeNull();
  });

  it("registers the concept list: 11 Away and 8 skill ids, clearAfter 2, skills only as public tags", () => {
    expect(concepts).toHaveLength(19);
    expect(concepts.filter((c) => c.id.includes(".c-away-"))).toHaveLength(11);
    expect(concepts.filter((c) => c.id.includes(".c-skill-"))).toHaveLength(8);
    expect(concepts.every((c) => c.clearAfter === 2 && c.id.startsWith(`${UNIT}.c-`))).toBe(true);
    for (const q of questions as EnglishEssayQuestion[]) expect(q.conceptIds.every((c) => c.includes(".c-skill-"))).toBe(true);
  });
});

describe("directives", () => {
  it("resolves discuss and evaluate through the NESA glossary and labels the two local ones as unit guidance", () => {
    expect(directiveInfo("discuss").guidance).toBe("nesa");
    expect(directiveInfo("evaluate").guidance).toBe("nesa");
    expect(directiveInfo("to what extent")).toMatchObject({
      guidance: "unit",
      definition: "Make a judgement about how far the statement holds: agree, qualify or challenge it, and sustain that judgement with evidence.",
    });
    expect(directiveInfo("how")).toMatchObject({
      guidance: "unit",
      definition: "Explain and analyse the ways the text achieves the effect named, showing how its form and language make meaning.",
    });
  });

  it("matches the whole phrase, whitespace-tolerant, on letter boundaries, with original offsets", () => {
    expect(findDirective("Texts show it. However, how does it work?", "how")).toEqual({ start: 24, end: 27 });
    expect(findDirective("This shows that", "how")).toBeNull();
    expect(findDirective("To what   extent  do you agree", "to what extent")).toEqual({ start: 0, end: 16 });
    expect(findDirective("Nothing here", "to what extent")).toBeNull();
  });
});

describe("live essays need a complete key", () => {
  it("accepts a live essay with notes, a 1,000-word model and valid tags", () => {
    expect(validateEnglishEssayRules(unit(live("e1")), { [`${UNIT}.e1`]: key() })).toEqual([]);
  });

  it("refuses a live essay with no key, empty notes, a short model or bad tags", () => {
    expect(validateEnglishEssayRules(unit(live("e1")), {}).join("\n")).toContain("no English essay key");
    expect(validateEnglishEssayRules(unit(live("e1")), { [`${UNIT}.e1`]: key({ markingNotes: " " }) }).join("\n")).toContain("marking notes are empty");
    expect(validateEnglishEssayRules(unit(live("e1")), { [`${UNIT}.e1`]: key({ modelEssay: words(899) }) }).join("\n")).toContain("899 words");
    expect(validateEnglishEssayRules(unit(live("e1")), { [`${UNIT}.e1`]: key({ modelEssay: words(1101) }) }).join("\n")).toContain("1101 words");
    expect(validateEnglishEssayRules(unit(live("e1")), { [`${UNIT}.e1`]: key({ conceptTags: [] }) }).join("\n")).toContain("no concept tags");
    expect(validateEnglishEssayRules(unit(live("e1")), { [`${UNIT}.e1`]: key({ conceptTags: ["nope"] }) }).join("\n")).toContain("not a concept");
  });

  it("refuses key text that repeats public text (a 60-character run)", () => {
    const description = concepts[0]!.description;
    const out = validateEnglishEssayRules(unit(live("e1")), { [`${UNIT}.e1`]: key({ markingNotes: `${description} ${description}` }) });
    expect(out.join("\n")).toContain("share a run of 60 characters");
  });

  it("allows non-live essays to omit keys, so any subset validates", () => {
    expect(validateEnglishEssayRules(unit(live("e2")), { [`${UNIT}.e2`]: key() })).toEqual([]);
  });
});

describe("public drift is refused", () => {
  it("wrong ids, offers, prompts, sources, directives and concept tags", () => {
    const wrongPrompt = unit((qs) => qs.map((q, i) => (i === 0 ? { ...q, prompt: `${q.prompt} extra` } : q)));
    expect(validateEnglishEssayRules(wrongPrompt, {}).join("\n")).toContain("verbatim");
    const wrongSource = unit((qs) => qs.map((q, i) => (i === 1 ? { ...q, source: "Somewhere 2020 Trial, Q1" } : q)));
    expect(validateEnglishEssayRules(wrongSource, {}).join("\n")).toContain("source must be");
    const wrongDirective = unit((qs) => qs.map((q, i) => (i === 2 ? { ...q, directive: "how" as const } : q)));
    expect(validateEnglishEssayRules(wrongDirective, {}).join("\n")).toContain("directive must be");
    const wrongOffer = unit((qs) => qs.map((q, i) => (i === 3 ? { ...q, offer: 1 as const } : q)));
    expect(validateEnglishEssayRules(wrongOffer, {}).join("\n")).toContain("offer");
    const awayTag = unit((qs) => qs.map((q, i) => (i === 4 ? { ...q, conceptIds: [`${UNIT}.c-away-symbols`] } : q)));
    expect(validateEnglishEssayRules(awayTag, {}).join("\n")).toContain("skill-*");
    const badId = unit((qs) => qs.map((q, i) => (i === 5 ? { ...q, id: `${UNIT}.e9` } : q)));
    expect(validateEnglishEssayRules(badId, {}).join("\n")).toContain("id must be");
  });
});
