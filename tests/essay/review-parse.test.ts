import { describe, expect, it } from "vitest";

import { CHECK_LABEL, CHECK_ORDER } from "@/lib/essay/review-labels";
import { CHECK_IDS, buildReviewMessages, parseReviewReply, planForPrompt, reviewPrompt } from "@/lib/essay/review.server";
import { emptyScaffold, setField } from "@/lib/essay/scaffold";

import { reviewEssayContent } from "../helpers/essay";

const PLAN = setField(setField(emptyScaffold(), { section: "intro", key: "judgement" }, "China gained a lot"), { section: "body1", key: "data" }, "GDP was $90 trillion in 2020");
const planText = planForPrompt(PLAN);
const parse = (c: string) => parseReviewReply(c, planText);
const obj = (o: Parameters<typeof reviewEssayContent>[0] = {}): Record<string, unknown> => JSON.parse(reviewEssayContent(o));

describe("the review prompt and its labels", () => {
  it("has the seven checks in the order the student sees them, with the same labels as the public list", () => {
    expect(CHECK_IDS).toEqual([...CHECK_ORDER]);
    for (const c of reviewPrompt.checks) expect(c.label).toBe(CHECK_LABEL[c.id as keyof typeof CHECK_LABEL]);
  });

  it("tells the reviewer never to write for the student or give a mark, and to ask questions", () => {
    const [system, user] = buildReviewMessages({ question: "Q?", verb: "evaluate", economy: "both", plan: PLAN });
    expect(String(system.content)).toMatch(/Never write sentences, paragraphs/);
    expect(String(system.content)).toMatch(/never give a mark or a band/);
    expect(String(system.content)).toMatch(/question or prompt/);
    expect(String(user.content)).toContain("China gained a lot");
    expect(String(user.content)).toContain("(empty)");
    expect(String(user.content)).toContain("both must be treated");
  });

  it("never gives the reviewer any marking key", () => {
    const [system, user] = buildReviewMessages({ question: "Q?", verb: "evaluate", economy: "both", plan: PLAN });
    for (const banned of ["markingNotes", "schoolCriteria", "modelEssay", "Band 1 (17"]) {
      expect(JSON.stringify([system.content, user.content])).not.toContain(banned);
    }
  });
});

describe("a valid review", () => {
  it("parses seven lines in the student's order, as strengths or fixes", () => {
    const r = parse(reviewEssayContent({ fixes: ["models", "answers"] }))!;
    expect(r.checks.map((c) => c.id)).toEqual([...CHECK_ORDER]);
    expect(r.checks.filter((c) => c.status === "fix").map((c) => c.id)).toEqual(["answers", "models"]);
    expect(r.figureFlags).toEqual([]);
  });

  it("re-sorts checks that come back in another order", () => {
    const o = obj();
    (o.checks as unknown[]).reverse();
    expect(parse(JSON.stringify(o))!.checks.map((c) => c.id)).toEqual([...CHECK_ORDER]);
  });
});

describe("a review that must fail", () => {
  it.each([
    ["not json", "sorry"],
    ["six checks", (() => { const o = obj(); (o.checks as unknown[]).pop(); return JSON.stringify(o); })()],
    ["a repeated id", (() => { const o = obj(); (o.checks as Array<{ id: string }>)[1].id = "answers"; return JSON.stringify(o); })()],
    ["an unknown id", (() => { const o = obj(); (o.checks as Array<{ id: string }>)[1].id = "style"; return JSON.stringify(o); })()],
    ["a status outside the two", (() => { const o = obj(); (o.checks as Array<{ status: string }>)[0].status = "good"; return JSON.stringify(o); })()],
    ["an empty line", (() => { const o = obj(); (o.checks as Array<{ line: string }>)[0].line = " "; return JSON.stringify(o); })()],
    ["a line over 240 characters", (() => { const o = obj(); (o.checks as Array<{ line: string }>)[0].line = "x".repeat(241); return JSON.stringify(o); })()],
    ["a fix that is a statement, not a question", (() => { const o = obj(); const c = (o.checks as Array<{ id: string; status: string; line: string }>).find((x) => x.status === "fix")!; c.line = "Add a year to your data."; return JSON.stringify(o); })()],
  ])("%s", (_name, content) => {
    expect(parse(content)).toBeNull();
  });

  it("allows a strength line that is not a question", () => {
    expect(parse(reviewEssayContent({ fixes: [] }))).not.toBeNull();
  });
});

describe("what the review may carry", () => {
  it("ignores a mark, a band or rewritten text if the model adds them", () => {
    const r = parse(reviewEssayContent({ extra: { mark: 15, band: 2, rewrittenPlan: "A whole new paragraph", sample: "x" } }))!;
    const s = JSON.stringify(r);
    for (const banned of ["rewrittenPlan", "sample", "A whole new paragraph", '"mark"', '"band":']) expect(s).not.toContain(banned);
    expect(Object.keys(r).sort()).toEqual(["checks", "figureFlags"]);
    for (const c of r.checks) expect(Object.keys(c).sort()).toEqual(["id", "line", "status"]);
  });

  it("keeps a flag whose quote is in the plan and drops one that is not", () => {
    const r = parse(reviewEssayContent({ flags: [{ quote: "GDP was $90 trillion in 2020", why: "far too large" }, { quote: "not in the plan", why: "x" }] }))!;
    expect(r.figureFlags).toEqual([{ quote: "GDP was $90 trillion in 2020", why: "far too large" }]);
  });

  it("never states a replacement figure", () => {
    const r = parse(reviewEssayContent({ flags: [{ quote: "GDP was $90 trillion in 2020", why: "It was about 14.7 trillion." }] }))!;
    expect(r.figureFlags[0].why).toBe("This figure looks wrong; check it against a source.");
  });

  it("keeps at most four flags", () => {
    const flags = Array.from({ length: 6 }, () => ({ quote: "China gained a lot", why: "check" }));
    expect(parse(reviewEssayContent({ flags }))!.figureFlags).toHaveLength(4);
  });
});
