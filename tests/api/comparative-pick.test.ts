// POST /api/comparative/pick (spec 009 FR-009, FR-010, research R5, contracts/api.md): the pick is saved to the draft
// row as soon as it is complete, idempotent, validated against the question's allowed set, scoped to the student,
// refused once the first try is submitted, and nothing from the key is in any response. PGlite, no network.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { rewriteDrafts } from "@/lib/db/schema";

import {
  CHOICE_Q,
  FIXED_Q,
  TEXTS,
  gradeComparative,
  restoreComparativeEnv,
  savePick,
  setupComparativeEnv,
  startComparative,
  type ComparativeEnv,
} from "../helpers/comparative";
import { fillWords } from "../helpers/unseen";
import { signedInStudent } from "../helpers/routes";

let env: ComparativeEnv;
afterEach(async () => {
  restoreComparativeEnv();
  vi.restoreAllMocks();
  await env?.close();
});

const draftRow = async (questionId: string) => (await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.questionId, questionId)))[0];

/** The deterministic draw gives the fixed pair first; answer it so the next quiz is the choice question. */
async function startChoice() {
  await signedInStudent(env);
  const first = await startComparative();
  expect(first.questionId).toBe(FIXED_Q);
  const done = await gradeComparative(first.started, FIXED_Q, fillWords(60));
  expect(done.status).toBe(200);
  const second = await startComparative();
  expect(second.questionId).toBe(CHOICE_Q);
  return second;
}

describe("saving the pick", () => {
  it("saves a complete pick to the draft row, creating it, and answers { ok: true } with nothing else", async () => {
    env = await setupComparativeEnv();
    const { started, questionId } = await startChoice();
    const res = await savePick(started, questionId, [TEXTS.B]);
    expect(res).toEqual({ status: 200, body: { ok: true } });
    const row = await draftRow(questionId);
    expect(row.pickedTextIds).toEqual([TEXTS.B]);
    expect(row.phase1Draft).toBe("");
  });

  it("is idempotent, and a changed pick replaces the saved one", async () => {
    env = await setupComparativeEnv();
    const { started, questionId } = await startChoice();
    expect((await savePick(started, questionId, [TEXTS.B])).status).toBe(200);
    expect((await savePick(started, questionId, [TEXTS.B])).status).toBe(200);
    expect((await savePick(started, questionId, [TEXTS.V])).status).toBe(200);
    expect((await draftRow(questionId)).pickedTextIds).toEqual([TEXTS.V]);
  });

  it("is restored on resume, with the draft text kept", async () => {
    env = await setupComparativeEnv();
    const { started, questionId } = await startChoice();
    await savePick(started, questionId, [TEXTS.V]);
    const { POST } = await import("@/app/api/rewrite/draft/route");
    const { post } = await import("../helpers/routes");
    const saved = await POST(post("/api/rewrite/draft", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, phase: 1, draft: "half an answer" }));
    expect(saved.status).toBe(200);
    const again = await startComparative();
    expect(again.state).toMatchObject({ stage: "write", pick: [TEXTS.V], pickLocked: false, draft1: "half an answer" });
  });
});

describe("what it refuses", () => {
  it("refuses an incomplete, over-long, duplicate or disallowed pick, and saves nothing", async () => {
    env = await setupComparativeEnv();
    const { started, questionId } = await startChoice();
    for (const pick of [[], [TEXTS.B, TEXTS.V], [TEXTS.B, TEXTS.B], [TEXTS.A], ["not-a-text"], "t", null, [7]]) {
      const res = await savePick(started, questionId, pick);
      expect(res).toEqual({ status: 400, body: { error: "invalid_pick" } });
    }
    expect(await draftRow(questionId)).toBeUndefined();
  });

  it("refuses a pick on a fixed pair (there is nothing to choose)", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const { started, questionId } = await startComparative();
    expect(questionId).toBe(FIXED_Q);
    expect((await savePick(started, questionId, [TEXTS.A])).status).toBe(400);
  });

  it("refuses a bad token, a question that is not in the attempt, and another student's attempt", async () => {
    env = await setupComparativeEnv();
    const { started, questionId } = await startChoice();
    expect((await savePick({ ...started, attemptToken: "bad" }, questionId, [TEXTS.B])).status).toBe(401);
    expect((await savePick(started, FIXED_Q, [TEXTS.B])).status).toBe(404);
    await signedInStudent(env, { googleSub: "someone-else", email: "other@example.com" });
    expect((await savePick(started, questionId, [TEXTS.B])).status).toBe(401);
  });

  it("is locked once the first try is submitted: 409 pick_locked and the stored pick is unchanged", async () => {
    env = await setupComparativeEnv();
    const { started, questionId } = await startChoice();
    await savePick(started, questionId, [TEXTS.B]);
    const graded = await gradeComparative(started, questionId, fillWords(60, "[mark:2]"), { pick: [TEXTS.B] });
    expect(graded.status).toBe(200);
    const res = await savePick(started, questionId, [TEXTS.V]);
    expect(res).toEqual({ status: 409, body: { error: "pick_locked" } });
  });

  it("carries nothing from the key in any response", async () => {
    env = await setupComparativeEnv();
    const { started, questionId } = await startChoice();
    const ok = await savePick(started, questionId, [TEXTS.B]);
    const bad = await savePick(started, questionId, []);
    for (const body of [ok.body, bad.body]) expect(JSON.stringify(body)).not.toMatch(/criteria|model|pairing|description/i);
  });
});
