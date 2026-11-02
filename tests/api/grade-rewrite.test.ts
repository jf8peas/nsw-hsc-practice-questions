// The two-phase grade flow for rewrite questions (spec 005) through POST /api/grade:
// phase 1 (0-3, a 3/3 goes straight to the discussion), phase 2 (hinted retry capped at 2,
// best-of recorded, the compulsory retry — a skip request is refused, FR-042), the phase row,
// the daily-allowance slot and the 409/phase_refused guards. The AI marker is stubbed so each
// test chooses the marks and the per-term status (used / missing / misused).

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getUnit } from "@/content";
import { getAnswer } from "@/content/answers";
import { conceptProgress } from "@/lib/concepts/progress";
import { dailyAiUsage, results, rewritePhases } from "@/lib/db/schema";
import type { RewriteGrade } from "@/lib/openrouter.server";
import type { Question } from "@/lib/types";

import { setupTestEnv, type TestEnv } from "../helpers/env";
import {
  allKeys,
  firstOf,
  post,
  signedInStudent,
  startAttempt,
  wrongDisplayIndex,
  type StartedAttempt,
} from "../helpers/routes";

const REWRITE_UNIT = "y12-economics-sentence-writing";

interface RewriteRouteEnv extends TestEnv {
  /** The stubbed rewrite grader. Default: full marks (A, no padding, every term used). */
  rewrite: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<RewriteGrade | null>>>;
}

/** setupTestEnv plus a mock for the rewrite grader (the real OpenRouter call is never made). */
async function setupRewriteEnv(): Promise<RewriteRouteEnv> {
  const env = await setupTestEnv();
  const rewrite = vi.fn<(...args: unknown[]) => Promise<RewriteGrade | null>>(async (...args) => {
    const p = args[0] as { targetTerms: Array<{ term: string }> };
    return {
      criterionA: true,
      padding: false,
      terms: p.targetTerms.map((t) => ({ term: t.term, status: "used" as const })),
      feedback: "Good work.",
      gradedBy: "mock-model",
    };
  });
  vi.doMock("@/lib/openrouter.server", () => ({
    llmGradingConfigured: () => true,
    gradeShortAnswer: () => Promise.resolve(null),
    gradeRewrite: (...args: unknown[]) => rewrite(...args),
  }));
  return Object.assign(env, { rewrite });
}

/** A stubbed grader reply for one question: full marks unless overridden. */
function rewriteGradeFor(
  q: Question,
  opts: {
    criterionA?: boolean;
    padding?: boolean;
    terms?: Record<string, "used" | "missing" | "misused">;
    feedback?: string;
  } = {},
): RewriteGrade {
  const key = getAnswer(q.id)!;
  const terms = key.targetTerms!.map((t) => ({
    term: t.term,
    status: opts.terms?.[t.term] ?? ("used" as const),
  }));
  return {
    criterionA: opts.criterionA ?? true,
    padding: opts.padding ?? false,
    terms,
    feedback: opts.feedback ?? "Good work.",
    gradedBy: "mock-model",
  };
}

let env: RewriteRouteEnv;
afterEach(async () => {
  delete process.env.LLM_DAILY_CAP;
  delete process.env.GRADE_RATE_LIMIT;
  await env?.close();
});

async function grade(
  started: StartedAttempt,
  questionId: string,
  answer: string,
  extra: { phase?: 1 | 2 | "2"; skip?: boolean } = {},
) {
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
  return { status: res.status, body: await res.json() };
}

const rewritesOf = (started: StartedAttempt) => started.questions.filter((q) => q.type === "rewrite");
const usedBy = async (userId: string) =>
  (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce(
    (s, r) => s + r.count,
    0,
  );
const phaseRowFor = async (questionId: string) =>
  (await env.db.select().from(rewritePhases).where(eq(rewritePhases.questionId, questionId)))[0];
const resultFor = async (questionId: string) =>
  (await env.db.select().from(results).where(eq(results.questionId, questionId)))[0];

describe("rewrite phase 1", () => {
  it("3/3: 200, a results row with marks 3 and max 3, the phase row final, the discussion and no hint", async () => {
    env = await setupRewriteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q));

    const { status, body } = await grade(started, q.id, "A concise sentence using every term correctly.");
    expect(status).toBe(200);
    expect(body.saved).toBe(true);
    expect(body.attemptCompleted).toBe(false);
    expect(body.result.marksAwarded).toBe(3);
    expect(body.result.maxMarks).toBe(3);
    expect(body.result.hint).toBeUndefined();
    expect(body.result.discussion).toBeDefined();
    expect(body.result.discussion.modelSentences.length).toBeGreaterThan(0);
    expect(body.result.discussion.terms).toHaveLength(getAnswer(q.id)!.targetTerms!.length);

    const [row] = await env.db.select().from(results).where(eq(results.questionId, q.id));
    expect(row).toMatchObject({
      userId: user.id,
      questionId: q.id,
      marksAwarded: 3,
      maxMarks: 3,
      gradedBy: "llm",
    });
    const phaseRow = await phaseRowFor(q.id);
    expect(phaseRow.status).toBe("final");
    expect(phaseRow.phase1Marks).toBe(3);
    expect(phaseRow.recordedMark).toBe(3);
    expect(phaseRow.phase2Answer).toBeNull();
  });

  it("under 3: no results row, a phase1 phase row, a hint with only the missed terms, and no key material anywhere", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const key = getAnswer(q.id)!;
    const missed = key.targetTerms![0];
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q, { terms: { [missed.term]: "missing" } }));

    const { status, body } = await grade(started, q.id, "A sentence that misses one term.");
    expect(status).toBe(200);
    expect(body.saved).toBe(false);
    expect(body.phaseSaved).toBe(true);
    expect(body.attemptCompleted).toBe(false);
    expect(body.result.marksAwarded).toBe(2); // (a) + (c); (b) is all or nothing
    expect(body.result.hint).toEqual({
      terms: [{ term: missed.term, definition: missed.definition }],
    });
    expect(body.result.discussion).toBeUndefined();

    expect(await resultFor(q.id)).toBeUndefined();
    const phaseRow = await phaseRowFor(q.id);
    expect(phaseRow.status).toBe("phase1");
    expect(phaseRow.phase1Marks).toBe(2);
    expect(phaseRow.phase1TermOutcomes).toEqual(
      key.targetTerms!.map((t) => ({ conceptId: t.conceptId, correct: t.term === missed.term ? false : true })),
    );

    // no model sentence, no discussion and no marking notes anywhere in the response
    const keys = allKeys(body);
    for (const banned of ["modelSentences", "modelAnswer", "discussion", "markingNotes", "notes", "rubric"]) {
      expect(keys.has(banned), banned).toBe(false);
    }
  });

  it("every term used but criterion (c) lost: the hint has no terms and carries the lost criterion (FR-045)", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q, { padding: true }));

    const { status, body } = await grade(started, q.id, "A sentence that is padded with extra words that add nothing at all.");
    expect(status).toBe(200);
    expect(body.result.marksAwarded).toBe(2); // (a) + (b); (c) lost to padding
    expect(body.result.hint).toEqual({
      terms: [],
      lostCriterion: "c",
      criterionText: "Cut your sentence to 25 words or fewer.",
    });
  });

  it("criterion (b) is all or nothing: one missing term out of two loses the mark", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q =
      rewritesOf(started).find((x) => getAnswer(x.id)!.targetTerms!.length === 2) ?? rewritesOf(started)[0];
    const [t1, t2] = getAnswer(q.id)!.targetTerms!;
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q, { terms: { [t1.term]: "used", [t2.term]: "missing" } }));

    const { status, body } = await grade(started, q.id, "A sentence using one term but not the other.");
    expect(status).toBe(200);
    expect(body.result.marksAwarded).toBe(2); // one missing term costs the whole (b) mark
    const phaseRow = await phaseRowFor(q.id);
    expect(phaseRow.phase1Marks).toBe(2);
  });

  it("over 25 words: criterion (c) is lost whatever the stubbed grader says", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    // the grader says everything is fine; the word count alone must lose (c)
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q));
    const long = "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six";

    const { status, body } = await grade(started, q.id, long);
    expect(status).toBe(200);
    expect(body.result.marksAwarded).toBe(2); // (a) + (b); (c) lost to the word count
    expect(body.result.hint).toEqual({
      terms: [],
      lostCriterion: "c",
      criterionText: "Cut your sentence to 25 words or fewer.",
    });
  });

  it("empty and whitespace-only answers: 400, no grader call, no allowance slot used", async () => {
    env = await setupRewriteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];

    for (const empty of ["", "   ", "\n\t "]) {
      const { status, body } = await grade(started, q.id, empty);
      expect(status).toBe(400);
      expect(body.error).toBe("invalid_request");
    }
    expect(env.rewrite).not.toHaveBeenCalled();
    expect(await usedBy(user.id)).toBe(0);
    expect(await phaseRowFor(q.id)).toBeUndefined();
  });

  it("a second phase 1 for the same question: 409, no second grader call and no second allowance slot", async () => {
    env = await setupRewriteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const key = getAnswer(q.id)!;
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q, { terms: { [key.targetTerms![0].term]: "missing" } }));

    const first = await grade(started, q.id, "First attempt under three.");
    expect(first.status).toBe(200);
    expect(env.rewrite).toHaveBeenCalledTimes(1);

    const second = await grade(started, q.id, "Second attempt.");
    expect(second.status).toBe(409);
    expect(second.body.error).toBe("already_answered");
    expect(second.body.result.marksAwarded).toBe(2);
    expect(env.rewrite).toHaveBeenCalledTimes(1);
    expect(await usedBy(user.id)).toBe(1);
  });
});

describe("rewrite phase 2", () => {
  it("regression: the phase sent as the number 2 and as the string \"2\" are both treated as phase 2", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);

    // number 2
    const a = await startAttempt(REWRITE_UNIT);
    const qa = rewritesOf(a)[0];
    const keyA = getAnswer(qa.id)!;
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(qa, { terms: { [keyA.targetTerms![0].term]: "missing" } }));
    await grade(a, qa.id, "Phase one under three.");
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(qa));
    const num = await grade(a, qa.id, "Phase two as a number.", { phase: 2 });
    expect(num.status).toBe(200);
    expect(num.body.result.phase).toBe(2);

    // string "2"
    const b = await startAttempt(REWRITE_UNIT);
    const qb = rewritesOf(b)[0];
    const keyB = getAnswer(qb.id)!;
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(qb, { terms: { [keyB.targetTerms![0].term]: "missing" } }));
    await grade(b, qb.id, "Phase one under three.");
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(qb));
    const str = await grade(b, qb.id, "Phase two as a string.", { phase: "2" });
    expect(str.status).toBe(200);
    expect(str.body.result.phase).toBe(2);
  });

  it("phase 2 is capped at 2 even when the grader returns 3", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const key = getAnswer(q.id)!;
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q, { terms: { [key.targetTerms![0].term]: "missing" } }));
    await grade(started, q.id, "Phase one under three.");
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q)); // full marks in phase 2

    const { status, body } = await grade(started, q.id, "A perfect phase two sentence.", { phase: 2 });
    expect(status).toBe(200);
    expect(body.result.marksAwarded).toBe(2); // capped
    const [row] = await env.db.select().from(results).where(eq(results.questionId, q.id));
    expect(row.marksAwarded).toBe(2);
    const phaseRow = await phaseRowFor(q.id);
    expect(phaseRow.status).toBe("final");
    expect(phaseRow.phase2Marks).toBe(2);
    expect(phaseRow.recordedMark).toBe(2);
  });

  it("the recorded mark is the best of the two: 2 then 1 records 2, and 1 then 2 records 2", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);

    // phase 1 = 2, phase 2 = 1 -> recorded 2
    const a = await startAttempt(REWRITE_UNIT);
    const qa = rewritesOf(a)[0];
    const keyA = getAnswer(qa.id)!;
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(qa, { terms: { [keyA.targetTerms![0].term]: "missing" } }));
    await grade(a, qa.id, "Phase one scores two.");
    env.rewrite.mockResolvedValueOnce(
      rewriteGradeFor(qa, { terms: { [keyA.targetTerms![0].term]: "missing" }, padding: true }),
    );
    const r1 = await grade(a, qa.id, "Phase two scores one.", { phase: 2 });
    expect(r1.status).toBe(200);
    expect(r1.body.result.marksAwarded).toBe(1);
    const [rowA] = await env.db.select().from(results).where(eq(results.questionId, qa.id));
    expect(rowA.marksAwarded).toBe(2); // best of 2 and 1

    // phase 1 = 1, phase 2 = 2 -> recorded 2
    const b = await startAttempt(REWRITE_UNIT);
    const qb = rewritesOf(b)[0];
    const keyB = getAnswer(qb.id)!;
    env.rewrite.mockResolvedValueOnce(
      rewriteGradeFor(qb, { terms: { [keyB.targetTerms![0].term]: "missing" }, padding: true }),
    );
    await grade(b, qb.id, "Phase one scores one.");
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(qb, { terms: { [keyB.targetTerms![0].term]: "missing" } }));
    const r2 = await grade(b, qb.id, "Phase two scores two.", { phase: 2 });
    expect(r2.status).toBe(200);
    expect(r2.body.result.marksAwarded).toBe(2);
    const [rowB] = await env.db.select().from(results).where(eq(results.questionId, qb.id));
    expect(rowB.marksAwarded).toBe(2); // best of 1 and 2
  });

  it("phase 2 creates the results row, sets the phase row final, returns the discussion, and completes the attempt when it was the last question", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const qs = rewritesOf(started);
    for (const q of qs.slice(0, 4)) {
      env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q));
      const r = await grade(started, q.id, "A perfect concise sentence using every term.");
      expect(r.status).toBe(200);
      expect(r.body.saved).toBe(true);
    }
    const last = qs[4];
    const key = getAnswer(last.id)!;
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(last, { terms: { [key.targetTerms![0].term]: "missing" } }));
    const p1 = await grade(started, last.id, "Phase one under three.");
    expect(p1.status).toBe(200);
    expect(p1.body.attemptCompleted).toBe(false);
    expect(await resultFor(last.id)).toBeUndefined();

    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(last));
    const p2 = await grade(started, last.id, "Phase two completes the attempt.", { phase: 2 });
    expect(p2.status).toBe(200);
    expect(p2.body.saved).toBe(true);
    expect(p2.body.attemptCompleted).toBe(true);
    expect(p2.body.result.discussion).toBeDefined();

    const [row] = await env.db.select().from(results).where(eq(results.questionId, last.id));
    expect(row).toMatchObject({ marksAwarded: 2, maxMarks: 3, gradedBy: "llm" });
    const phaseRow = await phaseRowFor(last.id);
    expect(phaseRow.status).toBe("final");
    expect(phaseRow.phase2Answer).toBe("Phase two completes the attempt.");
    expect(phaseRow.recordedMark).toBe(2);
  });

  it("phase 2 is refused with no phase 1 row, after a 3/3 phase 1, and after a final phase 2 (409 with the stored result)", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const qs = rewritesOf(started);

    // no phase 1 row
    const r0 = await grade(started, qs[0].id, "Phase two with no phase one.", { phase: 2 });
    expect(r0.status).toBe(400);
    expect(r0.body.error).toBe("phase_refused");

    // after a 3/3 phase 1
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(qs[1]));
    const full = await grade(started, qs[1].id, "A perfect phase one.");
    expect(full.status).toBe(200);
    const r1 = await grade(started, qs[1].id, "Phase two after full marks.", { phase: 2 });
    expect(r1.status).toBe(409);
    expect(r1.body.error).toBe("already_answered");
    expect(r1.body.result.marksAwarded).toBe(3);

    // after a final phase 2
    const key = getAnswer(qs[2].id)!;
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(qs[2], { terms: { [key.targetTerms![0].term]: "missing" } }));
    await grade(started, qs[2].id, "Phase one under three.");
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(qs[2]));
    const done = await grade(started, qs[2].id, "Phase two final.", { phase: 2 });
    expect(done.status).toBe(200);
    const r2 = await grade(started, qs[2].id, "Another phase two.", { phase: 2 });
    expect(r2.status).toBe(409);
    expect(r2.body.error).toBe("already_answered");
    expect(r2.body.result.marksAwarded).toBe(2);
  });

  it("skip (phase 2, skip: true): 400 invalid_request, no grader call, no allowance slot, no results row, the phase row stays phase1, and a normal phase 2 afterwards still works (FR-042)", async () => {
    env = await setupRewriteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const key = getAnswer(q.id)!;
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q, { terms: { [key.targetTerms![0].term]: "missing" } }));
    const p1 = await grade(started, q.id, "Phase one scores two.");
    expect(p1.status).toBe(200);
    expect(env.rewrite).toHaveBeenCalledTimes(1);

    const skip = await grade(started, q.id, "", { phase: 2, skip: true });
    expect(skip.status).toBe(400);
    expect(skip.body.error).toBe("invalid_request");
    expect(env.rewrite).toHaveBeenCalledTimes(1); // no second grader call
    expect(await usedBy(user.id)).toBe(1); // only the phase 1 slot; the skip reserves nothing
    expect(await resultFor(q.id)).toBeUndefined(); // no results row
    const phaseRow = await phaseRowFor(q.id);
    expect(phaseRow.status).toBe("phase1"); // still phase 1
    expect(phaseRow.phase2Answer).toBeNull();

    // a normal phase 2 afterwards still works
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q));
    const p2 = await grade(started, q.id, "Phase two completes.", { phase: 2 });
    expect(p2.status).toBe(200);
    expect(p2.body.saved).toBe(true);
    const [row] = await env.db.select().from(results).where(eq(results.questionId, q.id));
    expect(row.marksAwarded).toBe(2);
    const finalRow = await phaseRowFor(q.id);
    expect(finalRow.status).toBe("final");
    expect(finalRow.phase2Answer).toBe("Phase two completes.");
  });
});

describe("concepts", () => {
  it("term outcomes come from phase 1 only: a term missed in phase 1 but used in phase 2 still counts as wrong, and a term used in phase 1 counts as correct", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const key = getAnswer(q.id)!;
    const terms = key.targetTerms!;
    const [missed, ...used] = terms;
    // phase 1: the first term missed, the rest used
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q, { terms: { [missed.term]: "missing" } }));
    await grade(started, q.id, "Phase one misses one term.");
    // phase 2: every term used now
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q));
    const p2 = await grade(started, q.id, "Phase two uses every term.", { phase: 2 });
    expect(p2.status).toBe(200);

    // the stored outcomes are the phase 1 ones, even though the missed term was used in phase 2
    const [row] = await env.db.select().from(results).where(eq(results.questionId, q.id));
    expect(row.conceptOutcomes).toEqual(
      terms.map((t) => ({ conceptId: t.conceptId, correct: t.conceptId !== missed.conceptId })),
    );

    const unit = getUnit(REWRITE_UNIT)!;
    const states = conceptProgress(unit, [
      {
        id: row.id,
        questionId: row.questionId,
        marks: row.marksAwarded,
        max: row.maxMarks,
        answeredAt: row.createdAt,
        conceptOutcomes: row.conceptOutcomes,
      },
    ]);
    expect(states.map((s) => s.conceptId)).toContain(missed.conceptId);
    expect(states.find((s) => s.conceptId === missed.conceptId)?.count).toBe(3);
    for (const t of used) expect(states.map((s) => s.conceptId)).not.toContain(t.conceptId);
  });

  it("existing units' concept progress is unchanged by the new code (one short check on an existing unit)", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(); // y11-physics-preliminary
    const mc = firstOf(started.questions, "mc");
    await grade(started, mc.id, String(wrongDisplayIndex(mc)));

    const unit = getUnit("y11-physics-preliminary")!;
    const rows = await env.db.select().from(results).where(eq(results.attemptId, started.attemptId));
    const states = conceptProgress(
      unit,
      rows.map((r) => ({
        id: r.id,
        questionId: r.questionId,
        marks: r.marksAwarded,
        max: r.maxMarks,
        answeredAt: r.createdAt,
      })),
    );
    expect(states).toHaveLength(1);
    expect(states[0].conceptId).toBe(mc.concept);
    expect(states[0].count).toBe(3);
  });
});

describe("degrade and self-mark", () => {
  it("model failure in phase 1: needsSelfMark, a self-mark token, the discussion and no hint; a phase 2 request afterwards is refused", async () => {
    env = await setupRewriteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    env.rewrite.mockResolvedValueOnce(null); // the model fails

    const { status, body } = await grade(started, q.id, "A sentence the model cannot grade.");
    expect(status).toBe(200);
    expect(body.saved).toBe(false);
    expect(body.result.needsSelfMark).toBe(true);
    expect(body.result.marksAwarded).toBeNull();
    expect(typeof body.selfMarkToken).toBe("string");
    expect(body.result.discussion).toBeDefined();
    expect(body.result.discussion.modelSentences.length).toBeGreaterThan(0);
    expect(body.result.discussion.terms).toHaveLength(getAnswer(q.id)!.targetTerms!.length);
    expect(body.result.hint).toBeUndefined();
    expect(await usedBy(user.id)).toBe(0); // the failed call refunds the slot

    // no phase row was created, so a phase 2 request is refused
    const p2 = await grade(started, q.id, "Phase two attempt.", { phase: 2 });
    expect(p2.status).toBe(400);
    expect(p2.body.error).toBe("phase_refused");
  });

  it("daily allowance used up: needsSelfMark with aiLimit, the discussion and no hint, and no second grader call", async () => {
    process.env.LLM_DAILY_CAP = "1";
    env = await setupRewriteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const qs = rewritesOf(started);
    // spend the one slot
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(qs[0]));
    await grade(started, qs[0].id, "A perfect concise sentence using every term.");
    expect(await usedBy(user.id)).toBe(1);

    const { status, body } = await grade(started, qs[1].id, "A sentence when the allowance is gone.");
    expect(status).toBe(200);
    expect(body.result.needsSelfMark).toBe(true);
    expect(body.aiLimit).toMatchObject({ reached: true });
    expect(typeof body.selfMarkToken).toBe("string");
    expect(body.result.discussion).toBeDefined();
    expect(body.result.hint).toBeUndefined();
    expect(env.rewrite).toHaveBeenCalledTimes(1); // no second grader call
  });

  it("model failure in phase 2: the grade route records nothing, and the best-of rule still applies when the student self-marks", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const key = getAnswer(q.id)!;
    const [t1, t2] = key.targetTerms!;
    // phase 1 = 2 (t1 missed)
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q, { terms: { [t1.term]: "missing" } }));
    const p1 = await grade(started, q.id, "Phase one scores two.");
    expect(p1.status).toBe(200);
    expect(p1.body.result.marksAwarded).toBe(2);

    // phase 2: the model fails
    env.rewrite.mockResolvedValueOnce(null);
    const p2 = await grade(started, q.id, "Phase two the model cannot grade.", { phase: 2 });
    expect(p2.status).toBe(200);
    expect(p2.body.result.needsSelfMark).toBe(true);
    expect(p2.body.result.discussion).toBeDefined();
    expect(await resultFor(q.id)).toBeUndefined(); // nothing recorded yet
    const phaseRow = await phaseRowFor(q.id);
    expect(phaseRow.status).toBe("phase1"); // still phase 1
    expect(phaseRow.phase1Marks).toBe(2);

    // the student self-marks phase 2 with ticks that add to 0: the recorded mark is still the best of the two (2)
    const { POST } = await import("@/app/api/results/self-mark/route");
    const res = await POST(
      post("/api/results/self-mark", {
        attemptId: started.attemptId,
        attemptToken: started.attemptToken,
        questionId: q.id,
        answer: "Phase two the model cannot grade.",
        correct: true,
        phase: "2",
        criterionA: false,
        criterionC: false,
        termTicks: { [t1.conceptId]: false, [t2.conceptId]: false },
        token: p2.body.selfMarkToken,
      }),
    );
    expect(res.status).toBe(200);
    const [row] = await env.db.select().from(results).where(eq(results.questionId, q.id));
    expect(row.marksAwarded).toBe(2); // best of phase 1 (2) and the self-marked phase 2 (0)
  });

  it("database down: the rewrite grade still answers without a 500", async () => {
    env = await setupRewriteEnv();
    await signedInStudent(env);
    env.databaseDown();
    const started = await startAttempt(REWRITE_UNIT);
    expect(started.persisted).toBe(false);

    const q = rewritesOf(started)[0];
    const { status, body } = await grade(started, q.id, "A sentence graded while the database is down.");
    expect(status).toBe(200);
    expect(body.result.needsSelfMark).toBe(true);
    expect(body.aiUnavailable).toBe(true);
    expect(body.degraded).toBe(true);
    expect(body.saved).toBe(false);
    expect(body.attemptCompleted).toBeNull();
    expect(body.result.discussion).toBeDefined();
    expect(typeof body.selfMarkToken).toBe("string");
    expect(env.rewrite).not.toHaveBeenCalled();

    // a phase 2 request is refused with 503, never a 500
    const p2 = await grade(started, q.id, "Phase two while down.", { phase: 2 });
    expect(p2.status).toBe(503);
    expect(p2.body.error).toBe("temporarily_unavailable");
  });
});

describe("resume and leaks", () => {
  it("the resume state holds nothing from the answer key before phase 1 is graded, only the hint after a phase 1 under 3, and the discussion once final", async () => {
    env = await setupRewriteEnv();
    const user = await signedInStudent(env);
    const started = await startAttempt(REWRITE_UNIT);
    const q = rewritesOf(started)[0];
    const key = getAnswer(q.id)!;
    const [t1] = key.targetTerms!;

    // before phase 1 is graded there is no phase row, so a resume builds nothing from the key
    const { getRewritePhase } = await import("@/lib/db/queries/rewrite-phases.server");
    for (const qid of started.questions.map((x) => x.id)) {
      expect(await getRewritePhase(env.db, user.id, started.attemptId, qid)).toBeNull();
    }

    // phase 1 under 3: the state carries only the hint (the missed terms), never the discussion
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q, { terms: { [t1.term]: "missing" } }));
    await grade(started, q.id, "Phase one under three.");
    const phaseRow = await phaseRowFor(q.id);
    const { rewriteResumeState } = await import("@/lib/grading.server");
    const hinted = rewriteResumeState(q.id, {
      status: phaseRow.status as "phase1" | "phase2" | "final",
      phase1Answer: phaseRow.phase1Answer,
      phase1Marks: phaseRow.phase1Marks,
      phase1TermOutcomes: phaseRow.phase1TermOutcomes ?? null,
      phase2Answer: phaseRow.phase2Answer,
      recordedMark: phaseRow.recordedMark,
    });
    expect(hinted.phase).toBe("phase1");
    expect(hinted.hint).toEqual({ terms: [{ term: t1.term, definition: t1.definition }] });
    expect(hinted.discussion).toBeUndefined();
    const hintedKeys = allKeys(hinted);
    for (const banned of ["modelSentences", "discussion", "markingNotes", "notes"]) {
      expect(hintedKeys.has(banned), banned).toBe(false);
    }

    // once final: the state carries the discussion
    env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q));
    await grade(started, q.id, "Phase two completes.", { phase: 2 });
    const finalRow = await phaseRowFor(q.id);
    const final = rewriteResumeState(q.id, {
      status: finalRow.status as "phase1" | "phase2" | "final",
      phase1Answer: finalRow.phase1Answer,
      phase1Marks: finalRow.phase1Marks,
      phase1TermOutcomes: finalRow.phase1TermOutcomes ?? null,
      phase2Answer: finalRow.phase2Answer,
      recordedMark: finalRow.recordedMark,
    });
    expect(final.phase).toBe("final");
    expect(final.discussion).toBeDefined();
    expect(final.discussion!.modelSentences.length).toBeGreaterThan(0);
    expect(final.discussion!.terms).toHaveLength(key.targetTerms!.length);
  });

  it("no answer text, model sentence, definition or marking note reaches console output on any of the paths above", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      env = await setupRewriteEnv();
      await signedInStudent(env);
      const started = await startAttempt(REWRITE_UNIT);
      const qs = rewritesOf(started);
      const q = qs[0];
      const key = getAnswer(q.id)!;
      const [t1] = key.targetTerms!;
      const answer = "A sentence that must never be logged.";
      const modelSentence = key.modelSentences?.[0] ?? "";
      const definition = t1.definition;
      const markingNote = key.markingNotes ?? "";

      // phase 1 3/3
      env.rewrite.mockResolvedValueOnce(rewriteGradeFor(q));
      await grade(started, q.id, answer);
      // phase 1 under 3, then phase 2
      // miss one of qs[1]'s OWN terms, so this really is a phase 1 under 3 followed by a phase 2
      const key1 = getAnswer(qs[1].id)!;
      env.rewrite.mockResolvedValueOnce(rewriteGradeFor(qs[1], { terms: { [key1.targetTerms![0].term]: "missing" } }));
      await grade(started, qs[1].id, "Another answer that must not be logged.");
      env.rewrite.mockResolvedValueOnce(rewriteGradeFor(qs[1]));
      await grade(started, qs[1].id, "Phase two answer.", { phase: 2 });
      // model failure
      env.rewrite.mockResolvedValueOnce(null);
      await grade(started, qs[3].id, "Model failure answer.");
      // database down
      env.databaseDown();
      await grade(started, qs[4].id, "Offline answer.");

      const output = [log, info, error, warn]
        .flatMap((s) => s.mock.calls.map((c) => c.map(String).join(" ")))
        .join("\n");
      for (const secret of [
        answer,
        "Another answer that must not be logged.",
        "Phase two answer.",
        "Model failure answer.",
        "Offline answer.",
        modelSentence,
        definition,
        markingNote,
      ]) {
        if (secret) expect(output, secret).not.toContain(secret);
      }
    } finally {
      log.mockRestore();
      info.mockRestore();
      error.mockRestore();
      warn.mockRestore();
    }
  });
});