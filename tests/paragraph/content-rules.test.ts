import { describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { answers as realAnswers } from "@/content/units/y12-economics-paragraph-writing/answers";
import { validateParagraphRules } from "@/lib/content-rules";
import type { AnswerSet, EssayKey, Unit } from "@/lib/types";

const unitOf = (): Unit => structuredClone(UNITS.find((u) => u.id === "y12-economics-paragraph-writing")!);
const answersOf = (): AnswerSet => structuredClone(realAnswers);
const essayOf = (a: AnswerSet): EssayKey => a["y12-economics-paragraph-writing.e01p1"].paragraph!.essay;

/** Mutate the (single shared) essay object so all five answers see the change. */
function withEssay(mutate: (e: EssayKey) => void, today?: Date): string[] {
  const unit = unitOf();
  const answers = answersOf();
  // structuredClone keeps shared references, so one mutation reaches every part
  mutate(essayOf(answers));
  return validateParagraphRules(unit, answers, today);
}

describe("validateParagraphRules: the shipped content", () => {
  it("passes for the shipped unit", () => {
    expect(validateParagraphRules(unitOf(), answersOf())).toEqual([]);
  });
  it("does nothing for a unit with no paragraph questions", () => {
    const other = UNITS.find((u) => u.id === "y12-economics-sentence-writing")!;
    expect(validateParagraphRules(other, {})).toEqual([]);
  });
});

describe("five parts, limits and guidance", () => {
  it("fails when a model part is missing", () => {
    const errs = withEssay((e) => {
      (e.models as Record<number, string>)[3] = "";
    });
    expect(errs.join("\n")).toMatch(/e01.*model.*part 3|part 3.*model/i);
  });
  it("fails when a model part is over its word limit", () => {
    const errs = withEssay((e) => {
      e.models[1] = Array.from({ length: 41 }, () => "word").join(" ");
    });
    expect(errs.join("\n")).toMatch(/part 1.*41 words.*limit 40/);
  });
  it("fails when guidance line 4 does not name the limit", () => {
    const errs = withEssay((e) => {
      e.guidance[3][3] = "Precise economic terms, within the limit.";
    });
    expect(errs.join("\n")).toMatch(/part 3.*guidance line 4.*80 words/);
  });
  it("fails when 'Use in this part' is empty or names an unknown field", () => {
    expect(withEssay((e) => { e.uses[2] = []; }).join("\n")).toMatch(/part 2.*uses/);
    expect(withEssay((e) => { (e.uses[2] as string[]) = ["nope"]; }).join("\n")).toMatch(/part 2.*unknown brief field/);
  });
  it("fails when marking notes or commentary are empty", () => {
    expect(withEssay((e) => { e.markingNotes[5] = " "; }).join("\n")).toMatch(/part 5.*marking notes/);
    expect(withEssay((e) => { e.commentary[1] = ""; }).join("\n")).toMatch(/part 1.*commentary/);
  });
});

describe("counterpoint thread", () => {
  it("fails when the topic phrase is not in the model Topic Sentence", () => {
    expect(withEssay((e) => { e.limitation.topicPhrase = "not in the topic sentence"; }).join("\n")).toMatch(/topicPhrase/);
  });
  it("fails when the evaluation phrase is not in the model Evaluation", () => {
    expect(withEssay((e) => { e.limitation.evaluationPhrase = "something else entirely"; }).join("\n")).toMatch(/evaluationPhrase/);
  });
  it("fails on an unknown limitation tag", () => {
    expect(withEssay((e) => { (e.limitation as { tag: string }).tag = "vibes"; }).join("\n")).toMatch(/limitation tag/);
  });
});

describe("the model adds no new facts (FR-007)", () => {
  it("fails when a model part has a figure the brief does not", () => {
    const errs = withEssay((e) => {
      e.models[3] = e.models[3] + " Exports reached 99% of GDP in 2015.";
    });
    expect(errs.join("\n")).toMatch(/part 3.*99%/);
  });
});

describe("placeholders and verification", () => {
  it.each([
    ["US$x bn", "FDI reached US$x bn"],
    ["0.xxx", "HDI of 0.xxx"],
    ["TODO", "TODO add figure"],
    ["TBC", "Exports grew by TBC"],
    ["supplied by the content task", "figures supplied by the content task."],
  ])("fails a brief containing %s", (_label, text) => {
    const errs = withEssay((e) => { e.brief.facts.push(text); });
    expect(errs.join("\n")).toMatch(/placeholder/i);
  });
  it("fails when figuresVerified is missing, malformed or in the future", () => {
    expect(withEssay((e) => { e.figuresVerified = ""; }).join("\n")).toMatch(/figuresVerified/);
    expect(withEssay((e) => { e.figuresVerified = "4 Nov"; }).join("\n")).toMatch(/figuresVerified/);
    expect(withEssay((e) => { e.figuresVerified = "2999-01-01"; }).join("\n")).toMatch(/figuresVerified.*future/);
  });
});

describe("public files hold no key text", () => {
  it("fails when a public prompt contains a run of a model part", () => {
    const unit = unitOf();
    const answers = answersOf();
    const key = essayOf(answers);
    unit.questions[0].prompt += " " + key.models[2].slice(10, 90);
    expect(validateParagraphRules(unit, answers).join("\n")).toMatch(/public text.*model/i);
  });
  it("fails when a concept description contains marking notes", () => {
    const unit = unitOf();
    const answers = answersOf();
    unit.concepts![0].description += " " + essayOf(answers).markingNotes[2].slice(0, 50);
    expect(validateParagraphRules(unit, answers).join("\n")).toMatch(/public text/i);
  });
});

describe("verb, bank shape and tips", () => {
  it("fails when the verb is not in the question or not in the glossary", () => {
    const u = unitOf();
    (u.questions[0] as { verb: string }).verb = "describe";
    expect(validateParagraphRules(u, answersOf()).join("\n")).toMatch(/verb/);
  });
  it("fails when the bank is not a multiple of five or a part is out of order", () => {
    const u = unitOf();
    u.questions.pop();
    expect(validateParagraphRules(u, answersOf()).join("\n")).toMatch(/five|multiple of 5|5 parts/i);
  });
  it("fails when a tip concept is missing or has the wrong clearAfter", () => {
    const u = unitOf();
    u.concepts = u.concepts!.slice(1);
    expect(validateParagraphRules(u, answersOf()).join("\n")).toMatch(/17 tips|missing tip/);
    const u2 = unitOf();
    u2.concepts![0].clearAfter = 3;
    expect(validateParagraphRules(u2, answersOf()).join("\n")).toMatch(/clearAfter/);
  });
  it("fails when a question's concept tags are not its part's tips", () => {
    const u = unitOf();
    u.questions[0].concepts = [];
    expect(validateParagraphRules(u, answersOf()).join("\n")).toMatch(/concepts/);
  });
});
