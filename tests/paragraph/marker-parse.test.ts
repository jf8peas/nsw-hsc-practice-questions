import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const chat = vi.fn();
vi.mock("@/lib/openrouter.server", async (orig) => ({
  ...(await orig<typeof import("@/lib/openrouter.server")>()),
  chatCompletion: (...a: unknown[]) => chat(...a),
}));

import { PROMPT_VERSION, markWithModel, parseMarkerReply, type MarkerInput } from "@/lib/paragraph/marker.server";

const good = {
  restated: "A rewrite that must never be kept",
  criteria: {
    a: { reason: "States a verdict of degree.", met: true },
    b: { reason: "Names only the strategy.", met: false },
    c: { reason: "Frames the counterpoint.", met: true },
  },
  conventions: { reason: "Formal.", preciseLanguage: true, noPadding: true },
  feedback: "Name the outcome as well.",
};

const input: MarkerInput = {
  part: "topic",
  question: "Evaluate the effectiveness of strategies.",
  verb: "evaluate",
  economy: "Testland",
  economyType: "emerging",
  strategy: "Opening to trade.",
  brief: { economy: "Testland", argument: "A", counterpoint: "B", chainSteps: ["x"], facts: ["f"], limitation: ["l"] },
  earlierModels: [],
  model: "Model topic.",
  markingNotes: "Notes.",
  answer: "My answer.",
};

describe("parseMarkerReply", () => {
  it("parses the round 5 shape and discards `restated`", () => {
    const r = parseMarkerReply(JSON.stringify(good));
    expect(r).not.toBeNull();
    expect(r!.a.met).toBe(true);
    expect(r!.b).toEqual({ met: false, reason: "Names only the strategy." });
    expect(r!.conventions).toEqual({ reason: "Formal.", preciseLanguage: true, noPadding: true });
    expect(r!.feedback).toBe("Name the outcome as well.");
    expect(JSON.stringify(r)).not.toContain("rewrite that must never");
  });
  it("takes the first {...} block out of surrounding prose", () => {
    expect(parseMarkerReply("Here you go:\n" + JSON.stringify(good) + "\nDone")).not.toBeNull();
  });
  it("accepts 'true'/'false' strings and a bare boolean verdict", () => {
    const r = parseMarkerReply(
      JSON.stringify({ ...good, criteria: { a: true, b: "false", c: { reason: "ok", met: "true" } } }),
    );
    expect(r!.a.met).toBe(true);
    expect(r!.b.met).toBe(false);
    expect(r!.c.met).toBe(true);
  });
  it("fails a reply with a missing or non-boolean verdict, never a silent dock", () => {
    expect(parseMarkerReply(JSON.stringify({ ...good, criteria: { ...good.criteria, b: { reason: "x" } } }))).toBeNull();
    expect(parseMarkerReply(JSON.stringify({ ...good, criteria: { ...good.criteria, c: { reason: "x", met: "maybe" } } }))).toBeNull();
    expect(parseMarkerReply(JSON.stringify({ ...good, conventions: { reason: "x", preciseLanguage: true } }))).toBeNull();
    expect(parseMarkerReply(JSON.stringify({ ...good, feedback: "" }))).toBeNull();
  });
  it("fails prose and broken JSON", () => {
    expect(parseMarkerReply("I think it is fine")).toBeNull();
    expect(parseMarkerReply("{not json}")).toBeNull();
  });
  it("trims and caps reasons (300) and feedback (400) instead of failing", () => {
    const long = "x".repeat(900);
    const r = parseMarkerReply(
      JSON.stringify({ ...good, criteria: { ...good.criteria, a: { reason: "  " + long, met: true } }, feedback: long }),
    );
    expect(r!.a.reason.length).toBe(300);
    expect(r!.feedback.length).toBe(400);
  });
});

describe("markWithModel (one retry, then unavailable)", () => {
  const prevKey = process.env.OPENROUTER_API_KEY;
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "k";
    chat.mockReset();
  });
  afterEach(() => {
    if (prevKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = prevKey;
  });

  it("returns the parsed verdicts, the model and the prompt version", async () => {
    chat.mockResolvedValueOnce({ ok: true, content: JSON.stringify(good) });
    const out = await markWithModel(input);
    expect(out?.raw.a.met).toBe(true);
    expect(out?.promptVersion).toBe(PROMPT_VERSION);
    expect(typeof out?.model).toBe("string");
    expect(chat).toHaveBeenCalledTimes(1);
    const params = chat.mock.calls[0][0];
    expect(params.temperature).toBe(0);
    expect(params.json).toBe(true);
    expect(params.maxTokens).toBe(1200);
    expect(params.timeoutMs).toBe(30_000);
  });
  it("retries once on an unparseable reply and then succeeds", async () => {
    chat.mockResolvedValueOnce({ ok: true, content: "prose" }).mockResolvedValueOnce({ ok: true, content: JSON.stringify(good) });
    expect(await markWithModel(input)).not.toBeNull();
    expect(chat).toHaveBeenCalledTimes(2);
  });
  it("is unavailable after two bad replies, or two failed calls", async () => {
    chat.mockResolvedValue({ ok: true, content: "prose" });
    expect(await markWithModel(input)).toBeNull();
    expect(chat).toHaveBeenCalledTimes(2);
    chat.mockReset();
    chat.mockResolvedValue({ ok: false, reason: "http", status: 500 });
    expect(await markWithModel(input)).toBeNull();
  });
  it("is unavailable with no key and makes no call", async () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(await markWithModel(input)).toBeNull();
    expect(chat).not.toHaveBeenCalled();
  });
});
