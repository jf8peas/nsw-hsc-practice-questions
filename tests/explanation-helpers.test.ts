import { describe, expect, it } from "vitest";

import { withWrongExplanations } from "@/content/explanation-helpers";
import type { AnswerSet, Question } from "@/lib/types";

const U = "unit-x";
const questions: Question[] = [
  {
    id: `${U}.m01`,
    type: "mc",
    prompt: "Pick one",
    maxMarks: 1,
    options: ["Right answer", "Wrong alpha", "Wrong beta", "Wrong gamma"],
  },
  { id: `${U}.s01`, type: "short", prompt: "Explain", maxMarks: 2 },
];
const answers: AnswerSet = {
  [`${U}.m01`]: { correctText: "Right answer", rubric: ["why"] },
  [`${U}.s01`]: { modelAnswer: "model", rubric: ["a", "b"] },
};
const run = (table: Parameters<typeof withWrongExplanations>[3]) => withWrongExplanations(answers, questions, U, table);

describe("withWrongExplanations", () => {
  it("resolves the start of each option to its full text and leaves everything else alone", () => {
    const out = run({ 1: [["Wrong a", "A."], ["Wrong b", "B."], ["Wrong g", "  C.  "]] });
    expect(out[`${U}.m01`].wrongExplanations).toEqual({ "Wrong alpha": "A.", "Wrong beta": "B.", "Wrong gamma": "C." });
    expect(out[`${U}.m01`].correctText).toBe("Right answer");
    expect(out[`${U}.s01`]).toBe(answers[`${U}.s01`]);
    expect(answers[`${U}.m01`].wrongExplanations).toBeUndefined(); // the input is not changed
  });

  it("fails when a start matches no option or more than one", () => {
    expect(() => run({ 1: [["Nothing like this", "x"]] })).toThrow(/matches 0/);
    expect(() => run({ 1: [["Wrong", "x"]] })).toThrow(/matches 3/);
  });

  it("fails for the correct option, a repeated option, a short question or an unknown question", () => {
    expect(() => run({ 1: [["Right", "x"]] })).toThrow(/correct option/);
    expect(() => run({ 1: [["Wrong a", "x"], ["Wrong alp", "y"]] })).toThrow(/two explanations/);
    expect(() => run({ 2: [["x", "y"]] })).toThrow(/not a multiple-choice/);
    expect(() => run({ 9: [["x", "y"]] })).toThrow(/not a multiple-choice/);
  });
});
