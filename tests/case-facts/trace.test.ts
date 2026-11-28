// Number tracing for the case-facts check (spec 012 FR-032, research §8). Everything here is invented.

import { describe, expect, it } from "vitest";

import { parseFactFile } from "@/lib/case-facts/fact-file";
import { traceUnit } from "@/lib/case-facts/trace";
import type { Answer, AnswerSet, McQuestion, Question, ShortQuestion, Unit } from "@/lib/types";

const FILE = parseFactFile(`# Invented

## China (invented)

### A. Section

| ID | ★ | Fact | When | Exams | Source |
|---|---|---|---|---|---|
| C01 | ★ | Widgets sold: US$318 → US$13,862 bn | 1990 → 2025 | 1 | [S8] |
| C02 |  | Widget Pact signed in Zubrovia | 11 Dec 2001 | 1 | [S8] |
| C03 |  | Widget index 36.0 and CO2 share 4,120 | FY2025/26; 1995-96 | 1 | [S8] |
| C04 |  | Gadget count 777 | 1984 | 1 | [S8] |

## Context and impact

An invented paragraph about 5150 gizmos.

- **C01** Showed that Quibblers gained from widgets.
- **C02** Showed that pacts matter.
- **C03** Showed that indices matter.
- **C04** Showed that gadgets matter.

## Sources

- **S8** An invented source.
`);

const U = "fx-trace";

function mc(n: number, factIds: string[], key: Partial<Answer>, prompt = "Which is right?"): [McQuestion, Answer] {
  const options = [key.correctText ?? "Right", ...Object.keys(key.wrongExplanations ?? {})];
  return [
    { id: `${U}.m0${n}`, group: "mc-china", type: "mc", prompt, options, maxMarks: 1 },
    { correctText: options[0], rubric: [], factIds, ...key },
  ];
}

function sa(n: number, factIds: string[], key: Partial<Answer>, prompt = "State the fact."): [ShortQuestion, Answer] {
  return [
    { id: `${U}.s0${n}`, group: "sa-china", type: "short", prompt, maxMarks: 3 },
    { modelAnswer: "", rubric: [], notes: "", factIds, ...key },
  ];
}

function trace(...pairs: Array<[Question, Answer]>) {
  const unit = {
    id: U,
    year: "Year 12",
    topic: "Fixtures",
    type: "Topic Quiz",
    title: "Trace",
    description: "",
    created: "2026-10-01",
    order: 1,
    questions: pairs.map(([q]) => q),
  } satisfies Unit;
  const answers: AnswerSet = Object.fromEntries(pairs.map(([q, a]) => [q.id, a]));
  return traceUnit(unit, answers, FILE);
}

/** `value:status` for each finding in one field. */
function statuses(result: ReturnType<typeof trace>, where: RegExp = /./): string[] {
  return result.findings.filter((f) => where.test(f.where)).map((f) => `${f.value}:${f.status}`);
}

const model = (factIds: string[], modelAnswer: string) => trace(sa(1, factIds, { modelAnswer }));

describe("traceUnit: reading numbers", () => {
  it("removes thousands commas and treats 36 as 36.0", () => {
    expect(statuses(model(["C01"], "It reached US$13,862 bn from US$318 bn."))).toEqual(["13862:OK", "318:OK"]);
    expect(statuses(model(["C03"], "The index was 36."))).toEqual(["36:OK"]);
  });

  it("reads financial-year and survey periods", () => {
    expect(statuses(model(["C03"], "In FY2025/26, or 2025–26, and in 1995-96."))).toEqual(["2025-26:OK", "2025-26:OK", "1995-96:OK"]);
    expect(statuses(model(["C03"], "In 2023/24."))).toEqual(["2023-24:UNTRACED"]);
  });

  it("reads full dates: a wrong day is untraced, the bare year of a row date is right", () => {
    expect(statuses(model(["C02"], "Signed on 11 Dec 2001."))).toEqual(["11 Dec 2001:OK"]);
    expect(statuses(model(["C02"], "Signed on 11 December 2001."))).toEqual(["11 Dec 2001:OK"]);
    expect(statuses(model(["C02"], "Signed on 12 Dec 2001."))).toEqual(["12 Dec 2001:UNTRACED"]);
    expect(statuses(model(["C02"], "Signed in 2001."))).toEqual(["2001:OK"]);
  });

  it("ignores digits glued to letters and mark counts", () => {
    expect(statuses(model(["C01"], "CO2 and S8 appear in this 3-mark answer, worth 3 marks."))).toEqual([]);
  });
});

describe("traceUnit: statuses", () => {
  it("marks a rounding of a row value", () => {
    expect(statuses(model(["C01"], "About 14,000 bn."))).toEqual(["14000:ROUNDED"]);
    expect(statuses(model(["C01"], "About 20,000 bn."))).toEqual(["20000:UNTRACED"]);
  });

  it("holds strict fields to the question's own rows and loose fields to the whole file", () => {
    const result = trace(
      sa(1, ["C01"], { modelAnswer: "There were 777." }),
      mc(2, ["C01"], { correctText: "Right", wrongExplanations: { "It was 777": "No: 777 is gadgets." } }),
    );
    expect(statuses(result, /model/)).toEqual(["777:OTHER_ROW"]);
    expect(statuses(result, /option|explanation/)).toEqual(["777:OK", "777:OK"]);
  });

  it("marks a value found nowhere", () => {
    const result = trace(mc(1, ["C01"], { correctText: "Right", wrongExplanations: { "It was 4242": "Wrong." } }));
    expect(statuses(result)).toEqual(["4242:UNTRACED"]);
  });

  it("names the question, the field and its facts", () => {
    expect(model(["C01"], "There were 777.").findings[0]).toEqual({
      questionId: `${U}.s01`,
      where: "model answer",
      value: "777",
      status: "OTHER_ROW",
      factIds: ["C01"],
    });
  });
});

describe("traceUnit: warnings", () => {
  it("warns on a changed magnitude word", () => {
    expect(model(["C01"], "It reached US$13,862 million.").warnings.join("\n")).toMatch(/s01.*13862 million.*bn/);
    expect(model(["C01"], "It reached US$13,862 bn.").warnings.join("\n")).not.toMatch(/million/);
  });

  it("warns when a short-answer prompt hands over a figure or period it awards", () => {
    const given = sa(1, ["C01"], { rubric: ["Figure: 318 to 13,862.", "Period: 1990 to 2025.", "What it shows: growth."] }, "How did it change after 1990?");
    expect(trace(given).warnings.join("\n")).toMatch(/s01.*prompt.*1990/);
    const clean = sa(1, ["C01"], { rubric: ["Figure: 318.", "Period: 1990.", "What it shows: growth."] }, "How did it change?");
    expect(trace(clean).warnings.join("\n")).not.toMatch(/prompt/);
  });

  it("warns on a fact shared by a multiple-choice and a short-answer question", () => {
    const result = trace(mc(1, ["C01"], {}), sa(2, ["C01"], {}));
    expect(result.warnings.join("\n")).toMatch(/C01.*m01.*s02/);
  });

  it("lists a capitalised name the file does not hold", () => {
    expect(model(["C02"], "The pact was signed in Zubrovia, not in Freedonia.").warnings.join("\n")).toMatch(/Freedonia/);
    expect(model(["C02"], "The pact was signed in Zubrovia.").warnings.join("\n")).not.toMatch(/Zubrovia/);
  });
});

describe("traceUnit: impact lines are never a source", () => {
  it("does not take a number from the context-and-impact section", () => {
    const result = trace(
      sa(1, ["C01"], { modelAnswer: "There were 5150." }),
      mc(2, ["C01"], { correctText: "Right", wrongExplanations: { "There were 5150": "Wrong." } }),
    );
    expect(statuses(result)).toEqual(["5150:UNTRACED", "5150:UNTRACED"]);
  });

  it("does not take a name from an impact line", () => {
    expect(model(["C01"], "The gain went to the Quibblers.").warnings.join("\n")).toMatch(/Quibblers/);
  });
});
