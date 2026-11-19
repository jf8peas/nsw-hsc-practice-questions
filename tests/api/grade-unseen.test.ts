// The unseen-text unit's grade flow through POST /api/grade (spec 008): try 1 and the retry, the phase
// row, the daily-allowance slot and its refunds, the answer rules, the two ways a try cannot be
// marked (neither self-marks nor ends the question), and what may be released.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getAnswer } from "@/content/answers";
import { conceptProgress } from "@/lib/concepts/progress";
import { getUnit } from "@/content";
import { attempts, dailyAiUsage, results, rewriteDrafts, unseenPhases } from "@/lib/db/schema";
import { SKILL_IDS, skillConceptId } from "@/lib/unseen/skills";

import { signedInStudent } from "../helpers/routes";
import {
  FEEDBACK,
  GAP,
  Q,
  REASON,
  fillWords,
  gradeUnseen,
  markerContent,
  restoreUnseenEnv,
  setupUnseenEnv,
  startUnseen,
  type UnseenEnv,
} from "../helpers/unseen";

let env: UnseenEnv;
afterEach(async () => {
  restoreUnseenEnv();
  vi.restoreAllMocks();
  await env?.close();
});

const q = Q[0];
const model = () => getAnswer(q)!.unseen!.model;
const used = async (userId: string) =>
  (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce((s, r) => s + r.count, 0);
const phaseRow = async () => (await env.db.select().from(unseenPhases).where(eq(unseenPhases.questionId, q)))[0];
const resultRow = async () => (await env.db.select().from(results).where(eq(results.questionId, q)))[0];
const drafts = async () => (await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.questionId, q)))[0];
const BELOW = fillWords(60, "[mark:1]", "[miss:technique-effect,apt-evidence]");
const quiet = () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
};

describe("try 1 at full marks", () => {
  it("goes straight to the discussion: row final/full_marks, result saved with the seven first-try outcomes", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    const { started } = await startUnseen();
    const { status, body } = await gradeUnseen(started, q, fillWords(60));
    expect(status).toBe(200);
    expect(body.saved).toBe(true);
    expect(body.result).toMatchObject({ phase: 1, marksAwarded: 3, recordedMark: 3, ending: "full_marks", maxMarks: 3 });
    expect(body.result.skills).toHaveLength(7);
    expect(body.result.skills.every((s: { met: boolean }) => s.met)).toBe(true);
    expect(body.result.discussion).toEqual({ modelAnswer: model(), modelWords: model().trim().split(/\s+/).length });
    const row = await phaseRow();
    expect(row).toMatchObject({ status: "final", ending: "full_marks", recordedMark: 3, try1Mark: 3, maxMarks: 3, try1PromptVersion: "unseen-pilot-4" });
    expect(row.try1Verdicts["technique-effect"]).toEqual({ met: true, reason: REASON });
    expect(row.try1Feedback).toBe(FEEDBACK);
    expect(row.try1BiggestGap).toBe(GAP);
    const res = await resultRow();
    expect(res).toMatchObject({ marksAwarded: 3, maxMarks: 3, gradedBy: "llm" });
    expect(res.conceptOutcomes).toHaveLength(7);
    expect(await used(user.id)).toBe(1);
    expect((await env.db.select().from(attempts))[0].completedAt).not.toBeNull();
  });
});

describe("try 1 below full marks", () => {
  it("stores a try1 row, offers a retry, and releases the verdicts but no discussion and no model answer", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    const { body } = await gradeUnseen(started, q, BELOW);
    expect(body.saved).toBe(false);
    expect(body.phaseSaved).toBe(true);
    expect(body.attemptCompleted).toBe(false);
    expect(body.result).toMatchObject({ phase: 1, marksAwarded: 1, retryOffered: true, feedback: FEEDBACK, biggestGap: GAP });
    expect(body.result.recordedMark).toBeUndefined();
    expect(body.result.discussion).toBeUndefined();
    expect(body.result.skills.filter((s: { met: boolean }) => !s.met).map((s: { id: string }) => s.id)).toEqual(["technique-effect", "apt-evidence"]);
    expect(JSON.stringify(body)).not.toContain(model().slice(0, 40));
    expect(await resultRow()).toBeUndefined();
    expect(await phaseRow()).toMatchObject({ status: "try1", ending: null, recordedMark: null });
  });
});

describe("the retry", () => {
  it("is capped at full marks minus one, finalises as retried, records the higher try, and only the first try feeds skills", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, BELOW);
    const { body } = await gradeUnseen(started, q, fillWords(60, "[mark:3]"), { phase: 2 });
    expect(body.result).toMatchObject({ phase: 2, marksAwarded: 2, recordedMark: 2, ending: "retried" });
    expect(body.result.try1).toMatchObject({ mark: 1 });
    expect(body.result.discussion.modelAnswer).toBe(model());
    expect(body.saved).toBe(true);
    const row = await phaseRow();
    expect(row).toMatchObject({ status: "final", ending: "retried", try1Mark: 1, try2Mark: 2, recordedMark: 2 });
    expect(await resultRow()).toMatchObject({ marksAwarded: 2 });
    // seven outcomes from the FIRST try: the retry fixed both skills but they still count as missed
    const unit = getUnit("y12-english-advanced-unseen-texts")!;
    const rows = await env.db.select().from(results);
    const state = conceptProgress(unit, rows.map((r) => ({ id: r.id, questionId: r.questionId, marks: r.marksAwarded, max: r.maxMarks, answeredAt: r.createdAt, conceptOutcomes: r.conceptOutcomes })));
    expect(state.map((s) => s.conceptId).sort()).toEqual([skillConceptId("apt-evidence"), skillConceptId("technique-effect")].sort());
    expect(state.every((s) => s.count === 2)).toBe(true);
    expect(await used(user.id)).toBe(2);
    expect(await drafts()).toBeUndefined();
  });

  it("keeps the first try's mark when the retry scores lower", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, fillWords(60, "[mark:2]"));
    const { body } = await gradeUnseen(started, q, fillWords(60, "[mark:1]"), { phase: 2 });
    expect(body.result).toMatchObject({ marksAwarded: 1, recordedMark: 2, ending: "retried" });
    expect((await resultRow()).marksAwarded).toBe(2);
  });

  it("is refused before a first try is marked, and there is no third try", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    const early = await gradeUnseen(started, q, fillWords(60), { phase: 2 });
    expect(early.status).toBe(400);
    expect(early.body.error).toBe("phase_refused");
    await gradeUnseen(started, q, BELOW);
    await gradeUnseen(started, q, fillWords(60, "[mark:2]"), { phase: 2 });
    const third = await gradeUnseen(started, q, fillWords(60, "[mark:3]"), { phase: 2 });
    expect(third.status).toBe(409);
    expect(third.body.error).toBe("already_answered");
    expect(third.body.result.ending).toBe("retried");
  });

  it("is refused after full marks, with the stored result", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, fillWords(60));
    const r = await gradeUnseen(started, q, fillWords(60), { phase: 2 });
    expect(r.status).toBe(409);
    expect(r.body.result.ending).toBe("full_marks");
  });
});

describe("one slot per marked try, at most two a quiz", () => {
  it("uses one slot for each of the two tries and never a third", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    process.env.LLM_DAILY_CAP = "10";
    const { started } = await startUnseen();
    await gradeUnseen(started, q, BELOW);
    expect(await used(user.id)).toBe(1);
    await gradeUnseen(started, q, fillWords(60, "[mark:2]"), { phase: 2 });
    expect(await used(user.id)).toBe(2);
    await gradeUnseen(started, q, fillWords(60), { phase: 2 });
    expect(await used(user.id)).toBe(2);
  });

  it("takes no slot for a repeated try 1 (409)", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    const { started } = await startUnseen();
    await gradeUnseen(started, q, BELOW);
    const again = await gradeUnseen(started, q, BELOW);
    expect(again.status).toBe(409);
    expect(again.body.result).toMatchObject({ phase: 1, marksAwarded: 1, retryOffered: true });
    expect(await used(user.id)).toBe(1);
  });
});

describe("the answer rules, on the server", () => {
  it("rejects under 20 words and over 20% over the suggested length before any slot or call", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    const { started } = await startUnseen();
    const short = await gradeUnseen(started, q, fillWords(19));
    expect(short.status).toBe(400);
    expect(short.body).toEqual({ error: "answer_too_short", minWords: 20 });
    const long = await gradeUnseen(started, q, fillWords(245));
    expect(long.status).toBe(400);
    expect(long.body).toEqual({ error: "answer_too_long", maxWords: 244 });
    expect(env.chat).not.toHaveBeenCalled();
    expect(await used(user.id)).toBe(0);
    expect(await phaseRow()).toBeUndefined();
  });

  it("allows exactly 20 and exactly 244 words", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    expect((await gradeUnseen(started, q, fillWords(244, "[mark:2]"))).status).toBe(200);
  });

  it("refuses skip, an empty answer and a phase that is not 1 or 2", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    expect((await gradeUnseen(started, q, fillWords(60), { skip: true })).body.error).toBe("invalid_request");
    expect((await gradeUnseen(started, q, "   ")).body.error).toBe("invalid_request");
    expect((await gradeUnseen(started, q, fillWords(60), { phase: 3 as never })).body.error).toBe("invalid_phase");
    expect(env.chat).not.toHaveBeenCalled();
  });
});

describe("a try that cannot be marked: the box returns, nothing is invented, nothing self-marks", () => {
  const failures: Array<[string, unknown]> = [
    ["an HTTP error", { ok: false, reason: "http", status: 500 }],
    ["an empty reply", { ok: false, reason: "empty" }],
    ["a cut-off reply", { ok: true, content: '{"mark": 2, "skills":', finishReason: "length" }],
    ["an unparseable reply", { ok: true, content: "I cannot give JSON today." }],
    ["a reply missing the biggest gap", { ok: true, content: markerContent(2, [], { biggestGap: "" }) }],
    ["a reply that echoes the model answer", { ok: true, content: markerContent(2, [], { feedback: `Model: ${getAnswer(Q[0])!.unseen!.model}` }) }],
  ];

  it.each(failures)("%s: 200 notMarked, no row or result, the slot refunded, the answer kept as the draft", async (_label, reply) => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    quiet();
    env.chat.mockResolvedValue(reply);
    const { started } = await startUnseen();
    const answer = fillWords(60, "[mark:3]");
    const { status, body } = await gradeUnseen(started, q, answer);
    expect(status).toBe(200);
    expect(body).toEqual({ notMarked: { reason: "marker_unavailable", phase: 1 }, saved: false });
    expect(JSON.stringify(body)).not.toMatch(/selfMark|needsSelfMark|tick/i);
    expect(await phaseRow()).toBeUndefined();
    expect(await resultRow()).toBeUndefined();
    expect(await used(user.id)).toBe(0);
    expect((await drafts()).phase1Draft).toBe(answer);
  });

  it("a parse failure is retried once, and the retry's slot is not a second slot", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    quiet();
    env.chat.mockResolvedValueOnce({ ok: true, content: "nope" }).mockResolvedValueOnce({ ok: true, content: markerContent(3), finishReason: "stop" });
    const { started } = await startUnseen();
    const { body } = await gradeUnseen(started, q, fillWords(60));
    expect(body.result.marksAwarded).toBe(3);
    expect(env.chat).toHaveBeenCalledTimes(2);
    expect(await used(user.id)).toBe(1);
  });

  it("no OpenRouter key, or LLM_DAILY_CAP=0: marker_unavailable (never 'come back tomorrow'), no model call", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    delete process.env.OPENROUTER_API_KEY;
    expect((await gradeUnseen(started, q, fillWords(60))).body.notMarked.reason).toBe("marker_unavailable");
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.LLM_DAILY_CAP = "0";
    const off = await gradeUnseen(started, q, fillWords(60));
    expect(off.body.notMarked).toEqual({ reason: "marker_unavailable", phase: 1 });
    expect(env.chat).not.toHaveBeenCalled();
  });

  it("a failed retry returns the box with the retry text, records no mark, and keeps the row at try1", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    quiet();
    const { started } = await startUnseen();
    await gradeUnseen(started, q, BELOW);
    env.chat.mockResolvedValue({ ok: false, reason: "http", status: 503 });
    const retry = fillWords(60, "[mark:3]");
    const { body } = await gradeUnseen(started, q, retry, { phase: 2 });
    expect(body.notMarked).toEqual({ reason: "marker_unavailable", phase: 2 });
    expect(await phaseRow()).toMatchObject({ status: "try1", try2Mark: null, recordedMark: null });
    expect(await resultRow()).toBeUndefined();
    expect((await drafts()).phase2Draft).toBe(retry);
    expect(await used(user.id)).toBe(1);
  });
});

describe("the daily limit", () => {
  it("on try 1: come back tomorrow, no slot, no row, the answer kept; the cap is not exceeded", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    process.env.LLM_DAILY_CAP = "1";
    const { reserveAiSlot } = await import("@/lib/usage.server");
    await reserveAiSlot(env.db, user.id, 1);
    const { started } = await startUnseen();
    const answer = fillWords(60);
    const { body } = await gradeUnseen(started, q, answer);
    expect(body.notMarked).toMatchObject({ reason: "daily_limit", phase: 1 });
    expect(body.notMarked.resetsAt).toMatch(/T00:00:00\+1[01]:00$/);
    expect(env.chat).not.toHaveBeenCalled();
    expect(await used(user.id)).toBe(1);
    expect(await phaseRow()).toBeUndefined();
    expect((await drafts()).phase1Draft).toBe(answer);
  });

  it("on the retry: the first try's slot was the only one; the retry waits, the first-try mark is NOT recorded", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    process.env.LLM_DAILY_CAP = "1";
    const { started } = await startUnseen();
    await gradeUnseen(started, q, BELOW);
    const { body } = await gradeUnseen(started, q, fillWords(60, "[mark:3]"), { phase: 2 });
    expect(body.notMarked).toMatchObject({ reason: "daily_limit", phase: 2 });
    expect(await phaseRow()).toMatchObject({ status: "try1", recordedMark: null });
    expect(await resultRow()).toBeUndefined();
    expect(await used(user.id)).toBe(1);
  });
});

describe("rate limits, the database and the log", () => {
  it("answers 429 and takes no slot when the per-user grade limit is used", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    process.env.GRADE_RATE_LIMIT = "1";
    const { started } = await startUnseen();
    await gradeUnseen(started, q, BELOW);
    const second = await gradeUnseen(started, q, fillWords(60, "[mark:2]"), { phase: 2 });
    expect(second.status).toBe(429);
    expect(second.body.error).toBe("rate_limited");
    expect(await used(user.id)).toBe(1);
  });

  it("answers 503 with nothing recorded when the database cannot be read, and never self-marks", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    env.databaseDown();
    const { status, body } = await gradeUnseen(started, q, fillWords(60));
    expect(status).toBe(503);
    expect(body.error).toBe("temporarily_unavailable");
    env.databaseUp();
    expect(await phaseRow()).toBeUndefined();
  });

  it("logs no answer text, reason, feedback, biggest gap or model answer across a whole quiz", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const spies = [vi.spyOn(console, "info"), vi.spyOn(console, "error"), vi.spyOn(console, "warn"), vi.spyOn(console, "log")].map((s) => s.mockImplementation(() => {}));
    const { started } = await startUnseen();
    await gradeUnseen(started, q, "ANSWER-TEXT-9921 " + BELOW);
    await gradeUnseen(started, q, "RETRY-TEXT-1177 " + fillWords(60, "[mark:2]"), { phase: 2 });
    const logged = spies.flatMap((s) => s.mock.calls.flat()).join("\n");
    expect(logged).toContain("[unseen] outcome=graded");
    for (const secret of ["ANSWER-TEXT-9921", "RETRY-TEXT-1177", REASON, FEEDBACK, GAP, model().slice(0, 30)]) expect(logged).not.toContain(secret);
  });
});

describe("the seven skill verdicts", () => {
  it("are all stored (jsonb orders keys itself), and are returned in rubric order", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const { started } = await startUnseen();
    const { body } = await gradeUnseen(started, q, BELOW);
    expect(Object.keys((await phaseRow()).try1Verdicts).sort()).toEqual([...SKILL_IDS].sort());
    expect(body.result.skills.map((s: { id: string }) => s.id)).toEqual([...SKILL_IDS]);
  });
});
