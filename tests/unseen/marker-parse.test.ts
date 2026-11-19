// The unseen marker's reply parsing, failure kinds, echo guard and time budget (spec 008 FR-012 to
// FR-015, research R4 and R5). chatCompletion is stubbed; no network.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UnseenMarkerInput } from "@/lib/unseen/marker.server";
import { SKILL_IDS } from "@/lib/unseen/skills";

const chat = vi.fn();
vi.mock("@/lib/openrouter.server", () => ({ chatCompletion: (p: unknown) => chat(p) }));

async function marker() {
  return import("@/lib/unseen/marker.server");
}

const input: UnseenMarkerInput = {
  maxMarks: 4,
  questionHeading: "Text 1 – Poem",
  question: "Analyse how the poet explores memory.",
  verb: "analyse",
  textForm: "poem",
  visual: false,
  text: "Harbour\n\nThe tide walks out and takes the light.",
  criteria: "4 – Skilful analysis.\n3 – Effective analysis.\n2 – Some analysis.\n1 – Limited.",
  notes: "None provided by the school.",
  suggestedWords: 288,
  modelAnswer:
    "The poet presents memory as a tide that withdraws and returns, a metaphor that makes remembering feel involuntary and physical rather than chosen.",
  stimulus: "Harbour\n\nThe tide walks out and takes the light.",
  answer: "Memory is shown as a tide in the poem. ".repeat(10),
};

const skills = (over: Record<string, unknown> = {}) =>
  Object.fromEntries(SKILL_IDS.map((id) => [id, { met: true, reason: `${id} ok` }])) as Record<string, unknown> & typeof over;

const good = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    mark: 3,
    skills: { ...skills(), "technique-effect": { met: false, reason: "No effect for the metaphor." } },
    feedback: "You analysed the tide imagery with a clear reading.",
    biggestGap: "Explain what the metaphor does to the reader.",
    descriptionAdequate: null,
    ...extra,
  });

beforeEach(() => {
  vi.stubEnv("OPENROUTER_API_KEY", "k");
  vi.stubEnv("ENGLISH_ADV_GRADING_MODEL", "");
  chat.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("parseUnseenReply", () => {
  it("parses a complete reply with seven verdicts", async () => {
    const { parseUnseenReply } = await marker();
    const r = parseUnseenReply(good(), 4)!;
    expect(r.mark).toBe(3);
    expect(Object.keys(r.skills)).toEqual([...SKILL_IDS]);
    expect(r.skills["technique-effect"]).toEqual({ met: false, reason: "No effect for the metaphor." });
    expect(r.feedback).toContain("tide imagery");
    expect(r.biggestGap).toContain("metaphor");
    expect(r.descriptionAdequate).toBeNull();
  });

  it("finds the JSON inside prose or a code fence", async () => {
    const { parseUnseenReply } = await marker();
    expect(parseUnseenReply("Here you go:\n```json\n" + good() + "\n```", 4)?.mark).toBe(3);
  });

  it.each([
    ["not JSON", "I think the answer is good."],
    ["a mark that is not an integer", good({ mark: 2.5 })],
    ["a mark above the question's value", good({ mark: 5 })],
    ["a negative mark", good({ mark: -1 })],
    ["a mark that is a string", good({ mark: "3" })],
    ["no feedback", good({ feedback: "  " })],
    ["no biggest gap", JSON.stringify({ ...JSON.parse(good()), biggestGap: undefined })],
    ["a missing skill verdict", JSON.stringify({ ...JSON.parse(good()), skills: { ...skills(), succinct: undefined } })],
    ["a verdict that is not a boolean", JSON.stringify({ ...JSON.parse(good()), skills: { ...skills(), succinct: { met: "maybe" } } })],
  ])("fails on %s", async (_label, content) => {
    const { parseUnseenReply } = await marker();
    expect(parseUnseenReply(content, 4)).toBeNull();
  });

  it("accepts true/false strings and stores a missing reason as an empty string", async () => {
    const { parseUnseenReply } = await marker();
    const s = skills();
    s["apt-evidence"] = { met: "false" };
    const r = parseUnseenReply(good({ skills: s }), 4)!;
    expect(r.skills["apt-evidence"]).toEqual({ met: false, reason: "" });
  });

  it("caps long strings", async () => {
    const { parseUnseenReply } = await marker();
    const r = parseUnseenReply(good({ feedback: "x".repeat(900), biggestGap: "y".repeat(500) }), 4)!;
    expect(r.feedback).toHaveLength(600);
    expect(r.biggestGap).toHaveLength(300);
  });

  it("reads descriptionAdequate for a visual text", async () => {
    const { parseUnseenReply } = await marker();
    expect(parseUnseenReply(good({ descriptionAdequate: false }), 4)?.descriptionAdequate).toBe(false);
    expect(parseUnseenReply(good({ descriptionAdequate: true }), 4)?.descriptionAdequate).toBe(true);
  });
});

describe("containsModelEcho", () => {
  it("flags a 60-character run of the model answer outside the stimulus, and allows quotation of the text", async () => {
    const { containsModelEcho, parseUnseenReply } = await marker();
    const echoing = parseUnseenReply(
      good({ feedback: "As the model says, the poet presents memory as a tide that withdraws and returns, so well." }),
      4,
    )!;
    expect(containsModelEcho(echoing, input.modelAnswer, input.stimulus)).toBe(true);
    const quoting = parseUnseenReply(good({ feedback: "You quoted 'The tide walks out and takes the light' well." }), 4)!;
    expect(containsModelEcho(quoting, input.modelAnswer, input.stimulus)).toBe(false);
    expect(containsModelEcho(parseUnseenReply(good(), 4)!, input.modelAnswer, input.stimulus)).toBe(false);
  });

  it("allows a long run that is also in the stimulus", async () => {
    const { containsModelEcho, parseUnseenReply } = await marker();
    const text = "The tide walks out and takes the light and leaves the harbour empty for a long while";
    const model = `The poet writes: ${text}, and this builds the sense of loss.`;
    const reply = parseUnseenReply(good({ feedback: `You noted that ${text} is striking.` }), 4)!;
    expect(containsModelEcho(reply, model, text)).toBe(false);
  });
});

describe("buildUnseenMessages", () => {
  it("fills every placeholder, names the visual note only for a visual text, and uses the model answer as the example", async () => {
    const { buildUnseenMessages } = await marker();
    const [system, user] = buildUnseenMessages(input);
    expect(system.role).toBe("system");
    expect(String(user.content)).not.toMatch(/\{[a-zA-Z]+\}/);
    expect(String(user.content)).toContain(input.modelAnswer);
    expect(String(user.content)).toContain("DIRECTIVE VERB: analyse = Identify components");
    expect(String(user.content)).toContain("This answer: 90 words");
    expect(String(user.content)).not.toContain("VISUAL TEXT");
    expect(String(buildUnseenMessages({ ...input, visual: true })[1].content)).toContain("VISUAL TEXT");
  });

  it("does not re-expand braces in the student's answer", async () => {
    const { buildUnseenMessages } = await marker();
    const user = String(buildUnseenMessages({ ...input, answer: "My {criteria} and {answer} words" })[1].content);
    expect(user).toContain("My {criteria} and {answer} words");
  });
});

describe("markWithModel", () => {
  it("uses the unit's model, never GRADING_MODEL, with 4000 tokens and JSON mode", async () => {
    vi.stubEnv("GRADING_MODEL", "vendor/other");
    chat.mockResolvedValue({ ok: true, content: good(), finishReason: "stop" });
    const { markWithModel, PROMPT_VERSION } = await marker();
    const out = await markWithModel(input);
    expect(out).toMatchObject({ model: "deepseek/deepseek-v4.1-flash", promptVersion: PROMPT_VERSION });
    expect(chat).toHaveBeenCalledTimes(1);
    expect(chat.mock.calls[0][0]).toMatchObject({ model: "deepseek/deepseek-v4.1-flash", maxTokens: 4000, temperature: 0, json: true });
  });

  it("honours ENGLISH_ADV_GRADING_MODEL", async () => {
    vi.stubEnv("ENGLISH_ADV_GRADING_MODEL", "vendor/english");
    chat.mockResolvedValue({ ok: true, content: good() });
    const { markWithModel } = await marker();
    expect((await markWithModel(input))?.model).toBe("vendor/english");
  });

  it("is unavailable without a key and makes no call", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const { markWithModel } = await marker();
    expect(await markWithModel(input)).toBeNull();
    expect(chat).not.toHaveBeenCalled();
  });

  it.each([
    ["an HTTP error", { ok: false, reason: "http", status: 500 }],
    ["an empty reply", { ok: false, reason: "empty" }],
    ["a cut-off reply", { ok: true, content: good(), finishReason: "length" }],
    ["an unparseable reply", { ok: true, content: "sorry, no JSON" }],
    ["a reply missing a field", { ok: true, content: good({ biggestGap: "" }) }],
  ])("retries once after %s and succeeds", async (_label, first) => {
    chat.mockResolvedValueOnce(first).mockResolvedValueOnce({ ok: true, content: good() });
    const { markWithModel } = await marker();
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await markWithModel(input))?.reply.mark).toBe(3);
    expect(chat).toHaveBeenCalledTimes(2);
  });

  it("is unavailable after two failures, and never retries a third time", async () => {
    chat.mockResolvedValue({ ok: true, content: "nope" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { markWithModel } = await marker();
    expect(await markWithModel(input)).toBeNull();
    expect(chat).toHaveBeenCalledTimes(2);
  });

  it("treats a reply that echoes the model answer as a failure", async () => {
    chat.mockResolvedValue({ ok: true, content: good({ feedback: `Model: ${input.modelAnswer}` }) });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { markWithModel } = await marker();
    expect(await markWithModel(input)).toBeNull();
  });

  it("does not retry when less than 12 s of the 55 s budget remain", async () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValueOnce(0); // start
    now.mockReturnValue(50_000); // after the first call: 5 s left
    chat.mockResolvedValue({ ok: false, reason: "network" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { markWithModel } = await marker();
    expect(await markWithModel(input)).toBeNull();
    expect(chat).toHaveBeenCalledTimes(1);
  });

  it("retries with what is left of the budget when the first call fails fast", async () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValueOnce(0);
    now.mockReturnValue(10_000); // 45 s left
    chat.mockResolvedValueOnce({ ok: false, reason: "http", status: 502 }).mockResolvedValueOnce({ ok: true, content: good() });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { markWithModel } = await marker();
    expect((await markWithModel(input))?.reply.mark).toBe(3);
    expect(chat.mock.calls[1][0].timeoutMs).toBe(40_000);
  });

  it("logs nothing about the answer, the reply or the model answer", async () => {
    const spies = [vi.spyOn(console, "error").mockImplementation(() => {}), vi.spyOn(console, "warn").mockImplementation(() => {}), vi.spyOn(console, "info").mockImplementation(() => {})];
    chat.mockResolvedValue({ ok: true, content: `{"mark":9 secret-answer ${input.modelAnswer}` });
    const { markWithModel } = await marker();
    await markWithModel(input);
    const logged = spies.flatMap((s) => s.mock.calls.flat()).join(" ");
    expect(logged).not.toContain("secret-answer");
    expect(logged).not.toContain(input.modelAnswer.slice(0, 30));
    expect(logged).not.toContain(input.answer.slice(0, 30));
  });
});

describe("renderTextForMarker and formForPrompt", () => {
  it("renders a poem's stanzas, a prose text's paragraphs and the footnotes", async () => {
    const { renderTextForMarker, formForPrompt } = await marker();
    const poem = {
      id: "t", form: "poem", heading: "Text 1 – Poem", title: "Harbour", author: "A. Poet", sourceLine: "s",
      body: { kind: "poem", stanzas: [["one", "two"], ["three"]] }, footnotes: [{ mark: "*", text: "tide: the sea" }], hscChecked: "2026-11-19",
    } as const;
    expect(renderTextForMarker(poem as never)).toBe("Harbour\nA. Poet\n\none\ntwo\n\nthree\n\n* tide: the sea");
    const prose = { ...poem, form: "prose-fiction", body: { kind: "prose", paragraphs: ["P1.", "P2."] }, footnotes: undefined };
    expect(renderTextForMarker(prose as never)).toBe("Harbour\nA. Poet\n\nP1.\n\nP2.");
    expect(formForPrompt("prose-fiction")).toBe("prose fiction");
    expect(formForPrompt("personal-essay")).toBe("personal essay");
    expect(formForPrompt("non-fiction")).toBe("non-fiction");
  });
});
