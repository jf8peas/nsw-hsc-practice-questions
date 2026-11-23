import { describe, expect, it } from "vitest";

import { NEAR_RATIO, PlayIndex, normWords } from "@/lib/english-essay/play-index";
import { buildOtherSources, checkQuotes, extractQuotations } from "@/lib/english-essay/quotes";

import { INVENTED_PLAY } from "../helpers/english-essay";

// Invented text only (no real play lines). Expected ratios are computed independently with CPython elsewhere
// (sequence-matcher.test.ts); here the contract is statuses, extraction and the reconstructed correction.

const play = new PlayIndex(INVENTED_PLAY);
const QUESTION = "To what extent do texts illuminate the anomalies in human behaviour?";
const others = buildOtherSources(QUESTION);

describe("extractQuotations", () => {
  it("finds straight and curly double quotes", () => {
    expect(extractQuotations('He wrote "the lantern trembled" and “the harbour bell rang” here.')).toEqual(["the lantern trembled", "the harbour bell rang"]);
  });

  it("finds straight and curly single-quoted quotations, with no newline inside", () => {
    expect(extractQuotations("She said 'the salt wind rose' and ‘the keeper counted’ later.")).toEqual(["the salt wind rose", "the keeper counted"]);
    expect(extractQuotations('"line one\nline two"')).toEqual([]);
  });

  it("keeps an apostrophe between two letters inside a single-quoted quotation", () => {
    expect(extractQuotations("He says 'Tell me what I'm feeling.' then 'We don't look back…' ok")).toEqual(["Tell me what I'm feeling.", "We don't look back…"]);
  });

  it("never opens a quotation at a possessive or a plural possessive", () => {
    expect(extractQuotations("The keeper's lantern and the sailors' ferry were both lit.")).toEqual([]);
    expect(extractQuotations("Tom's idea and Meg's plan, then 'the real quote here' ends.")).toEqual(["the real quote here"]);
  });
});

describe("normWords", () => {
  it("straightens, lower-cases, removes punctuation and trims edge apostrophes", () => {
    expect(normWords("“Don’t,” said the Keeper — ‘quietly’!")).toEqual(["don't", "said", "the", "keeper", "quietly"]);
  });
});

describe("checkQuotes", () => {
  const check = (essay: string, withOthers = true) => checkQuotes(essay, play, withOthers ? others : undefined);

  it("ignores quotations under three normalised words", () => {
    expect(check('He said "the lantern" and "wind rose".')).toEqual([]);
  });

  it("returns ok for an exact match, ignoring punctuation and case", () => {
    expect(check('"The lantern trembled, in the SALT wind."')).toEqual([{ quote: "The lantern trembled, in the SALT wind.", status: "ok" }]);
  });

  it("splits on ellipsis and slash and matches each kept segment of two or more words", () => {
    expect(check('"The lantern trembled ... the harbour bell rang"')[0]!.status).toBe("ok");
    expect(check('"The lantern trembled / the harbour bell rang"')[0]!.status).toBe("ok");
    expect(check('"The lantern trembled… every window stayed lit"')[0]!.status).toBe("ok");
    // a one-word segment is dropped, the rest must still match
    expect(check('"the lantern trembled in the salt wind ... x"')[0]!.status).toBe("ok");
    // one bad segment fails the whole quotation
    expect(check('"The lantern trembled ... the moon repaired every sorrow"')[0]!.status).not.toBe("ok");
  });

  it("returns near with the play's exact raw words and a two-decimal ratio", () => {
    const [r] = check('"the lantern trembles in the salt wind"');
    expect(r).toMatchObject({ status: "near", correct: "The lantern trembled in the salt wind" });
    expect(r!.ratio).toBeGreaterThanOrEqual(NEAR_RATIO);
    expect(String(r!.ratio).split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });

  it("returns not-found with a ratio and no correction for an invented quotation", () => {
    const [r] = check('"the moon repaired every sorrow before dawn"');
    expect(r).toMatchObject({ status: "not-found" });
    expect(r!.ratio).toBeLessThan(NEAR_RATIO);
    expect("correct" in r!).toBe(false);
  });

  it("returns other-source for the question's own wording or a listed phrase, never a flag", () => {
    expect(check('"illuminate the anomalies in human behaviour"')[0]!.status).toBe("other-source");
    expect(check('"individual and collective human experiences"')[0]!.status).toBe("other-source");
    // without an other-sources index the same quotation is not found in the play
    expect(check('"illuminate the anomalies in human behaviour"', false)[0]!.status).toBe("not-found");
  });

  it("returns results in essay order, every occurrence", () => {
    const out = check('First "the lantern trembled in the salt wind", then "the moon repaired every sorrow before dawn", then "the lantern trembled in the salt wind".');
    expect(out.map((r) => r.status)).toEqual(["ok", "not-found", "ok"]);
  });
});
