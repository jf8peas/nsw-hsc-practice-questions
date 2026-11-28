// The case-study rules the validator runs (spec 012 FR-010 to FR-029, research §7): one broken variant per rule, each
// reported with the unit, question or fact it is about.

import { describe, expect, it } from "vitest";

import { parseFactFile } from "@/lib/case-facts/fact-file";
import { validateExplanationRules } from "@/lib/content-rules";
import { validateCaseFactRules } from "@/lib/content-rules-case-facts";
import type { AnswerSet, McQuestion, Question, Unit } from "@/lib/types";

import { buildCaseFactsFixture } from "../helpers/case-facts-fixtures";

const ID = "fx-facts";
const m = (n: string) => `${ID}.m${n}`;
const s = (n: string) => `${ID}.s${n}`;

type Fixture = ReturnType<typeof buildCaseFactsFixture>;

const run = (f: Fixture) => validateCaseFactRules(f.unit, f.answers, parseFactFile(f.factMarkdown));

/** Change one thing in a fresh fixture and return the errors. */
function broken(change: (f: { unit: Unit; answers: AnswerSet; factMarkdown: string }) => void): string[] {
  const f = buildCaseFactsFixture();
  change(f);
  return run(f);
}

const question = (unit: Unit, id: string): Question => unit.questions.find((q) => q.id === id)!;
const mcq = (unit: Unit, id: string) => question(unit, id) as McQuestion;

/** At least one error starts with `who` and mentions `what`. */
function expectError(errors: string[], who: string, what: RegExp) {
  expect(errors.some((e) => e.startsWith(`${who}:`) && what.test(e)), errors.join("\n")).toBe(true);
}

describe("validateCaseFactRules", () => {
  it("passes the fixture, with the existing explanation rule", () => {
    const f = buildCaseFactsFixture();
    expect(run(f)).toEqual([]);
    expect(validateExplanationRules(f.unit, f.answers)).toEqual([]);
  });

  it("fails a ★ fact that no key names", () => {
    const errors = broken((f) => {
      f.factMarkdown = f.factMarkdown.replace("| C18 |  |", "| C18 | ★ |");
    });
    expectError(errors, "C18", /★/);
  });

  it("fails an unknown fact ID, a key with none and a repeated ID", () => {
    expectError(broken((f) => void (f.answers[m("01")].factIds = ["C01", "C99"])), m("01"), /C99/);
    expectError(broken((f) => void delete f.answers[m("01")].factIds), m("01"), /no fact/);
    expectError(broken((f) => void (f.answers[m("01")].factIds = [])), m("01"), /no fact/);
    expectError(broken((f) => void (f.answers[m("01")].factIds = ["C01", "C01"])), m("01"), /twice/);
  });

  it("fails a fact group with no question", () => {
    const errors = broken((f) => {
      // move every question on nepal-tourism-electricity (N13 to N15) onto another Nepal fact
      for (const key of Object.values(f.answers)) {
        key.factIds = key.factIds!.map((id) => (["N13", "N14", "N15"].includes(id) ? "N02" : id));
      }
    });
    expectError(errors, ID, /nepal-e/);
  });

  it("fails a fact used by four questions", () => {
    const errors = broken((f) => {
      // C01 is already in m01 and s17
      for (const id of [m("02"), m("03")]) f.answers[id].factIds = ["C01"];
    });
    expectError(errors, "C01", /4 questions/);
  });

  it("fails a pool of seven", () => {
    const errors = broken((f) => {
      f.unit.questions = f.unit.questions.filter((q) => q.id !== m("08"));
    });
    expectError(errors, ID, /mc-china.*7/);
  });

  it("fails a changed quiz group list or a missing drawUnseenFirst", () => {
    expectError(broken((f) => void f.unit.quiz!.groups!.reverse()), ID, /quiz groups/);
    expectError(broken((f) => void (f.unit.quiz!.groups![0].n = 2)), ID, /quiz groups/);
    expectError(broken((f) => void delete f.unit.quiz!.drawUnseenFirst), ID, /drawUnseenFirst/);
  });

  it("fails a question outside the five pools or of the wrong type for its pool", () => {
    expectError(broken((f) => void (question(f.unit, m("01")).group = "mc")), m("01"), /group/);
    expectError(broken((f) => void (question(f.unit, m("01")).group = "sa-china")), m("01"), /group/);
  });

  it("fails a wrong source string and unset explanationsComplete", () => {
    expectError(broken((f) => void (question(f.unit, m("01")).source = "Original question")), m("01"), /source/);
    expectError(broken((f) => void delete f.unit.explanationsComplete), ID, /explanationsComplete/);
  });

  it("leaves a missing wrong-option explanation to the existing rule", () => {
    const f = buildCaseFactsFixture();
    delete f.answers[m("01")].wrongExplanations!["Wrong choice 1a"];
    expect(validateExplanationRules(f.unit, f.answers).join("\n")).toContain(m("01"));
  });

  it("fails three multiple-choice options", () => {
    expectError(broken((f) => void mcq(f.unit, m("01")).options.pop()), m("01"), /four options/);
  });

  it("fails an explanation citing no source of its facts, or a source that does not exist", () => {
    const set = (text: string) => broken((f) => void (f.answers[m("01")].wrongExplanations!["Wrong choice 1a"] = text));
    expectError(set("Wrong, with no citation."), m("01"), /cite/);
    expectError(set("Wrong (Source S2)."), m("01"), /cite/);
    expectError(set("Wrong (Source S1, Source S9)."), m("01"), /S9/);
  });

  it("accepts 'secondary source' when the question's facts have no source number", () => {
    const f = buildCaseFactsFixture();
    f.factMarkdown = f.factMarkdown.replace(/^(\| C01 \|.*)\[S1\] \|$/m, "$1secondary |");
    for (const option of Object.keys(f.answers[m("01")].wrongExplanations!)) {
      f.answers[m("01")].wrongExplanations![option] = "Wrong, from the figure given by a secondary source.";
    }
    expect(run(f)).toEqual([]);
    f.answers[m("01")].wrongExplanations!["Wrong choice 1a"] = "Wrong, with no citation.";
    expectError(run(f), m("01"), /cite/);
  });

  it("fails bad short-answer shapes", () => {
    expectError(
      broken((f) => {
        question(f.unit, s("01")).maxMarks = 4;
        f.answers[s("01")].rubric = ["a", "b", "c", "d"];
      }),
      s("01"),
      /2 or 3 marks/,
    );
    expectError(broken((f) => void (f.answers[s("01")].notes = "  ")), s("01"), /notes/);
    expectError(broken((f) => void (f.answers[s("01")].modelAnswer = "")), s("01"), /model answer/);
    expectError(broken((f) => void f.answers[s("01")].rubric.pop()), s("01"), /rubric/);
  });

  it("fails a correctText that is not an option", () => {
    expectError(broken((f) => void (f.answers[m("01")].correctText = "Not offered")), m("01"), /correctText/);
  });

  it("fails a Nepal fact in a China pool and a China fact in a Nepal pool", () => {
    expectError(broken((f) => void (f.answers[m("01")].factIds = ["C01", "N02"])), m("01"), /N02/);
    expectError(broken((f) => void (f.answers[m("09")].factIds = ["N01", "C02"])), m("09"), /C02/);
  });

  it("fails an untagged question and a concept whose group matches none of its facts", () => {
    expectError(broken((f) => void delete question(f.unit, m("01")).concept), m("01"), /concept/);
    expectError(broken((f) => void (question(f.unit, m("01")).concept = `${ID}.c-china-growth`)), m("01"), /concept/);
  });

  it("fails a missing or extra concept and a digit in a description", () => {
    expectError(broken((f) => void f.unit.concepts!.pop()), ID, /nepal-tourism-electricity/);
    expectError(
      broken((f) => void f.unit.concepts!.push({ id: `${ID}.c-extra`, description: "Extra" })),
      ID,
      /c-extra/,
    );
    expectError(broken((f) => void (f.unit.concepts![0].description = "Opening up since 1978")), `${ID}.c-china-opening-up`, /digit/);
  });

  it("fails a fact ID in any student-visible text", () => {
    expectError(broken((f) => void (question(f.unit, s("01")).prompt = "Explain C09.")), s("01"), /fact ID/);
    expectError(broken((f) => void (f.answers[s("01")].notes = "See N04 for this.")), s("01"), /fact ID/);
    expectError(broken((f) => void (f.answers[m("01")].rubric = ["C01 (Source S1)."])), m("01"), /fact ID/);
    expectError(
      broken((f) => void (f.answers[m("01")].wrongExplanations!["Wrong choice 1a"] = "C01 (Source S1).")),
      m("01"),
      /fact ID/,
    );
  });
});
