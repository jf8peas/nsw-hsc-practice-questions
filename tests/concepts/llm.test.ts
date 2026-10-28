// Prompts, reply parsing, the review pass rule and the verbatim-overlap pre-check
// (spec 002 FR-015, FR-024; contracts/llm.md).

import { afterEach, describe, expect, it, vi } from "vitest";

import { sameModel, createConceptLlmPort } from "@/lib/concepts/llm.server";
import { overlapsAnswerKey, normalise } from "@/lib/concepts/precheck";
import {
  ILLUSTRATION_CHECKS,
  SUMMARY_CHECKS,
  illustrationMessages,
  illustrationReviewMessages,
  parseSummary,
  parseVerdict,
  summaryMessages,
  summaryReviewMessages,
} from "@/lib/concepts/prompts";
import type { ReviewMaterial } from "@/lib/concepts/port";

import { GOOD_BULLETS, GOOD_SVG, READY, conceptId, fixtureAnswers, readyUnit } from "../helpers/concept-fixtures";

const A = conceptId("a");
const unit = { id: READY, title: readyUnit.title, topic: readyUnit.topic, description: readyUnit.description };
const concept = { id: A, description: "Concept A" };
const tagged = readyUnit.questions.filter((q) => q.concept === A);
const questionPrompts = tagged.map((q) => q.prompt);

function material(): ReviewMaterial {
  return {
    questions: tagged.map((q) => {
      const key = fixtureAnswers[q.id];
      return { id: q.id, prompt: q.prompt, type: q.type, modelAnswer: key.modelAnswer, rubric: key.rubric, correctText: key.correctText };
    }),
  };
}

const text = (messages: Array<{ content: string }>) => messages.map((m) => m.content).join("\n");

describe("what each prompt contains", () => {
  // every real answer-key string (a one-word rubric like "why" would match ordinary instructions)
  const answerKeyStrings = Object.values(fixtureAnswers)
    .flatMap((a) => [a.modelAnswer, a.correctText, ...a.rubric].filter((x): x is string => Boolean(x)))
    .filter((s) => s.length >= 8);

  it("the summary generator sees the unit, concept and public question prompts, and no answer key at all", () => {
    const prompt = text(summaryMessages({ model: "m/gen", unit, concept, questionPrompts, attemptNo: 1 }));
    expect(prompt).toContain(unit.title);
    expect(prompt).toContain("Concept A");
    for (const p of questionPrompts) expect(prompt).toContain(p);
    for (const secret of answerKeyStrings) expect(prompt).not.toContain(secret);
    expect(prompt).toContain("[task: concept-summary]");
  });

  it("the prompt builders take no student input, so a prompt can contain no student name, email or answer", () => {
    // @ts-expect-error a student field is not part of the input type
    summaryMessages({ model: "m/gen", unit, concept, questionPrompts, attemptNo: 1, studentName: "Alice" });
    // @ts-expect-error nor is a student's answer
    summaryReviewMessages({ model: "m/rev", unit, concept, questionPrompts, bullets: GOOD_BULLETS, material: material(), studentAnswer: "x" });
    expect(true).toBe(true);
  });

  it("the summary reviewer sees the bullets and the answer key", () => {
    const prompt = text(summaryReviewMessages({ model: "m/rev", unit, concept, questionPrompts, bullets: GOOD_BULLETS, material: material() }));
    for (const b of GOOD_BULLETS) expect(prompt).toContain(b);
    expect(prompt).toContain("Model answer for short 1");
    expect(prompt).toContain("Right 1");
    expect(prompt).toContain("Rubric point one for short 1");
    expect(prompt).toContain("CONFIDENTIAL");
    expect(prompt).toContain("[task: concept-summary-review]");
  });

  it("the illustration prompts carry the brief and the SVG source, and name the checks", () => {
    const gen = text(illustrationMessages({ model: "m/draw", unit, concept, bullets: GOOD_BULLETS, brief: "A supply curve", alt: "A graph", attemptNo: 1 }));
    expect(gen).toContain("A supply curve");
    expect(gen).toContain("viewBox=\"0 0 640 400\"");
    const rev = text(illustrationReviewMessages({ model: "m/rev", unit, concept, bullets: GOOD_BULLETS, brief: "A supply curve", alt: "A graph", svg: GOOD_SVG, material: material() }));
    expect(rev).toContain(GOOD_SVG);
    for (const check of ILLUSTRATION_CHECKS) expect(rev).toContain(check);
    for (const check of SUMMARY_CHECKS) expect(text(summaryReviewMessages({ model: "m", unit, concept, questionPrompts, bullets: GOOD_BULLETS, material: material() }))).toContain(check);
  });
});

describe("parseSummary", () => {
  const good = (over: Record<string, unknown> = {}) => JSON.stringify({ bullets: ["a one", "a two", "a three"], illustration: null, ...over });

  it("accepts 3 to 6 bullets with no illustration or with a brief and alt text", () => {
    expect(parseSummary(good())).toMatchObject({ ok: true, value: { illustration: null } });
    const r = parseSummary(good({ illustration: { brief: " a diagram ", alt: " a graph " } }));
    expect(r).toMatchObject({ ok: true, value: { illustration: { brief: "a diagram", alt: "a graph" } } });
    expect(parseSummary(good({ bullets: ["1", "2", "3", "4", "5", "6"] })).ok).toBe(true);
  });

  it("finds the JSON inside prose or a code fence", () => {
    expect(parseSummary("Sure!\n```json\n" + good() + "\n```\nHope that helps.").ok).toBe(true);
  });

  it("rejects 2 or 7 bullets, a 241-character bullet, an empty or non-text bullet", () => {
    expect(parseSummary(good({ bullets: ["a", "b"] })).ok).toBe(false);
    expect(parseSummary(good({ bullets: ["1", "2", "3", "4", "5", "6", "7"] })).ok).toBe(false);
    expect(parseSummary(good({ bullets: ["a", "b", "x".repeat(241)] })).ok).toBe(false);
    expect(parseSummary(good({ bullets: ["a", "b", "  "] })).ok).toBe(false);
    expect(parseSummary(good({ bullets: ["a", "b", 3] })).ok).toBe(false);
    expect(parseSummary(good({ bullets: ["a", "b", "x".repeat(240)] })).ok).toBe(true);
  });

  it("rejects a missing illustration key, a half-filled illustration, long alt text and non-JSON", () => {
    expect(parseSummary(JSON.stringify({ bullets: ["a", "b", "c"] })).ok).toBe(false);
    expect(parseSummary(good({ illustration: { brief: "x" } })).ok).toBe(false);
    expect(parseSummary(good({ illustration: { brief: "x", alt: "y".repeat(301) } })).ok).toBe(false);
    expect(parseSummary(good({ illustration: "a diagram" })).ok).toBe(false);
    expect(parseSummary("I cannot do that.").ok).toBe(false);
    const r = parseSummary("nope");
    expect(r).toMatchObject({ ok: false, kind: "content_rejected" });
  });
});

describe("parseVerdict and the pass rule", () => {
  const checks = (over: Record<string, boolean> = {}) => ({ matches_concept: true, accurate: true, no_answer_leak: true, general_not_question_specific: true, ...over });
  const reply = (obj: unknown) => JSON.stringify(obj);

  it("passes only when every required check is true", () => {
    const r = parseVerdict(reply({ checks: checks(), reason: "" }), SUMMARY_CHECKS);
    expect(r).toMatchObject({ ok: true, verdict: { pass: true } });
  });

  it("ignores a 'pass: true' the model volunteers when a check is false", () => {
    const r = parseVerdict(reply({ pass: true, checks: checks({ accurate: false }), reason: "Wrong about elasticity." }), SUMMARY_CHECKS);
    expect(r).toMatchObject({ ok: true, verdict: { pass: false, reason: "Wrong about elasticity." } });
  });

  it("ignores a 'pass: false' too, and extra checks it did not ask for", () => {
    const r = parseVerdict(reply({ pass: false, checks: { ...checks(), bonus: false } }), SUMMARY_CHECKS);
    expect(r).toMatchObject({ ok: true, verdict: { pass: true } });
  });

  it("treats a missing check, a non-boolean check, no checks, or non-JSON as unusable (reviewer unavailable), not as a failure", () => {
    const missing = checks();
    delete (missing as Partial<typeof missing>).accurate;
    expect(parseVerdict(reply({ checks: missing }), SUMMARY_CHECKS).ok).toBe(false);
    expect(parseVerdict(reply({ checks: { ...checks(), accurate: "yes" } }), SUMMARY_CHECKS).ok).toBe(false);
    expect(parseVerdict(reply({ reason: "fine" }), SUMMARY_CHECKS).ok).toBe(false);
    expect(parseVerdict("looks good to me", SUMMARY_CHECKS).ok).toBe(false);
  });

  it("supplies a reason when the model gave none for a failure, and truncates a long one to 1000", () => {
    const r = parseVerdict(reply({ checks: checks({ no_answer_leak: false }) }), SUMMARY_CHECKS);
    expect(r).toMatchObject({ ok: true, verdict: { pass: false } });
    if (r.ok) expect(r.verdict.reason).toContain("no_answer_leak");
    const long = parseVerdict(reply({ checks: checks({ accurate: false }), reason: "x".repeat(3000) }), SUMMARY_CHECKS);
    if (long.ok) expect(long.verdict.reason).toHaveLength(1000);
  });

  it("uses the illustration checks for pictures", () => {
    const all = Object.fromEntries(ILLUSTRATION_CHECKS.map((c) => [c, true]));
    expect(parseVerdict(reply({ checks: all }), ILLUSTRATION_CHECKS)).toMatchObject({ ok: true, verdict: { pass: true } });
    expect(parseVerdict(reply({ checks: { ...all, axes_correct: false } }), ILLUSTRATION_CHECKS)).toMatchObject({ verdict: { pass: false } });
  });
});

describe("overlapsAnswerKey", () => {
  const model = "The price mechanism allocates scarce resources by signalling relative scarcity to buyers and sellers.";

  it("flags a run of 8 shared words, ignoring case and punctuation", () => {
    expect(overlapsAnswerKey("In short: THE price mechanism allocates scarce resources by signalling, relative scarcity.", [model])).toBe(true);
  });

  it("does not flag 7 shared words", () => {
    // "the price mechanism allocates scarce resources by" is 7 words; the next word differs
    expect(overlapsAnswerKey("the price mechanism allocates scarce resources by sending clear signals", [model])).toBe(false);
  });

  it("checks every piece of material, and handles empty input", () => {
    expect(overlapsAnswerKey("nothing in common here at all whatsoever really", [model, "something else entirely"])).toBe(false);
    expect(overlapsAnswerKey("short text", [model])).toBe(false);
    expect(overlapsAnswerKey(model, [])).toBe(false);
    expect(overlapsAnswerKey(model, ["", "  "])).toBe(false);
    expect(overlapsAnswerKey(model, ["unrelated", model])).toBe(true);
  });

  it("normalises case, punctuation and spacing", () => {
    expect(normalise("  Hello,   WORLD! (again) ")).toBe("hello world again");
  });
});

describe("sameModel", () => {
  it("ignores case and a :variant suffix, and tells different models apart", () => {
    expect(sameModel("Vendor/Model", "vendor/model")).toBe(true);
    expect(sameModel("vendor/model:online", "vendor/model")).toBe(true);
    expect(sameModel("vendor/model:free", "vendor/model:online")).toBe(true);
    expect(sameModel(" vendor/model ", "vendor/model")).toBe(true);
    expect(sameModel("vendor/model-a", "vendor/model-b")).toBe(false);
    expect(sameModel("a/model", "b/model")).toBe(false);
  });
});

describe("the real port, with fetch stubbed", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function stubFetch(handler: (body: Record<string, unknown>) => { status?: number; content?: string }) {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const spy = vi.fn(async (_url: unknown, init?: { body?: string }) => {
      const out = handler(JSON.parse(init?.body ?? "{}"));
      return new Response(JSON.stringify({ choices: [{ message: { content: out.content ?? "" } }] }), { status: out.status ?? 200 });
    });
    vi.stubGlobal("fetch", spy);
    return spy;
  }
  const summaryInput = { model: "m/gen", unit, concept, questionPrompts, attemptNo: 1 as const };

  it("returns a parsed summary, asking for JSON at temperature 0.4 (0.7 on the regeneration)", async () => {
    const spy = stubFetch(() => ({ content: JSON.stringify({ bullets: GOOD_BULLETS, illustration: null }) }));
    const port = createConceptLlmPort();
    expect(await port.generateSummary(summaryInput)).toMatchObject({ ok: true });
    await port.generateSummary({ ...summaryInput, attemptNo: 2 });
    const bodies = spy.mock.calls.map((c) => JSON.parse(c[1]!.body as string));
    expect(bodies[0]).toMatchObject({ model: "m/gen", temperature: 0.4, response_format: { type: "json_object" } });
    expect(bodies[1].temperature).toBe(0.7);
  });

  it("a non-2xx reply or a missing key is a call failure; unusable content is a content rejection", async () => {
    stubFetch(() => ({ status: 502 }));
    expect(await createConceptLlmPort().generateSummary(summaryInput)).toMatchObject({ ok: false, kind: "call_failed" });
    stubFetch(() => ({ content: "not json" }));
    expect(await createConceptLlmPort().generateSummary(summaryInput)).toMatchObject({ ok: false, kind: "content_rejected" });
    vi.unstubAllEnvs();
    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect(await createConceptLlmPort().generateSummary(summaryInput)).toMatchObject({ ok: false, kind: "call_failed" });
  });

  it("a review reply missing a check is a call failure (reviewer unavailable), a complete one is a verdict", async () => {
    const input = { model: "m/rev", unit, concept, questionPrompts, bullets: GOOD_BULLETS, material: material() };
    stubFetch(() => ({ content: JSON.stringify({ checks: { matches_concept: true } }) }));
    expect(await createConceptLlmPort().reviewSummary(input)).toMatchObject({ ok: false, kind: "call_failed" });
    stubFetch(() => ({ content: JSON.stringify({ checks: Object.fromEntries(SUMMARY_CHECKS.map((c) => [c, true])) }) }));
    expect(await createConceptLlmPort().reviewSummary(input)).toMatchObject({ ok: true, verdict: { pass: true } });
  });

  it("generates an illustration only if the SVG passes the allowlist", async () => {
    const input = { model: "m/draw", unit, concept, bullets: GOOD_BULLETS, brief: "b", alt: "a", attemptNo: 1 as const };
    stubFetch(() => ({ content: "```svg\n" + GOOD_SVG + "\n```" }));
    expect(await createConceptLlmPort().generateIllustration(input)).toMatchObject({ ok: true });
    stubFetch(() => ({ content: '<svg viewBox="0 0 1 1"><script>x()</script></svg>' }));
    expect(await createConceptLlmPort().generateIllustration(input)).toMatchObject({ ok: false, kind: "content_rejected" });
  });

  it("reviews an illustration by sending the rendered picture and the source", async () => {
    const spy = stubFetch(() => ({ content: JSON.stringify({ checks: Object.fromEntries(ILLUSTRATION_CHECKS.map((c) => [c, true])) }) }));
    const result = await createConceptLlmPort().reviewIllustration({
      model: "m/rev", unit, concept, bullets: GOOD_BULLETS, brief: "b", alt: "a", svg: GOOD_SVG, material: material(),
    });
    if (!result.ok && result.reason.startsWith("could not render")) return; // native renderer unavailable here
    expect(result).toMatchObject({ ok: true, verdict: { pass: true } });
    const body = JSON.parse(spy.mock.calls[0][1]!.body as string);
    const userContent = body.messages[1].content as Array<{ type: string; image_url?: { url: string }; text?: string }>;
    expect(userContent.find((p) => p.type === "image_url")?.image_url?.url).toMatch(/^data:image\/png;base64,/);
    expect(userContent.find((p) => p.type === "text")?.text).toContain(GOOD_SVG);
  });
});
