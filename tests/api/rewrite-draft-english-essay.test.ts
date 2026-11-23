// POST /api/rewrite/draft for the English essay (spec 011 contracts/api.md E): phase 1 only, 12,000 characters, saved
// only while writing, and the existing ownership, token and limiter behaviour.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { attempts, rewriteDrafts } from "@/lib/db/schema";

import {
  E1,
  goodEnglishScaffold,
  restoreEnglishEnv,
  saveEnglishDraft,
  saveEnglishScaffold,
  setupEnglishEnv,
  startEnglish,
  type EnglishEnv,
} from "../helpers/english-essay";
import { post, signedInStudent } from "../helpers/routes";

let env: EnglishEnv;
afterEach(async () => {
  restoreEnglishEnv();
  delete process.env.DRAFT_RATE_LIMIT;
  vi.restoreAllMocks();
  await env?.close();
});

const stored = async (attemptId: string) => (await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.attemptId, attemptId)))[0];

describe("the English essay draft", () => {
  it("is refused while the plan is editable and saved once writing, and comes back on resume", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    expect((await saveEnglishDraft(a, E1, "early")).body).toEqual({ saved: false });
    expect(await stored(a.attemptId)).toBeUndefined();
    await saveEnglishScaffold(a, E1, "start", goodEnglishScaffold());
    expect((await saveEnglishDraft(a, E1, "my essay so far")).body).toEqual({ saved: true });
    expect((await startEnglish()).englishEssayState).toMatchObject({ stage: "write", draft: "my essay so far" });
  });

  it("keeps up to 12,000 characters (a full 1,200-word essay) and cuts beyond", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    await saveEnglishScaffold(a, E1, "start", goodEnglishScaffold());
    // 1,200 words of 9 characters plus a space is 12,000 characters
    const essay = Array.from({ length: 1200 }, () => "eightchar").join(" ");
    expect(essay.length).toBeLessThanOrEqual(12000);
    await saveEnglishDraft(a, E1, essay);
    expect((await stored(a.attemptId))!.phase1Draft).toBe(essay);
    await saveEnglishDraft(a, E1, "x".repeat(13000));
    expect((await stored(a.attemptId))!.phase1Draft).toHaveLength(12000);
  });

  it("accepts phase 1 only: phase 2 is invalid_request", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    await saveEnglishScaffold(a, E1, "start", goodEnglishScaffold());
    const { POST } = await import("@/app/api/rewrite/draft/route");
    const res = await POST(post("/api/rewrite/draft", { attemptId: a.attemptId, attemptToken: a.attemptToken, questionId: E1, phase: 2, draft: "x" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_request" });
  });

  it("writes nothing once the attempt is complete", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    await saveEnglishScaffold(a, E1, "start", goodEnglishScaffold());
    await env.db.update(attempts).set({ completedAt: new Date() }).where(eq(attempts.id, a.attemptId));
    expect((await saveEnglishDraft(a, E1, "late")).body).toEqual({ saved: false });
    expect(await stored(a.attemptId)).toBeUndefined();
  });

  it("checks the token, the question and the limiter, and reports an unreadable database", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    await saveEnglishScaffold(a, E1, "start", goodEnglishScaffold());
    expect((await saveEnglishDraft({ ...a, attemptToken: "x.y" }, E1, "a")).status).toBe(401);
    expect((await saveEnglishDraft(a, `${E1}x`, "a")).status).toBe(404);
    process.env.DRAFT_RATE_LIMIT = "1";
    const first = await saveEnglishDraft(a, E1, "a");
    const second = await saveEnglishDraft(a, E1, "b");
    expect([first.status, second.status]).toContain(429);
    delete process.env.DRAFT_RATE_LIMIT;
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    env.databaseDown();
    expect((await saveEnglishDraft(a, E1, "c")).status).toBe(503);
    env.databaseUp();
  });
});
