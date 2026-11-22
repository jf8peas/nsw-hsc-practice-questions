// The optional plan review (spec 010 FR-012 to FR-017, contracts/api.md D): seven lines, fixes as questions, no mark,
// the plan locked only when the review succeeds, a failure or the daily limit offering "Start writing" without a
// review (nothing locked, the slot refunded), one review per attempt, and the review never in the result.
// PGlite and a stubbed model; no network.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dailyAiUsage, essayPhases } from "@/lib/db/schema";

import {
  E1,
  E5,
  NOTES,
  SCHOOL,
  essayOfWords,
  goodScaffold,
  gradeEssay,
  restoreEssayEnv,
  reviewEssayContent,
  reviewPlanRequest,
  saveScaffold,
  setupEssayEnv,
  startEssay,
  type EssayEnv,
} from "../helpers/essay";
import { signedInStudent } from "../helpers/routes";

let env: EssayEnv;
afterEach(async () => {
  restoreEssayEnv();
  vi.restoreAllMocks();
  await env?.close();
});

const quiet = () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
};
const used = async (userId: string) => (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce((s, r) => s + r.count, 0);
const phase = async (attemptId: string) => (await env.db.select().from(essayPhases).where(eq(essayPhases.attemptId, attemptId)))[0];
const reply = (content: string) => ({ ok: true, finishReason: "stop", content });

describe("a plan review", () => {
  it("returns seven lines, stores the review, locks the plan and takes one slot; no mark", async () => {
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    const a = await startEssay(E5);
    env.chat.mockResolvedValueOnce(reply(reviewEssayContent({ fixes: ["data", "models"] })));
    const res = await reviewPlanRequest(a, E5, goodScaffold());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ stage: "write", locked: true });
    expect(res.body.review.checks).toHaveLength(7);
    expect(res.body.review.checks.filter((c: { status: string }) => c.status === "fix").map((c: { id: string }) => c.id)).toEqual(["data", "models"]);
    for (const c of res.body.review.checks.filter((c: { status: string }) => c.status === "fix")) expect(c.line).toContain("?");
    expect(JSON.stringify(res.body)).not.toMatch(/"mark"|"band":|finalMark/);

    const row = await phase(a.attemptId);
    expect(row).toMatchObject({ status: "writing", reviewPromptVersion: "essay-review-1", finalMark: null });
    expect(row.scaffoldLockedAt).not.toBeNull();
    expect(row.review?.checks).toHaveLength(7);
    expect(await used(user.id)).toBe(1);
  });

  it("sends the plan, question and economy rule to the reviewer and never the marking key", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    env.chat.mockResolvedValueOnce(reply(reviewEssayContent()));
    await reviewPlanRequest(a, E1, goodScaffold());
    const sent = JSON.stringify(env.chat.mock.calls[0]![0]);
    expect(sent).toContain("Globalisation has strongly lifted China");
    expect(sent).toContain("With reference to an economy other than Australia");
    expect(sent).not.toContain(NOTES.slice(0, 30));
    expect(sent).not.toContain(SCHOOL.slice(0, 30));
    expect(sent).not.toContain("MODELESSAYTOKEN");
  });

  it("brings the review back on resume, and the essay page shows it, but the result never records it", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    env.chat.mockResolvedValueOnce(reply(reviewEssayContent()));
    await reviewPlanRequest(a, E1, goodScaffold());
    const back = await startEssay();
    expect((back.essayState as { stage: string; review: { checks: unknown[] } }).stage).toBe("write");
    expect((back.essayState as { review: { checks: unknown[] } }).review.checks).toHaveLength(7);

    const done = await gradeEssay(a, E1, essayOfWords(700));
    const s = JSON.stringify(done.body);
    expect(s).not.toContain("REVIEW-FIX");
    expect(s).not.toContain("review");
    expect(s).not.toContain("essay-review-1");
  });

  it("does not change the essay's mark: the marker is sent the same prompt with or without a review", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    env.chat.mockResolvedValueOnce(reply(reviewEssayContent()));
    await reviewPlanRequest(a, E1, goodScaffold());
    env.chat.mockClear();
    await gradeEssay(a, E1, essayOfWords(700));
    const sent = JSON.stringify(env.chat.mock.calls[0]![0]);
    expect(sent).not.toContain("REVIEW-");
    expect(sent).not.toContain("Globalisation has strongly lifted China"); // the plan never reaches the marker
  });

  it("retries one malformed reply and uses the second", async () => {
    quiet();
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    const a = await startEssay(E1);
    env.chat.mockResolvedValueOnce(reply("not json"));
    env.chat.mockResolvedValueOnce(reply(reviewEssayContent()));
    const res = await reviewPlanRequest(a, E1, goodScaffold());
    expect(res.body.review.checks).toHaveLength(7);
    expect(env.chat).toHaveBeenCalledTimes(2);
    expect(await used(user.id)).toBe(1);
  });

  it("treats a fix that is not a question as malformed", async () => {
    quiet();
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    const bad = JSON.parse(reviewEssayContent());
    bad.checks[3].line = "Add a year to your data.";
    env.chat.mockResolvedValue(reply(JSON.stringify(bad)));
    expect((await reviewPlanRequest(a, E1, goodScaffold())).body.notReviewed).toMatchObject({ reason: "reviewer_unavailable" });
  });
});

describe("when the review cannot happen", () => {
  it("tells the student and offers Start writing: nothing locked, slot refunded, plan kept", async () => {
    quiet();
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    const a = await startEssay(E1);
    await saveScaffold(a, E1, "save", goodScaffold());
    env.chat.mockResolvedValue({ ok: false, reason: "network" });
    const res = await reviewPlanRequest(a, E1, goodScaffold());
    expect(res).toMatchObject({ status: 200, body: { notReviewed: { reason: "reviewer_unavailable" } } });
    expect(res.body.review).toBeUndefined();
    expect(await used(user.id)).toBe(0);
    const row = await phase(a.attemptId);
    expect(row).toMatchObject({ status: "planning", scaffoldLockedAt: null, review: null });
    // and the student can still start writing, or edit and try again
    expect((await saveScaffold(a, E1, "save", goodScaffold({ intro: { judgement: "edited" } }))).status).toBe(200);
    expect((await saveScaffold(a, E1, "start", goodScaffold())).body).toMatchObject({ started: true });
  });

  it("is off with no key, without a model call", async () => {
    quiet();
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    delete process.env.OPENROUTER_API_KEY;
    expect((await reviewPlanRequest(a, E1, goodScaffold())).body.notReviewed).toMatchObject({ reason: "reviewer_unavailable" });
    expect(env.chat).not.toHaveBeenCalled();
  });

  it("at the daily limit says so, takes no slot, makes no call and locks nothing", async () => {
    env = await setupEssayEnv();
    process.env.LLM_DAILY_CAP = "1";
    const user = await signedInStudent(env);
    const { reserveAiSlot } = await import("@/lib/usage.server");
    expect(await reserveAiSlot(env.db, user.id, 1)).not.toBeNull(); // the only slot of the day is gone
    const a = await startEssay(E1);
    const res = await reviewPlanRequest(a, E1, goodScaffold());
    expect(res.body.notReviewed).toMatchObject({ reason: "daily_limit" });
    expect(res.body.notReviewed.resetsAt).toMatch(/T00:00:00/);
    expect(env.chat).not.toHaveBeenCalled();
    expect(await used(user.id)).toBe(1);
    expect(await phase(a.attemptId)).toMatchObject({ status: "planning", scaffoldLockedAt: null });
    expect((await saveScaffold(a, E1, "start", goodScaffold())).body).toMatchObject({ started: true }); // Start writing still works
  });

  it("refuses a second review, a locked plan, an invalid plan and a bad token", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    expect((await reviewPlanRequest(a, E1, { intro: {}, body: [{}, {}, {}], conclusion: {} })).body).toMatchObject({ error: "scaffold_invalid" });
    expect((await reviewPlanRequest({ ...a, attemptToken: "garbage" }, E1, goodScaffold())).status).toBe(401);
    env.chat.mockResolvedValueOnce(reply(reviewEssayContent()));
    expect((await reviewPlanRequest(a, E1, goodScaffold())).status).toBe(200);
    expect(await reviewPlanRequest(a, E1, goodScaffold())).toMatchObject({ status: 409, body: { error: "scaffold_locked" } });
  });

  it("is unavailable, never guessed, when the database cannot be read", async () => {
    quiet();
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    env.databaseDown();
    expect((await reviewPlanRequest(a, E1, goodScaffold())).status).toBe(503);
  });
});
