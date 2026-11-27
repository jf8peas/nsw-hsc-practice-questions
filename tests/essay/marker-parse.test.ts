import { describe, expect, it } from "vitest";

import { containsKeyEcho, parseEssayReply, scrubKeyMentions, type ParsedEssayReply } from "@/lib/essay/marker.server";
import { trimToLimit } from "@/lib/trim";

import { markerEssayContent } from "../helpers/essay";

// contracts/replies.md §1: what the marker's reply must carry, and what the parser drops or repairs.

const ESSAY = "China GDP was $90 trillion in 2020 and the WTO entry in 2001 opened export markets for Chinese manufacturers across the world economy.";
const parse = (content: string, essay = ESSAY) => parseEssayReply(content, essay);
const obj = (o: Parameters<typeof markerEssayContent>[0] = {}): Record<string, unknown> => JSON.parse(markerEssayContent(o));
const text = (o: Record<string, unknown>) => JSON.stringify(o);

describe("a valid reply", () => {
  it("parses every field, with concept ids made full ids", () => {
    const r = parse(markerEssayContent())!;
    expect(r).toMatchObject({ band: 2, mark: 14, covers: true, usedWellPresent: true });
    expect(Object.keys(r.criteria)).toEqual(["understanding", "theory", "assessment", "data", "structure"]);
    expect(r.criteria.assessment.verdict).toBe("developing");
    expect(r.lift).toHaveLength(2);
    expect(r.gaps).toEqual([{ conceptId: "y12-economics-essay-writing.c-china-wto", detail: expect.stringContaining("MARKER-GAP-7710") }]);
    expect(r.usedWell).toEqual(["y12-economics-essay-writing.c-skill-judgement"]);
  });

  it("takes the first JSON object out of surrounding prose", () => {
    expect(parse(`Here is my marking:\n${markerEssayContent()}\nThanks.`)?.mark).toBe(14);
  });
});

describe("a reply that must fail (never a default)", () => {
  it.each([
    ["not json", "I could not mark this."],
    ["a missing verdict", (() => { const o = obj(); delete (o.criteria as Record<string, unknown>).data; return text(o); })()],
    ["a verdict outside the four", (() => { const o = obj(); (o.criteria as Record<string, { verdict: string }>).data.verdict = "excellent"; return text(o); })()],
    ["band 0", text({ ...obj(), band: 0 })],
    ["band 6", text({ ...obj(), band: 6 })],
    ["a non-integer band", text({ ...obj(), band: 2.5 })],
    ["a non-integer mark", text({ ...obj(), mark: 14.5 })],
    ["a mark over 20", text({ ...obj(), mark: 21 })],
    ["a missing coversRequiredEconomies", (() => { const o = obj(); delete o.coversRequiredEconomies; return text(o); })()],
    ["a string coversRequiredEconomies", text({ ...obj(), coversRequiredEconomies: "true" })],
    ["a missing band reason", text({ ...obj(), bandReason: "" })],
    ["no lift points", text({ ...obj(), liftYourMark: [] })],
  ])("%s", (_name, content) => {
    expect(parse(content)).toBeNull();
  });
});

describe("lift points", () => {
  it("accepts a single string as one lift point", () => {
    expect(parse(text({ ...obj(), liftYourMark: "Add a dated Gini figure." }))?.lift).toEqual(["Add a dated Gini figure."]);
  });

  it("rejects an empty string", () => {
    expect(parse(text({ ...obj(), liftYourMark: "  " }))).toBeNull();
  });

  it("keeps the first two of three", () => {
    expect(parse(text({ ...obj(), liftYourMark: ["a", "b", "c"] }))?.lift).toEqual(["a", "b"]);
  });
  it("accepts one", () => {
    expect(parse(text({ ...obj(), liftYourMark: ["only"] }))?.lift).toEqual(["only"]);
  });
});

describe("flagged figures", () => {
  it("drops a flag whose quote is not in the essay, keeps one that is", () => {
    const r = parse(markerEssayContent({ flags: [{ quote: "GDP was $90 trillion in 2020", why: "far too high" }, { quote: "never written", why: "invented" }] }))!;
    expect(r.flags.map((f) => f.quote)).toEqual(["GDP was $90 trillion in 2020"]);
    expect(r.flags[0].why).toBe("far too high");
  });

  it("replaces a reason that states a number not in the quote", () => {
    const r = parse(markerEssayContent({ flags: [{ quote: "GDP was $90 trillion in 2020", why: "It was about 14.7 trillion" }] }))!;
    expect(r.flags[0].why).toBe("This figure looks wrong; check it against a source.");
  });

  it("keeps at most five", () => {
    const flags = Array.from({ length: 8 }, () => ({ quote: "WTO entry in 2001", why: "check" }));
    expect(parse(markerEssayContent({ flags }))!.flags).toHaveLength(5);
  });
});

describe("gaps and concepts used well", () => {
  it("drops ids that are not on the concept list and de-duplicates", () => {
    const r = parse(markerEssayContent({ gaps: [{ concept: "nope", detail: "x" }, { concept: "china-wto", detail: "a" }, { concept: "china-wto", detail: "b" }] }))!;
    expect(r.gaps.map((g) => g.conceptId)).toEqual(["y12-economics-essay-writing.c-china-wto"]);
    expect(r.gaps[0].detail).toBe("a");
  });

  it("keeps at most five gaps, in the marker's order", () => {
    const keys = ["china-wto", "china-fdi-bri", "china-soe", "china-hukou", "china-environment", "china-rebalancing", "china-open-door"];
    const r = parse(markerEssayContent({ gaps: keys.map((k) => ({ concept: k, detail: k })) }))!;
    expect(r.gaps.map((g) => g.detail)).toEqual(keys.slice(0, 5));
  });

  it("removes a used-well id that is also a gap, and ids not on the list", () => {
    const r = parse(markerEssayContent({ used: ["china-wto", "skill-models", "bogus"] }))!;
    expect(r.usedWell).toEqual(["y12-economics-essay-writing.c-skill-models"]);
  });

  it("treats a reply with no conceptsUsedWell as none, and notes it", () => {
    const o = obj();
    delete o.conceptsUsedWell;
    const r = parse(text(o))!;
    expect(r.usedWell).toEqual([]);
    expect(r.usedWellPresent).toBe(false);
  });

  it("caps the detail length", () => {
    const r = parse(markerEssayContent({ gaps: [{ concept: "china-wto", detail: "x".repeat(900) }] }))!;
    expect(r.gaps[0].detail).toHaveLength(600);
  });
});

describe("long feedback is never cut mid-sentence", () => {
  const sentence = "The essay names dated policies and ties each one to a claim about growth in the economy. ";

  it("keeps a reason of several long sentences whole", () => {
    const reason = sentence.repeat(6).trim();
    const o = obj();
    (o.criteria as Record<string, { reason: string }>).understanding.reason = reason;
    expect(parse(text(o))!.criteria.understanding.reason).toBe(reason);
  });

  it("cuts a runaway reason back to its last whole sentence", () => {
    const o = obj();
    (o.criteria as Record<string, { reason: string }>).understanding.reason = sentence.repeat(40);
    const out = parse(text(o))!.criteria.understanding.reason;
    expect(out.length).toBeLessThanOrEqual(1200);
    expect(out.endsWith("in the economy.")).toBe(true);
  });
});

describe("trimToLimit", () => {
  it("leaves text within the limit alone, apart from outer spaces", () => {
    expect(trimToLimit("  One. Two.  ", 9)).toBe("One. Two.");
  });

  it("keeps a sentence that ends exactly on the limit", () => {
    expect(trimToLimit("One two. Three four. Five.", 20)).toBe("One two. Three four.");
  });

  it("does not take a decimal point for the end of a sentence", () => {
    expect(trimToLimit("HDI rose from 0.29 to 0.56 over four decades of reform", 30)).toBe("HDI rose from 0.29 to 0.56…");
  });

  it("falls back to a whole word with an ellipsis, within the limit", () => {
    expect(trimToLimit("alpha beta gamma delta", 14)).toBe("alpha beta…");
    expect(trimToLimit("x".repeat(50), 10)).toBe(`${"x".repeat(9)}…`);
  });
});

describe("the key echo guard", () => {
  const NOTES = "A band one answer treats the open door policy, special economic zones, and the long run effect of WTO accession on exports and investment in detail";
  const reply = (over: Partial<ParsedEssayReply>): ParsedEssayReply => ({ ...parse(markerEssayContent())!, ...over });

  it("fails a reply that repeats a long run of the marking notes", () => {
    expect(containsKeyEcho(reply({ bandReason: `Good. ${NOTES}.` }), [NOTES], ["a question", ESSAY])).toBe(true);
  });

  it("allows a short run, and a run that is in the question or the essay", () => {
    expect(containsKeyEcho(reply({ bandReason: "It covers the open door policy well." }), [NOTES], ["q", ESSAY])).toBe(false);
    const inEssay = "special economic zones, and the long run effect of WTO accession on exports and investment";
    expect(containsKeyEcho(reply({ bandReason: inEssay }), [NOTES], ["q", `${ESSAY} ${inEssay}`])).toBe(false);
  });

  it("ignores key text shorter than the run", () => {
    expect(containsKeyEcho(reply({ bandReason: "None provided." }), ["None provided."], [])).toBe(false);
  });
});

describe("mentions of the marking notes or school criteria are removed from every student-facing text", () => {
  const HIDDEN = /marking notes?|school(?:'s)? (?:marking )?criteria|marking criteria|marking guide|marking key/i;

  it.each([
    ["named in the notes as", "Hydropower is named in the marking notes as a key strategy but is not developed.", "Hydropower is a key strategy but is not developed."],
    ["listed in the school criteria as", "The WTO is listed in the school's marking criteria as essential.", "The WTO is essential."],
    ["an aside", "Add a model, according to the marking notes, to explain the mechanism.", "Add a model to explain the mechanism."],
    ["a subject", "The marking notes expect a Lorenz curve to show inequality.", "A strong answer includes a Lorenz curve to show inequality."],
    ["any other mention", "No link is made to the school criteria here.", "No link is made to a strong answer here."],
    ["an ordinary sentence", "No Gini coefficient is given for either economy.", "No Gini coefficient is given for either economy."],
  ])("%s", (_name, input, expected) => {
    expect(scrubKeyMentions(input)).toBe(expected);
  });

  it("is applied to gap details, lift points, criterion reasons, the band reason and flag reasons", () => {
    const o = obj();
    (o.criteria as Record<string, { verdict: string; reason: string }>).theory.reason = "The theory is named in the marking notes as essential but is absent.";
    o.bandReason = "A Band 2 answer, as the marking notes describe, with clear judgement.";
    o.liftYourMark = ["The marking notes expect a dated figure for each claim.", "Weigh the limits, per the school criteria, in the conclusion."];
    o.gaps = [{ concept: "china-wto", detail: "WTO accession is named in the marking notes as the key export driver but is not explained." }];
    o.dataFlags = [{ quote: "China GDP was $90 trillion in 2020", why: "This figure looks wrong against the marking notes." }];
    const r = parse(text(o))!;
    const all = [r.bandReason, ...r.lift, ...Object.values(r.criteria).map((c) => c.reason), ...r.gaps.map((g) => g.detail), ...r.flags.map((f) => f.why)];
    for (const t of all) expect(t).not.toMatch(HIDDEN);
    expect(r.gaps[0].detail).toBe("WTO accession is the key export driver but is not explained.");
    expect(r.criteria.theory.reason).toBe("The theory is essential but is absent.");
    expect(r.flags).toHaveLength(1);
  });
});
