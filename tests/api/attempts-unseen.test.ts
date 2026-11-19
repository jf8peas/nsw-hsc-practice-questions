// Starting and resuming the unseen-text unit through POST /api/attempts (spec 008 FR-027 to FR-029,
// research R8 and R9): an unfinished question first, otherwise one unanswered question, one open
// attempt per student, two tabs, the finished bank, the daily-limit marker, and a database that
// cannot be read.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getAnswer } from "@/content/answers";
import { attempts, rewriteDrafts, unseenPhases } from "@/lib/db/schema";
import { UNITS } from "@/content";
import { SKILL_IDS, skillConceptId } from "@/lib/unseen/skills";
import { reserveAiSlot } from "@/lib/usage.server";

import { seedAttempt, seedResult } from "../helpers/fixtures";

import { allKeys, post, signedInStudent } from "../helpers/routes";
import {
  Q,
  UNSEEN_UNIT,
  declineUnseen,
  fillWords,
  gradeUnseen,
  restoreUnseenEnv,
  setupUnseenEnv,
  type UnseenEnv,
} from "../helpers/unseen";

let env: UnseenEnv;
afterEach(async () => {
  restoreUnseenEnv();
  delete process.env.ATTEMPT_RATE_LIMIT;
  vi.restoreAllMocks();
  await env?.close();
});

async function start() {
  const { POST } = await import("@/app/api/attempts/route");
  const res = await POST(post("/api/attempts", { unitId: UNSEEN_UNIT }));
  return { status: res.status, body: await res.json() };
}
const attemptRows = () => env.db.select().from(attempts).where(eq(attempts.unitId, UNSEEN_UNIT));

describe("starting a quiz", () => {
  it("gives a new student one question on one public text, at the write stage, with no key", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const r = await start();
    expect(r.status).toBe(201);
    expect(r.body.questions).toHaveLength(1);
    expect(r.body.questions[0].id).toBe(Q[0]);
    expect(r.body.persisted).toBe(true);
    expect(r.body.unseenState.stage).toBe("write");
    expect(r.body.unseenState.text.id).toBe(r.body.questions[0].textId);
    expect(r.body.unseenState.dailyLimit).toBeUndefined();
    // no key field and no run of the model answer anywhere in the response
    const banned = ["criteria", "notes", "modelAnswer", "model", "visualDescription", "descriptionCheck", "discussion"];
    const keys = allKeys(r.body);
    for (const k of banned) expect(keys.has(k), k).toBe(false);
    const model = getAnswer(Q[0])!.unseen!.model;
    expect(JSON.stringify(r.body)).not.toContain(model.slice(0, 40));
    expect(await attemptRows()).toHaveLength(1);
  });

  it("offers the unfinished question again: the same attempt, resumed", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const first = await start();
    const again = await start();
    expect(again.status).toBe(200);
    expect(again.body.resumed).toBe(true);
    expect(again.body.attemptId).toBe(first.body.attemptId);
    expect(await attemptRows()).toHaveLength(1);
  });

  it("two starts at once end on the same attempt (one created, one resumed)", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const [a, b] = await Promise.all([start(), start()]);
    expect(a.body.attemptId).toBe(b.body.attemptId);
    expect([a.status, b.status].sort()).toEqual([200, 201]);
    expect(await attemptRows()).toHaveLength(1);
  });

  it("reports a finished bank once every question is answered, and creates no attempt", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    // answer every question in the bank at full marks
    for (let i = 0; i < Q.length; i++) {
      const r = await start();
      expect(r.status, `question ${i + 1}`).toBe(201);
      const g = await gradeUnseen(r.body, r.body.questions[0].id, fillWords(60));
      expect(g.body.result.ending).toBe("full_marks");
    }
    const done = await start();
    expect(done.status).toBe(200);
    expect(done.body).toEqual({ finished: true, total: Q.length, answered: Q.length });
    expect(await attemptRows()).toHaveLength(Q.length);
  });

  it("answers 503 and creates nothing when the database cannot be read", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    env.databaseDown();
    const r = await start();
    expect(r.status).toBe(503);
    expect(r.body.error).toBe("temporarily_unavailable");
    env.databaseUp();
    expect(await attemptRows()).toHaveLength(0);
  });

  it("still applies the per-user attempt rate limit", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    process.env.ATTEMPT_RATE_LIMIT = "1";
    expect((await start()).status).toBe(201);
    const second = await start();
    expect(second.status).toBe(429);
    expect(second.body.error).toBe("rate_limited");
  });
});

describe("the daily-limit marker", () => {
  it("is present once the day's slots have reached LLM_DAILY_CAP, with the next Sydney midnight", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    process.env.LLM_DAILY_CAP = "1";
    await reserveAiSlot(env.db, user.id, 1);
    const r = await start();
    expect(r.body.unseenState.dailyLimit).toMatchObject({ reached: true });
    expect(r.body.unseenState.dailyLimit.resetsAt).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\+1[01]:00$/);
  });

  it("is absent below the cap, and when the cap is 0 (that is marker-off, not 'come back tomorrow')", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    process.env.LLM_DAILY_CAP = "5";
    await reserveAiSlot(env.db, user.id, 5);
    expect((await start()).body.unseenState.dailyLimit).toBeUndefined();
    process.env.LLM_DAILY_CAP = "0";
    expect((await start()).body.unseenState.dailyLimit).toBeUndefined();
  });
});

describe("resume states (the same builder as the quiz page)", () => {
  const BELOW = fillWords(60, "[mark:1]", "[miss:technique-effect,apt-evidence]");

  it("resumes at the retry choice after a below-full first try: the first try, no model answer", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const first = await start();
    await gradeUnseen(first.body, Q[0], BELOW);
    const again = await start();
    expect(again.status).toBe(200);
    const s = again.body.unseenState;
    expect(s.stage).toBe("choice");
    expect(s.retryOffered).toBe(true);
    expect(s.try1.mark).toBe(1);
    expect(s.try1.skills.filter((k: { met: boolean }) => !k.met)).toHaveLength(2);
    expect(s.discussion).toBeUndefined();
    expect(JSON.stringify(again.body)).not.toContain(getAnswer(Q[0])!.unseen!.model.slice(0, 40));
    expect(allKeys(again.body).has("modelAnswer")).toBe(false);
  });

  it("resumes at the retry with the saved retry text", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    const first = await start();
    await gradeUnseen(first.body, Q[0], BELOW);
    await env.db.insert(rewriteDrafts).values({ attemptId: first.body.attemptId, userId: user.id, unitId: UNSEEN_UNIT, questionId: Q[0], phase1Draft: "", phase2Draft: "Half a retry" });
    const again = await start();
    expect(again.body.unseenState).toMatchObject({ stage: "retry", draft2: "Half a retry", retryOffered: true });
  });

  it("restores a saved first draft at the write stage", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    const first = await start();
    await env.db.insert(rewriteDrafts).values({ attemptId: first.body.attemptId, userId: user.id, unitId: UNSEEN_UNIT, questionId: Q[0], phase1Draft: "Half an answer", phase2Draft: "" });
    const again = await start();
    expect(again.body.unseenState).toMatchObject({ stage: "write", draft1: "Half an answer" });
  });

  it("carries the daily-limit marker at the retry, and holds the question at that step", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    process.env.LLM_DAILY_CAP = "1";
    const first = await start();
    await gradeUnseen(first.body, Q[0], BELOW); // uses the one slot
    const limited = await gradeUnseen(first.body, Q[0], fillWords(60, "[mark:3]"), { phase: 2 });
    expect(limited.body.notMarked).toMatchObject({ reason: "daily_limit", phase: 2 });
    const again = await start();
    expect(again.body.unseenState).toMatchObject({ stage: "retry", dailyLimit: { reached: true } });
    expect(again.body.unseenState.draft2).toContain("word");
    expect(user.id).toBeTruthy();
  });

  it("is a final discussion with the model answer after a decline", async () => {
    env = await setupUnseenEnv();
    await signedInStudent(env);
    const first = await start();
    await gradeUnseen(first.body, Q[0], BELOW);
    await declineUnseen(first.body, Q[0]);
    // the attempt is complete, so the next start offers a question not yet answered
    const next = await start();
    expect(next.body.questions[0].id).toBe(Q[1]);
    const rows = await env.db.select().from(unseenPhases);
    expect(rows[0]).toMatchObject({ status: "final", ending: "declined", recordedMark: 1 });
  });
});

describe("the weighted draw, wired to the student's results", () => {
  const first = Q[0]; // Fort St 2025 Q1, a poem
  async function seedAnswer(userId: string, questionId: string, marks: number, missed: string[]) {
    const a = await seedAttempt(env.db, userId, { unitId: UNSEEN_UNIT, questionIds: [questionId], completedAt: new Date() });
    await seedResult(env.db, { attemptId: a.id, userId }, {
      unitId: UNSEEN_UNIT, questionId, marksAwarded: marks, maxMarks: 3, gradedBy: "llm",
      conceptOutcomes: SKILL_IDS.map((id) => ({ conceptId: skillConceptId(id), correct: !missed.includes(id) })),
    });
  }
  const totalWeight = async (userId: string) => {
    const { startUnseen: start } = await import("@/lib/unseen/start.server");
    let total = 0;
    await start(userId, UNITS.find((u) => u.id === UNSEEN_UNIT)!, (max) => ((total = max), 0));
    return total;
  };

  it("raises the weight of questions tagged with a skill still to clear, and never offers an answered question", async () => {
    env = await setupUnseenEnv();
    const me = await signedInStudent(env);
    await seedAnswer(me.id, first, 0, ["technique-effect"]);
    const unit = UNITS.find((u) => u.id === UNSEEN_UNIT)!;
    const rest = (unit.questions as Array<{ id: string; concepts: string[] }>).filter((x) => x.id !== first);
    // every other form is untried (10); the first question's form is answered, but its question is excluded
    const expected = rest.reduce((sum, x) => {
      const form = unit.texts!.find((t) => t.id === (x as unknown as { textId: string }).textId)!.form;
      const formW = form === "poem" ? 8 : 10; // a poem answered at 0/3 is the weakest form: 2 + round(6 × 1)
      return sum + formW * (2 + (x.concepts.includes(skillConceptId("technique-effect")) ? 1 : 0));
    }, 0);
    expect(await totalWeight(me.id)).toBe(expected);
    const r = await start();
    expect(r.body.questions[0].id).not.toBe(first);
  });

  it("offers an unfinished question before any draw", async () => {
    env = await setupUnseenEnv();
    const me = await signedInStudent(env);
    await seedAttempt(env.db, me.id, { unitId: UNSEEN_UNIT, questionIds: [Q[2]] });
    const r = await start();
    expect(r.status).toBe(200);
    expect(r.body.questions[0].id).toBe(Q[2]);
  });
});
