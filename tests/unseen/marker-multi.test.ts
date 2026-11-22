// The marker generalised to a list of texts, a skill list and a rubric parameter (spec 009 research R6,
// tasks T006 and T007). The single-text path must stay what spec 008 shipped; the multi-text path adds
// the texts block and nine verdicts. chatCompletion is stubbed; no network.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Rubric, UnseenMarkerInput } from "@/lib/unseen/marker.server";
import { COMPARATIVE_SKILL_IDS, SKILL_IDS } from "@/lib/unseen/skills";

const chat = vi.fn();
vi.mock("@/lib/openrouter.server", () => ({ chatCompletion: (p: unknown) => chat(p) }));

async function marker() {
  return import("@/lib/unseen/marker.server");
}

const testRubric: Rubric = {
  promptVersion: "test-rubric-1",
  directiveVerbs: { compare: "Show how things are similar or different." },
  systemPrompt: "SYSTEM",
  userTemplate: "Q({marks}): {question}\nVerb {directive}: {directiveDefinition}\n{texts}\nAnswer ({wordCount} words): {answer}",
};

const input: UnseenMarkerInput = {
  maxMarks: 6,
  questionHeading: "",
  question: "Compare how the texts explore memory.",
  verb: "compare",
  textForm: "",
  visual: false,
  text: "",
  texts: [
    { heading: "Text 4 – Poem", textForm: "poem", visual: false, text: "Harbour\n\nThe tide walks out and takes the light." },
    { heading: "Text 5 – Image", textForm: "visual", visual: true, text: "A grey photograph of an empty chair by a window." },
  ],
  criteria: "6 – Skilful.\n5 – Effective.\n4 – Sound.\n3 – Some.\n2 – Limited.\n1 – Little.",
  notes: "None provided by the school.",
  suggestedWords: 216,
  modelAnswer: "Both texts present memory as an absence that shapes the present, the poem through a withdrawing tide and the image through an empty chair that still holds a place.",
  stimulus: "Harbour\n\nThe tide walks out and takes the light.",
  answer: "The poem shows memory as a tide whereas the image shows it as an empty chair. ".repeat(8),
};

const verdicts = (ids: readonly string[], missed: string[] = []) =>
  Object.fromEntries(ids.map((id) => [id, { met: !missed.includes(id), reason: `${id} reason` }]));

const reply = (ids: readonly string[], over: Record<string, unknown> = {}, missed: string[] = []) =>
  JSON.stringify({
    mark: 4,
    skills: verdicts(ids, missed),
    feedback: "You compared the two texts clearly.",
    biggestGap: "Give the image the same depth as the poem.",
    ...over,
  });

beforeEach(() => {
  chat.mockReset();
  process.env.OPENROUTER_API_KEY = "test-key";
});
afterEach(() => {
  delete process.env.OPENROUTER_API_KEY;
});

describe("the prompt for several texts (T006)", () => {
  it("fills {texts} with a numbered block per text, in tab order, flagging a visual's description", async () => {
    const { buildUnseenMessages } = await marker();
    const [sys, user] = buildUnseenMessages(input, testRubric);
    expect(sys.content).toBe("SYSTEM");
    const c = user.content as string;
    expect(c).toContain("TEXT 1 — Text 4 – Poem (poem)\nHarbour");
    expect(c).toContain("TEXT 2 — Text 5 – Image (visual) — VISUAL TEXT: you cannot see the image");
    expect(c.indexOf("TEXT 1")).toBeLessThan(c.indexOf("TEXT 2"));
    expect(c).toContain("Verb compare: Show how things are similar or different.");
    expect(c).toContain("Q(6): Compare how the texts explore memory.");
  });

  it("sends only the texts it is given: an unpicked text's words are not in the request", async () => {
    const { buildUnseenMessages } = await marker();
    const onlyFirst = { ...input, texts: [input.texts![0]] };
    const c = buildUnseenMessages(onlyFirst, testRubric)[1].content as string;
    expect(c).toContain("Harbour");
    expect(c).not.toContain("empty chair by a window");
  });

  it("leaves the single-text prompt exactly as before when no texts are given", async () => {
    const { buildUnseenMessages, rubric } = await marker();
    const single: UnseenMarkerInput = { ...input, texts: undefined, questionHeading: "Text 1 – Poem", textForm: "poem", text: "Harbour", verb: "analyse" };
    const c = buildUnseenMessages(single)[1].content as string;
    expect(c).toContain("Text 1 – Poem");
    expect(c).not.toContain("TEXT 1 —");
    expect(buildUnseenMessages(single)[0].content).toBe(rubric.systemPrompt);
  });

  it("marks with the rubric it is given and reports that rubric's prompt version", async () => {
    const { markWithModel } = await marker();
    chat.mockResolvedValueOnce({ ok: true, content: reply(COMPARATIVE_SKILL_IDS), finishReason: "stop" });
    const out = await markWithModel(input, { rubric: testRubric, skillIds: COMPARATIVE_SKILL_IDS });
    expect(out?.promptVersion).toBe("test-rubric-1");
    expect(out?.reply.mark).toBe(4);
    expect(chat.mock.calls[0][0].messages[0].content).toBe("SYSTEM");
  });
});

describe("parsing nine verdicts (T007)", () => {
  it("keeps all nine verdicts with their reasons when the nine are asked for", async () => {
    const { parseUnseenReply } = await marker();
    const parsed = parseUnseenReply(reply(COMPARATIVE_SKILL_IDS, {}, ["compares-texts"]), 6, COMPARATIVE_SKILL_IDS);
    expect(Object.keys(parsed!.skills)).toEqual([...COMPARATIVE_SKILL_IDS]);
    expect(parsed!.skills["compares-texts"]).toEqual({ met: false, reason: "compares-texts reason" });
    expect(parsed!.skills["treats-both-in-depth"]?.met).toBe(true);
  });

  it("treats a missing comparison verdict as a malformed reply", async () => {
    const { parseUnseenReply } = await marker();
    const seven = reply(SKILL_IDS);
    expect(parseUnseenReply(seven, 6, COMPARATIVE_SKILL_IDS)).toBeNull();
    const noDepth = JSON.stringify({ ...JSON.parse(reply(COMPARATIVE_SKILL_IDS)), skills: verdicts([...SKILL_IDS, "compares-texts"]) });
    expect(parseUnseenReply(noDepth, 6, COMPARATIVE_SKILL_IDS)).toBeNull();
  });

  it("is unchanged for spec 008: the default is the seven, and extra verdicts are ignored", async () => {
    const { parseUnseenReply } = await marker();
    const parsed = parseUnseenReply(reply(SKILL_IDS), 6);
    expect(Object.keys(parsed!.skills)).toEqual([...SKILL_IDS]);
    expect(Object.keys(parseUnseenReply(reply(COMPARATIVE_SKILL_IDS), 6)!.skills)).toEqual([...SKILL_IDS]);
  });

  it("repairs a missing biggestGap from the first missed skill's reason, including a comparison skill", async () => {
    const { parseUnseenReply } = await marker();
    const raw = reply(COMPARATIVE_SKILL_IDS, { biggestGap: "" }, ["compares-texts"]);
    const parsed = parseUnseenReply(raw, 6, COMPARATIVE_SKILL_IDS);
    expect(parsed?.biggestGap).toBe("compares-texts reason");
    expect(parsed?.filled).toEqual(["biggestGap"]);
  });

  it("retries once when the first reply lacks a comparison verdict, then returns the good reply", async () => {
    const { markWithModel } = await marker();
    chat
      .mockResolvedValueOnce({ ok: true, content: reply(SKILL_IDS), finishReason: "stop" })
      .mockResolvedValueOnce({ ok: true, content: reply(COMPARATIVE_SKILL_IDS), finishReason: "stop" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const out = await markWithModel(input, { rubric: testRubric, skillIds: COMPARATIVE_SKILL_IDS });
    expect(chat).toHaveBeenCalledTimes(2);
    expect(Object.keys(out!.reply.skills)).toHaveLength(9);
  });

  it("the echo guard reads the reasons of all nine skills", async () => {
    const { containsModelEcho, parseUnseenReply } = await marker();
    const model = input.modelAnswer;
    const echo = model.slice(10, 90);
    const raw = JSON.parse(reply(COMPARATIVE_SKILL_IDS));
    raw.skills["treats-both-in-depth"].reason = echo;
    const parsed = parseUnseenReply(JSON.stringify(raw), 6, COMPARATIVE_SKILL_IDS)!;
    expect(containsModelEcho(parsed, model, input.stimulus)).toBe(true);
  });
});
