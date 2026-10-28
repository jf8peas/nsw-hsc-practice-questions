// OPENROUTER_BASE_URL points development at a local stand-in and is ignored in production
// (constitution Principle VII; specs/002-learn-from-mistakes/research.md R14).

import { afterEach, describe, expect, it, vi } from "vitest";

const REAL = "https://openrouter.ai/api/v1/chat/completions";
const LOCAL = "http://localhost:4010/v1/chat/completions";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function call(nodeEnv: string, baseUrl: string | undefined) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  vi.stubEnv("OPENROUTER_BASE_URL", baseUrl ?? "");
  const fetchSpy = vi.fn(async (_url: unknown) => new Response(JSON.stringify({ choices: [{ message: { content: "hi" } }] })));
  vi.stubGlobal("fetch", fetchSpy);
  const { chatCompletion } = await import("@/lib/openrouter.server");
  const result = await chatCompletion({ model: "m", messages: [{ role: "user", content: "x" }], temperature: 0, maxTokens: 5, timeoutMs: 1000 });
  return { result, url: String(fetchSpy.mock.calls[0]?.[0]) };
}

describe("chatCompletion's endpoint", () => {
  it.each(["development", "test"])("uses OPENROUTER_BASE_URL when NODE_ENV is %s", async (env) => {
    const { url, result } = await call(env, LOCAL);
    expect(url).toBe(LOCAL);
    expect(result).toEqual({ ok: true, content: "hi" });
  });

  it("ignores OPENROUTER_BASE_URL in production, so it can never redirect real traffic", async () => {
    expect((await call("production", LOCAL)).url).toBe(REAL);
  });

  it("uses OpenRouter when no override is set", async () => {
    expect((await call("development", undefined)).url).toBe(REAL);
    expect((await call("production", undefined)).url).toBe(REAL);
  });
});

describe("chatCompletion never throws", () => {
  it("without a key it makes no network call and reports unconfigured", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { chatCompletion } = await import("@/lib/openrouter.server");
    const r = await chatCompletion({ model: "m", messages: [{ role: "user", content: "x" }], temperature: 0, maxTokens: 5, timeoutMs: 1000 });
    expect(r).toEqual({ ok: false, reason: "unconfigured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports a network error, a non-2xx reply and an empty reply as failures", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "k");
    const { chatCompletion } = await import("@/lib/openrouter.server");
    const p = { model: "m", messages: [{ role: "user" as const, content: "x" }], temperature: 0, maxTokens: 5, timeoutMs: 1000 };

    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    expect(await chatCompletion(p)).toMatchObject({ ok: false, reason: "network" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 429 })));
    expect(await chatCompletion(p)).toMatchObject({ ok: false, reason: "http", status: 429 });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: "  " } }] }))));
    expect(await chatCompletion(p)).toMatchObject({ ok: false, reason: "empty" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not json")));
    expect(await chatCompletion(p)).toMatchObject({ ok: false, reason: "empty" });
  });
});
