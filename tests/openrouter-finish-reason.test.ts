// chatCompletion exposes the provider's finish_reason so a reply cut off at max_tokens can be told
// apart from a complete one (spec 008 FR-015, research R5).

import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function reply(choice: Record<string, unknown>) {
  vi.resetModules();
  vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ choices: [choice] }))));
  const { chatCompletion } = await import("@/lib/openrouter.server");
  return chatCompletion({ model: "m", messages: [{ role: "user", content: "x" }], temperature: 0, maxTokens: 5, timeoutMs: 1000 });
}

describe("chatCompletion finishReason", () => {
  it("reports a cut-off reply as length", async () => {
    const r = await reply({ message: { content: '{"mark":' }, finish_reason: "length" });
    expect(r).toEqual({ ok: true, content: '{"mark":', finishReason: "length" });
  });

  it("reports a complete reply as stop", async () => {
    const r = await reply({ message: { content: "{}" }, finish_reason: "stop" });
    expect(r).toEqual({ ok: true, content: "{}", finishReason: "stop" });
  });

  it("leaves finishReason out when the provider sends none", async () => {
    const r = await reply({ message: { content: "{}" } });
    expect(r).toEqual({ ok: true, content: "{}" });
  });
});
