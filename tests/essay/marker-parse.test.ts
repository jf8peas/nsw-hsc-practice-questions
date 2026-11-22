import { describe, expect, it } from "vitest";

import { containsKeyEcho, parseEssayReply, type ParsedEssayReply } from "@/lib/essay/marker.server";

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
    expect(r.gaps[0].detail).toHaveLength(200);
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
