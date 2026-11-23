import { describe, expect, it } from "vitest";

import { checkModelEssay, modelProblems } from "@/lib/english-essay/model-check";
import { PlayIndex } from "@/lib/english-essay/play-index";

import { INVENTED_PLAY, INVENTED_QUOTE_FAKE, INVENTED_QUOTE_NEAR, INVENTED_QUOTE_OK } from "../helpers/english-essay";

// Every live model essay: 900 to 1,100 words and zero near or not-found quotations (spec 011 FR-035, T065). Invented text only.

const play = new PlayIndex(INVENTED_PLAY);
const QUESTION = "To what extent do texts illuminate the anomalies in human behaviour?";
const filler = (n: number) => Array.from({ length: n }, () => "word").join(" ");

describe("checkModelEssay", () => {
  it("passes a 1,000-word model whose quotations are all exact", () => {
    const check = checkModelEssay(`${filler(990)} "${INVENTED_QUOTE_OK}"`, QUESTION, play);
    expect(check).toMatchObject({ wordsOk: true, quotations: 1, flags: [] });
    expect(modelProblems("e1", check)).toEqual([]);
  });

  it("refuses a model outside 900 to 1,100 words", () => {
    for (const n of [899, 1101]) {
      const check = checkModelEssay(filler(n), QUESTION, play);
      expect(check.wordsOk).toBe(false);
      expect(modelProblems("e1", check).join("\n")).toContain(`${n} words`);
    }
    expect(checkModelEssay(filler(900), QUESTION, play).wordsOk).toBe(true);
    expect(checkModelEssay(filler(1100), QUESTION, play).wordsOk).toBe(true);
  });

  it("blocks a near quotation and a not-found quotation, naming the exact correction for a near one", () => {
    const check = checkModelEssay(`${filler(990)} "${INVENTED_QUOTE_NEAR}" and "${INVENTED_QUOTE_FAKE}"`, QUESTION, play);
    expect(check.flags.map((f) => f.status)).toEqual(["near", "not-found"]);
    const problems = modelProblems("e2", check).join("\n");
    expect(problems).toContain("close to the play but not exact");
    expect(problems).toContain("The lantern trembled in the salt wind");
    expect(problems).toContain("was not found in the play");
  });

  it("allows a quotation of the question's own wording (other-source), which is not a play quotation", () => {
    const check = checkModelEssay(`${filler(990)} "illuminate the anomalies in human behaviour"`, QUESTION, play);
    expect(check.flags).toEqual([]);
  });
});
