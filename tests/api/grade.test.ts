import { and, eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { getAnswer } from "@/content/answers";
import { attempts, results, users } from "@/lib/db/schema";

import { seedUser } from "../helpers/fixtures";
import {
  allKeys,
  correctDisplayIndex,
  firstOf,
  post,
  setupRouteEnv,
  signedInStudent,
  startAttempt,
  wrongDisplayIndex,
  type RouteEnv,
  type StartedAttempt,
} from "../helpers/routes";

let env: RouteEnv;
afterEach(async () => {
  await env?.close();
});

async function grade(started: StartedAttempt, questionId: string, answer: string, extra = {}) {
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(
    post("/api/grade", {
      attemptId: started.attemptId,
      attemptToken: started.attemptToken,
      questionId,
      answer,
      ...extra,
    }),
  );
  return { res, body: await res.json(), status: res.status };
}

const rowsFor = (attemptId: string) =>
  env.db.select().from(results).where(eq(results.attemptId, attemptId));

describe("MC grading and saving", () => {
  it("maps the display index to the right option and saves it (correct answer)", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "mc");
    const idx = correctDisplayIndex(q);

    const { status, body } = await grade(started, q.id, String(idx));
    expect(status).toBe(200);
    expect(body.saved).toBe(true);
    expect(body.degraded).toBe(false);
    expect(body.result.marksAwarded).toBe(q.maxMarks);
    expect(body.result.correctDisplayIndex).toBe(idx);

    const rows = await rowsFor(started.attemptId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: user.id,
      questionId: q.id,
      answer: getAnswer(q.id)!.correctText,
      marksAwarded: q.maxMarks,
      maxMarks: q.maxMarks,
      gradedBy: "auto",
      feedback: null,
      rubricHits: null,
      rubricMisses: null,
    });
    const [u] = await env.db.select().from(users).where(eq(users.id, user.id));
    expect(u.lastAnswerAt).toBeInstanceOf(Date);
  });

  it("marks a wrong option 0 and stores the chosen option's text", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "mc");
    const wrong = wrongDisplayIndex(q);
    const { body } = await grade(started, q.id, String(wrong));
    expect(body.result.marksAwarded).toBe(0);
    expect(body.result.correctDisplayIndex).toBe(correctDisplayIndex(q));
    const [row] = await rowsFor(started.attemptId);
    expect(row.answer).toBe((q as { options: string[] }).options[wrong]);
    expect(row.marksAwarded).toBe(0);
  });

  it("rejects an out-of-range or non-numeric display index and writes nothing", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "mc");
    for (const bad of ["-1", "99", "abc", "1.5", ""]) {
      expect((await grade(started, q.id, bad)).status).toBe(400);
    }
    expect(await rowsFor(started.attemptId)).toHaveLength(0);
  });
});

describe("short-answer grading and saving", () => {
  it("saves an LLM-graded answer with feedback and rubric hits/misses", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");
    env.llm.mockResolvedValueOnce({
      marksAwarded: 1,
      feedback: "Nice work.",
      rubricHits: ["hit A"],
      rubricMisses: ["miss B"],
      gradedBy: "mock-model",
    });
    const { status, body } = await grade(started, q.id, "my answer");
    expect(status).toBe(200);
    expect(body.saved).toBe(true);
    expect(body.result.feedback).toBe("Nice work.");
    const [row] = await rowsFor(started.attemptId);
    expect(row).toMatchObject({
      answer: "my answer",
      gradedBy: "llm",
      marksAwarded: 1,
      feedback: "Nice work.",
      rubricHits: ["hit A"],
      rubricMisses: ["miss B"],
    });
  });

  it("scores an empty short answer 0 without calling the LLM", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");
    const { body } = await grade(started, q.id, "   ");
    expect(body.result.marksAwarded).toBe(0);
    expect(env.llm).not.toHaveBeenCalled();
    const [row] = await rowsFor(started.attemptId);
    expect(row.gradedBy).toBe("auto");
    expect(row.feedback).toBeNull();
  });

  it("when the LLM fails, asks for a self-mark (with a token) and saves nothing yet", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "short");
    env.llm.mockResolvedValueOnce(null);
    const { status, body } = await grade(started, q.id, "my answer");
    expect(status).toBe(200);
    expect(body.result.needsSelfMark).toBe(true);
    expect(body.result.marksAwarded).toBeNull();
    expect(body.saved).toBe(false);
    expect(typeof body.selfMarkToken).toBe("string");
    expect(body.receipt).toBeUndefined();
    expect(await rowsFor(started.attemptId)).toHaveLength(0);
    const { verifySelfMarkToken } = await import("@/lib/tokens.server");
    expect(
      verifySelfMarkToken(body.selfMarkToken, {
        uid: user.id,
        attemptId: started.attemptId,
        questionId: q.id,
        answer: "my answer",
      }).ok,
    ).toBe(true);
  });
});

describe("ownership and token checks (SC-002)", () => {
  it("rejects another student's token and attempt id, writing nothing", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const mine = await startAttempt();
    const q = firstOf(mine.questions, "mc");

    // a second student
    const other = await seedUser(env.db);
    const { asSessionUser } = await import("../helpers/env");
    env.signedInAs(asSessionUser(other));
    const theirs = await startAttempt();

    // other student uses my attempt id + my token
    const r1 = await grade(mine, q.id, "0");
    expect(r1.status).toBe(400);
    expect(r1.body.error).toBe("invalid_attempt_token");
    // other student uses my attempt id with their own token
    const r2 = await grade({ ...theirs, attemptId: mine.attemptId }, q.id, "0");
    expect(r2.status).toBe(400);
    expect(r2.body.error).toBe("invalid_attempt_token");

    expect(await env.db.select().from(results)).toHaveLength(0);
    expect(await env.db.select().from(attempts)).toHaveLength(2);
  });

  it("rejects an expired or tampered attemptToken with 400 invalid_attempt_token", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "mc");
    const { signAttemptToken } = await import("@/lib/tokens.server");
    const expired = signAttemptToken(
      {
        uid: user.id,
        attemptId: started.attemptId,
        unitId: "y11-physics-preliminary",
        questionIds: started.questions.map((x) => x.id),
        mcOptionOrder: {},
      },
      Date.now() - 25 * 60 * 60 * 1000,
    );
    const a = await grade({ ...started, attemptToken: expired }, q.id, "0");
    expect(a.status).toBe(400);
    expect(a.body.error).toBe("invalid_attempt_token");

    const [body, sig] = started.attemptToken.split(".");
    const json = JSON.parse(Buffer.from(body, "base64url").toString());
    json.questionIds.push("y11-physics-preliminary.s01");
    const forged = `${Buffer.from(JSON.stringify(json)).toString("base64url")}.${sig}`;
    const b = await grade({ ...started, attemptToken: forged }, q.id, "0");
    expect(b.status).toBe(400);
    expect(await rowsFor(started.attemptId)).toHaveLength(0);
  });

  it("returns 404 for a question that is not in the token's questionIds", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const undrawn = (await import("@/content")).UNITS[0].questions.find(
      (q) => !started.questions.some((x) => x.id === q.id),
    )!;
    const { status } = await grade(started, undrawn.id, "0");
    expect(status).toBe(404);
    expect((await grade(started, "retired.q1", "0")).status).toBe(404);
  });

  it("answers 401 signed out, and 401 (not degraded) when the student's row is gone", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "mc");
    await env.testDb.pg.query("delete from users where id = $1", [user.id]);
    const gone = await grade(started, q.id, "0");
    expect(gone.status).toBe(401);
    env.signedOut();
    expect((await grade(started, q.id, "0")).status).toBe(401);
  });

  it("ignores client-supplied marks, user id, grading method and completion", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "mc");
    const wrong = wrongDisplayIndex(q);
    const { body } = await grade(started, q.id, String(wrong), {
      marks: 99,
      marksAwarded: 99,
      maxMarks: 99,
      userId: "someone-else",
      uid: "someone-else",
      gradedBy: "self",
      completed: true,
      completedAt: new Date().toISOString(),
    });
    expect(body.result.marksAwarded).toBe(0);
    const [row] = await rowsFor(started.attemptId);
    expect(row).toMatchObject({ marksAwarded: 0, gradedBy: "auto", userId: user.id });
    const [att] = await env.db.select().from(attempts).where(eq(attempts.id, started.attemptId));
    expect(att.completedAt).toBeNull();
  });
});

describe("already answered and races (FR-007)", () => {
  it("a second answer to the same question returns 409 with the stored mark", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "mc");
    await grade(started, q.id, String(wrongDisplayIndex(q)));
    const second = await grade(started, q.id, String(correctDisplayIndex(q)));
    expect(second.status).toBe(409);
    expect(second.body.error).toBe("already_answered");
    expect(second.body.result.marksAwarded).toBe(0);
    expect(await rowsFor(started.attemptId)).toHaveLength(1);
  });

  it("two simultaneous calls for the same question produce one row: one 200 and one 409", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "mc");
    const idx = String(correctDisplayIndex(q));
    const [a, b] = await Promise.all([grade(started, q.id, idx), grade(started, q.id, idx)]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    expect(await rowsFor(started.attemptId)).toHaveLength(1);
  });

  it("completes the attempt only when every drawn question has a result, decided by the server", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    let last;
    for (const q of started.questions) {
      last = q.type === "mc" ? await grade(started, q.id, "0") : await grade(started, q.id, "text");
      const [att] = await env.db.select().from(attempts).where(eq(attempts.id, started.attemptId));
      const done = (await rowsFor(started.attemptId)).length === started.questions.length;
      expect(att.completedAt !== null).toBe(done);
      expect(last.body.attemptCompleted).toBe(done);
    }
    expect(last!.body.attemptCompleted).toBe(true);
  });
});

describe("failures never block marking (FR-008, SC-004)", () => {
  it("a failed save still returns the mark plus a receipt, and stores nothing", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "mc");
    env.failAfterCalls(2); // session lookup + already-answered check succeed; the save does not
    const { status, body } = await grade(started, q.id, String(correctDisplayIndex(q)));
    expect(status).toBe(200);
    expect(body.saved).toBe(false);
    expect(body.degraded).toBe(false);
    expect(body.result.marksAwarded).toBe(q.maxMarks);
    expect(typeof body.receipt).toBe("string");
    env.databaseUp();
    expect(await rowsFor(started.attemptId)).toHaveLength(0);

    const { verifyReceipt } = await import("@/lib/tokens.server");
    const v = verifyReceipt(body.receipt, { uid: user.id });
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.payload.questionId).toBe(q.id);
      expect(v.payload.attempt.questionIds).toEqual(started.questions.map((x) => x.id));
    }
  });

  it("a save slower than 1500 ms still returns the mark plus a receipt", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    const q = firstOf(started.questions, "mc");
    env.slowAfterCalls(2, 1700);
    const t0 = Date.now();
    const { body } = await grade(started, q.id, String(correctDisplayIndex(q)));
    expect(Date.now() - t0).toBeLessThan(2500);
    expect(body.saved).toBe(false);
    expect(body.result.marksAwarded).toBe(q.maxMarks);
    expect(typeof body.receipt).toBe("string");
  });

  it("the first save for an attempt minted while the database was down creates the attempt row", async () => {
    env = await setupRouteEnv();
    const user = await signedInStudent(env);
    env.databaseDown();
    const started = await startAttempt();
    expect(started.persisted).toBe(false);
    env.databaseUp();
    expect(await env.db.select().from(attempts)).toHaveLength(0);

    const q = firstOf(started.questions, "mc");
    const { status, body } = await grade(started, q.id, String(correctDisplayIndex(q)));
    expect(status).toBe(200);
    expect(body.saved).toBe(true);
    const rows = await env.db.select().from(attempts).where(eq(attempts.id, started.attemptId));
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBe(user.id);
    expect(rows[0].questionIds).toEqual(started.questions.map((x) => x.id));
    expect(await rowsFor(started.attemptId)).toHaveLength(1);
  });
});

describe("no answer key leaks into responses or stored rows (Principle I)", () => {
  it("stores no model answer, rubric text or marking notes", async () => {
    env = await setupRouteEnv();
    await signedInStudent(env);
    const started = await startAttempt();
    for (const q of started.questions) {
      await grade(started, q.id, q.type === "mc" ? "0" : "an answer");
    }
    const stored = await rowsFor(started.attemptId);
    const dump = JSON.stringify(stored);
    for (const q of started.questions) {
      const key = getAnswer(q.id)!;
      if (key.modelAnswer && key.modelAnswer.length > 20) expect(dump).not.toContain(key.modelAnswer);
      for (const r of key.rubric) if (r.length > 20) expect(dump).not.toContain(r);
      if (key.notes && key.notes.length > 20) expect(dump).not.toContain(key.notes);
    }
    const keys = allKeys(stored);
    for (const banned of ["modelAnswer", "rubric", "notes", "correctText", "correctIndex"]) {
      expect(keys.has(banned), banned).toBe(false);
    }
  });
});
