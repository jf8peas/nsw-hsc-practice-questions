import { describe, expect, it } from "vitest";

import { questions } from "@/content/units/y12-economics-essay-writing/questions";
import { concepts } from "@/content/units/y12-economics-essay-writing/concepts";
import { answers } from "@/content/units/y12-economics-essay-writing/answers";
import { meta } from "@/content/units/y12-economics-essay-writing/meta";
import { validateConceptRules } from "@/lib/content-rules";
import { validateEssayRules } from "@/lib/content-rules-essay";
import type { AnswerSet, EssayQuestion, Unit } from "@/lib/types";

const UNIT = "y12-economics-essay-writing";
const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

function unit(patch: (q: EssayQuestion[]) => EssayQuestion[] = (q) => q, extra: Partial<Unit> = {}): Unit {
  // every essay starts not live here so each rule is tested on its own; the shipped state has its own test below
  const base = (structuredClone(questions) as EssayQuestion[]).map((q) => ({ ...q, live: false }));
  return { ...meta, questions: patch(base), concepts, retired: {}, ...extra } as Unit;
}

const live = (id: string) => (qs: EssayQuestion[]) => qs.map((q) => (q.id === `${UNIT}.${id}` ? { ...q, live: true } : q));

function key(over: Partial<NonNullable<AnswerSet[string]["essay"]>> = {}) {
  return {
    essay: {
      markingNotes: "Cover the open-door policy and the WTO.",
      schoolCriteria: null as string | null,
      modelEssay: words(700),
      concepts: [`${UNIT}.c-china-wto`],
      ...over,
    },
    rubric: [],
  } as AnswerSet[string];
}

describe("the six essays as shipped", () => {
  it("pass the rules with every essay not live and no keys", () => {
    expect(validateEssayRules(unit(), {})).toEqual([]);
    expect(validateConceptRules(unit())).toEqual([]);
  });

  it("pass the rules as shipped: e1, e3 and e5 live with their real keys, e2, e4 and e6 not live", () => {
    const shipped = { ...meta, questions, concepts, retired: {} } as Unit;
    expect(validateEssayRules(shipped, answers)).toEqual([]);
    const live = (questions as EssayQuestion[]).filter((q) => q.live).map((q) => q.id.split(".")[1]);
    expect(live).toEqual(["e1", "e3", "e5"]);
  });

  it("have the offered order 1, 3, 5, 2, 4, 6 and the trial sources", () => {
    const ordered = [...(questions as EssayQuestion[])].sort((a, b) => a.offer - b.offer).map((q) => q.id.split(".")[1]);
    expect(ordered).toEqual(["e1", "e3", "e5", "e2", "e4", "e6"]);
    const sources = Object.fromEntries((questions as EssayQuestion[]).map((q) => [q.id.split(".")[1], q.source]));
    expect(sources).toEqual({
      e1: "Barker 2024 Trial, Q27",
      e2: undefined,
      e3: "Sydney Boys 2020 Trial, Q27",
      e4: "Abbotsleigh 2025 Trial, Q28",
      e5: undefined,
      e6: undefined,
    });
  });

  it("tag e1/e2 China, e3/e4 Nepal and e5/e6 both", () => {
    const economy = Object.fromEntries((questions as EssayQuestion[]).map((q) => [q.id.split(".")[1], q.economy]));
    expect(economy).toEqual({ e1: "china", e2: "china", e3: "nepal", e4: "nepal", e5: "both", e6: "both" });
  });
});

describe("a live essay must be complete", () => {
  it("passes with notes, a 600-800 word model essay, tags on the list (and school criteria for a trial essay)", () => {
    expect(validateEssayRules(unit(live("e5")), { [`${UNIT}.e5`]: key() })).toEqual([]);
    expect(validateEssayRules(unit(live("e1")), { [`${UNIT}.e1`]: key({ schoolCriteria: "Band 6: ..." }) })).toEqual([]);
  });

  it("fails with no key", () => {
    expect(validateEssayRules(unit(live("e5")), {}).join("\n")).toMatch(/e5: is live but has no essay key/);
  });

  it("fails on empty notes", () => {
    expect(validateEssayRules(unit(live("e5")), { [`${UNIT}.e5`]: key({ markingNotes: " " }) }).join("\n")).toMatch(/marking notes are empty/);
  });

  it("fails on a model essay under 600 or over 800 words", () => {
    expect(validateEssayRules(unit(live("e5")), { [`${UNIT}.e5`]: key({ modelEssay: words(599) }) }).join("\n")).toMatch(/599 words/);
    expect(validateEssayRules(unit(live("e5")), { [`${UNIT}.e5`]: key({ modelEssay: words(801) }) }).join("\n")).toMatch(/801 words/);
    expect(validateEssayRules(unit(live("e5")), { [`${UNIT}.e5`]: key({ modelEssay: words(600) }) })).toEqual([]);
    expect(validateEssayRules(unit(live("e5")), { [`${UNIT}.e5`]: key({ modelEssay: words(800) }) })).toEqual([]);
  });

  it("fails on no tags or a tag that is not on the concept list", () => {
    expect(validateEssayRules(unit(live("e5")), { [`${UNIT}.e5`]: key({ concepts: [] }) }).join("\n")).toMatch(/no concept tags/);
    expect(validateEssayRules(unit(live("e5")), { [`${UNIT}.e5`]: key({ concepts: [`${UNIT}.c-nope`] }) }).join("\n")).toMatch(/not a concept/);
  });

  it("needs school criteria on a trial essay and none on an original one", () => {
    expect(validateEssayRules(unit(live("e1")), { [`${UNIT}.e1`]: key({ schoolCriteria: null }) }).join("\n")).toMatch(/school's marking criteria/);
    expect(validateEssayRules(unit(live("e5")), { [`${UNIT}.e5`]: key({ schoolCriteria: "x" }) }).join("\n")).toMatch(/must be null/);
  });

  it("fails when key text appears in public text", () => {
    const leak = "The open door policy and special economic zones drew foreign investment into coastal China after 1980.";
    const withLeak = unit(live("e5"), { description: `${meta.description} ${leak}` });
    expect(validateEssayRules(withLeak, { [`${UNIT}.e5`]: key({ markingNotes: leak }) }).join("\n")).toMatch(/share a run of 60 characters/);
  });
});

describe("school criteria may repeat their own question but not another essay's", () => {
  const own = "Makes a clear judgement using supporting evidence of the impacts of globalisation on the growth and development of an economy other than Australia";
  it("allows a run of the essay's own question", () => {
    const e3 = (questions as EssayQuestion[]).find((q) => q.id.endsWith(".e3"))!;
    expect(e3.prompt.toLowerCase()).toContain("impacts of globalisation on the growth and development of an economy other than australia");
    expect(validateEssayRules(unit(live("e3")), { [`${UNIT}.e3`]: key({ schoolCriteria: own }) })).toEqual([]);
  });

  it("refuses a run of another essay's question", () => {
    const other = "With reference to an economy other than Australia, explain the role that globalisation has played in their economic growth and development.";
    expect(validateEssayRules(unit(live("e3")), { [`${UNIT}.e3`]: key({ schoolCriteria: other }) }).join(String.fromCharCode(10))).toMatch(/school criteria share a run of 60 characters/);
  });
});

describe("structure rules", () => {
  it("require a source exactly on the three trial essays", () => {
    expect(validateEssayRules(unit((qs) => qs.map((q) => (q.id.endsWith(".e1") ? { ...q, source: undefined } : q))), {}).join("\n")).toMatch(/e1: a school-trial essay must show its source/);
    expect(validateEssayRules(unit((qs) => qs.map((q) => (q.id.endsWith(".e2") ? { ...q, source: "Barker 2024 Trial, Q1" } : q))), {}).join("\n")).toMatch(/e2: an original essay must not carry a source/);
  });

  it("require a glossary verb, a valid economy and a permutation of offer positions", () => {
    expect(validateEssayRules(unit((qs) => qs.map((q) => (q.id.endsWith(".e2") ? { ...q, verb: "ponder" } : q))), {}).join("\n")).toMatch(/verb "ponder"/);
    expect(validateEssayRules(unit((qs) => qs.map((q) => (q.id.endsWith(".e2") ? ({ ...q, economy: "india" } as unknown as EssayQuestion) : q))), {}).join("\n")).toMatch(/economy must be/);
    expect(validateEssayRules(unit((qs) => qs.map((q) => (q.id.endsWith(".e2") ? { ...q, offer: 1 } : q))), {}).join("\n")).toMatch(/offer positions/);
  });

  it("refuse an essay that repeats a paragraph-unit question", () => {
    const paragraph = { id: "p.1", type: "paragraph", prompt: (questions[1] as EssayQuestion).prompt } as unknown as Unit["questions"][number];
    const other = { ...meta, id: "other", questions: [paragraph] } as Unit;
    expect(validateEssayRules(unit(), {}, [other]).join("\n")).toMatch(/repeats a question of the paragraph-writing unit/);
  });
});
