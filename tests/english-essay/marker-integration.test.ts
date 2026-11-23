// The English marker with a stubbed model (spec 011 FR-021, contracts/replies.md call settings): what it sends, what it never
// sends, the retry budget, and that a failed marker becomes null rather than a guessed mark. No network.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { englishMarkerContent } from "../helpers/english-essay";

vi.mock("server-only", () => ({}));

const chat = vi.fn();
vi.mock("@/lib/openrouter.server", () => ({
  chatCompletion: (...args: unknown[]) => chat(...args),
  llmGradingConfigured: () => true,
}));

import { BUDGET_MS, MAX_TOKENS, markEnglishEssayWithModel, MIN_RETRY_MS } from "@/lib/english-essay/marker.server";

const input = { question: "TEST QUESTION about the lantern?", markingNotes: "TEST MARKING NOTES for this question only: a strong answer links the lantern keeper to the harbour bell", essay: "the essay text ".repeat(60) };
const ok = (content = englishMarkerContent()) => ({ ok: true as const, content, finishReason: "stop" });

beforeEach(() => {
  chat.mockReset();
  process.env.OPENROUTER_API_KEY = "k";
  delete process.env.ENGLISH_ESSAY_GRADING_MODEL;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete process.env.ENGLISH_ESSAY_GRADING_MODEL;
  delete process.env.ESSAY_GRADING_MODEL;
  delete process.env.ENGLISH_ESSAY_REVIEW_MODEL;
  delete process.env.GRADING_MODEL;
});

describe("what is sent", () => {
  it("sends the public question, the question's notes, the Away notes and the concepts; never a model essay", async () => {
    chat.mockResolvedValue(ok());
    const out = await markEnglishEssayWithModel(input);
    expect(out).not.toBeNull();
    const call = chat.mock.calls[0]![0] as { messages: Array<{ role: string; content: string }> };
    const sent = call.messages.map((m) => m.content).join("\n");
    expect(sent).toContain("TEST QUESTION about the lantern?");
    expect(sent).toContain("TEST MARKING NOTES for this question only");
    expect(sent).toContain("Away, Michael Gow (play, first performed 1986");
    expect(sent).toContain("- skill-thesis:");
    expect(sent).toContain("- away-symbols:");
    expect(sent).not.toMatch(/model essay/i);
  });

  it("uses temperature 0, JSON mode, 8000 tokens and the 60 second first-call timeout", async () => {
    chat.mockResolvedValue(ok());
    await markEnglishEssayWithModel(input);
    expect(chat.mock.calls[0]![0]).toMatchObject({ temperature: 0, json: true, maxTokens: MAX_TOKENS, timeoutMs: 60_000, model: "openai/gpt-6.2-sol" });
    expect(MAX_TOKENS).toBe(8000);
    expect(BUDGET_MS).toBe(115_000);
    expect(MIN_RETRY_MS).toBe(12_000);
  });

  it("reads only ENGLISH_ESSAY_GRADING_MODEL: never the review model, the Economics model or the general model", async () => {
    process.env.ESSAY_GRADING_MODEL = "vendor/econ";
    process.env.ENGLISH_ESSAY_REVIEW_MODEL = "vendor/review";
    process.env.GRADING_MODEL = "vendor/general";
    chat.mockResolvedValue(ok());
    await markEnglishEssayWithModel(input);
    expect(chat.mock.calls[0]![0].model).toBe("openai/gpt-6.2-sol");
    process.env.ENGLISH_ESSAY_GRADING_MODEL = "vendor/english";
    chat.mockClear();
    await markEnglishEssayWithModel(input);
    expect(chat.mock.calls[0]![0].model).toBe("vendor/english");
  });
});

describe("failure and retry", () => {
  const bad = [
    ["a failed call", { ok: false, reason: "http", status: 500 }],
    ["an empty reply", { ok: true, content: "", finishReason: "stop" }],
    ["a cut-off reply", { ok: true, content: englishMarkerContent(), finishReason: "length" }],
    ["a malformed reply", { ok: true, content: "I cannot do JSON", finishReason: "stop" }],
    ["an incomplete reply", { ok: true, content: JSON.stringify({ band: 2 }), finishReason: "stop" }],
    ["a reply that echoes the notes", { ok: true, content: englishMarkerContent({ extra: { bandReason: `Well done. ${input.markingNotes} indeed.` } }), finishReason: "stop" }],
  ] as const;

  it.each(bad)("%s is retried once and then the marker is unavailable (null, never a mark)", async (_name, reply) => {
    chat.mockResolvedValue(reply);
    expect(await markEnglishEssayWithModel(input)).toBeNull();
    expect(chat).toHaveBeenCalledTimes(2);
  });

  it.each(bad)("%s then a valid reply succeeds on the retry", async (_name, reply) => {
    chat.mockResolvedValueOnce(reply).mockResolvedValueOnce(ok());
    const out = await markEnglishEssayWithModel(input);
    expect(out).not.toBeNull();
    expect(chat).toHaveBeenCalledTimes(2);
  });

  it("does not retry when under 12 seconds of the 115 second budget remain", async () => {
    vi.useFakeTimers();
    chat.mockImplementationOnce(async () => {
      vi.advanceTimersByTime(BUDGET_MS - 5_000);
      return { ok: false, reason: "timeout" };
    });
    expect(await markEnglishEssayWithModel(input)).toBeNull();
    expect(chat).toHaveBeenCalledTimes(1);
  });

  it("is unavailable with no key, without calling the model", async () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(await markEnglishEssayWithModel(input)).toBeNull();
    expect(chat).not.toHaveBeenCalled();
  });

  it("returns the prompt version and the model with the parsed reply", async () => {
    chat.mockResolvedValue(ok());
    const out = await markEnglishEssayWithModel(input);
    expect(out).toMatchObject({ promptVersion: "eng-essay-pilot-5", model: "openai/gpt-6.2-sol" });
    expect(out!.reply).toMatchObject({ band: 2, mark: 14, questionFocus: "fully" });
  });
});
