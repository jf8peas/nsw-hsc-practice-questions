import { isValidElement, type ReactElement, type ReactNode } from "react";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { attempts } from "@/lib/db/schema";
import type { AttemptPayload } from "@/lib/drafts";
import { insertRewritePhase } from "@/lib/db/queries/rewrite-phases.server";
import { upsertRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";

let env: TestEnv;
afterEach(async () => {
  await env?.close();
});

const unit = UNITS.find((u) => u.id === "y11-physics-preliminary")!;
const [q1, q2, q3, q4] = unit.questions.slice(0, 4).map((q) => q.id);
const day = (n: number) => new Date(Date.UTC(2026, 0, n, 10));

async function load() {
  env = await setupTestEnv();
  return import("@/lib/db/queries/history.server");
}

async function attempt(userId: string, questionIds: string[], answered: string[], startedAt = day(1)) {
  const a = await seedAttempt(env.db, userId, { unitId: unit.id, questionIds, startedAt });
  for (const questionId of answered) {
    await seedResult(env.db, { attemptId: a.id, userId }, { unitId: unit.id, questionId });
  }
  return a;
}

describe("resume (FR-032)", () => {
  it("offers the latest incomplete attempt, listing only the questions still to answer", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const a = await attempt(me.id, [q1, q2, q3], [q1]);
    const r = (await h.unitHistory(env.db, me.id, unit.id)).resume!;
    expect(r).toMatchObject({ attemptId: a.id, answered: 1, total: 3 });
    expect(r.remainingIds).toEqual([q2, q3]);
  });

  it("skips retired questions", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    await attempt(me.id, [q1, "retired.q9", q2], [q1]);
    const r = (await h.unitHistory(env.db, me.id, unit.id)).resume!;
    expect(r.remainingIds).toEqual([q2]);
    expect(r).toMatchObject({ answered: 1, total: 2 });
  });

  it("completes (rather than offers) an attempt whose remaining questions are all retired", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const a = await attempt(me.id, [q1, "retired.q8", "retired.q9"], [q1]);
    const result = await h.unitHistory(env.db, me.id, unit.id);
    expect(result.resume).toBeNull();
    const [row] = await env.db.select().from(attempts).where(eq(attempts.id, a.id));
    expect(row.completedAt).toBeInstanceOf(Date);
    expect(result.attempts[0].completedAt).not.toBeNull();
    expect(result).toMatchObject({ completed: 1 });
  });

  it("offers only the latest incomplete attempt per unit", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    await attempt(me.id, [q1, q2], [q1], day(1));
    const newer = await attempt(me.id, [q3, q4], [q3], day(2));
    const r = (await h.unitHistory(env.db, me.id, unit.id)).resume!;
    expect(r.attemptId).toBe(newer.id);
  });

  it("starting a new attempt leaves the earlier one incomplete", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const older = await attempt(me.id, [q1, q2], [q1], day(1));
    await attempt(me.id, [q3, q4], [q3], day(2));
    const [row] = await env.db.select().from(attempts).where(eq(attempts.id, older.id));
    expect(row.completedAt).toBeNull();
    const history = await h.unitHistory(env.db, me.id, unit.id);
    expect(history.attempts).toHaveLength(2);
    expect(history.attempts.every((a) => a.completedAt === null)).toBe(true);
  });

  it("does not offer a completed attempt, or an attempt with no saved answers", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    await seedAttempt(env.db, me.id, { unitId: unit.id, questionIds: [q1], completedAt: day(1), startedAt: day(1) });
    await attempt(me.id, [q2], []); // nothing answered yet
    expect((await h.unitHistory(env.db, me.id, unit.id)).resume).toBeNull();
  });

  it("never offers another student's attempt", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    const other = await seedUser(env.db);
    await attempt(other.id, [q1, q2], [q1]);
    expect((await h.unitHistory(env.db, me.id, unit.id)).resume).toBeNull();
  });

  it("works on any device: the same offer every time", async () => {
    const h = await load();
    const me = await seedUser(env.db);
    await attempt(me.id, [q1, q2], [q1]);
    const first = (await h.unitHistory(env.db, me.id, unit.id)).resume;
    const second = (await h.unitHistory(env.db, me.id, unit.id)).resume;
    expect(second).toEqual(first);
    expect(first).not.toBeNull();
  });
});

describe("rewrite resume restores the display data and drafts (spec 006 FR-053/FR-054)", () => {
  const REWRITE_UNIT = "y12-economics-sentence-writing";
  const rewriteUnit = UNITS.find((u) => u.id === REWRITE_UNIT)!;

  /** Call the quiz page loader and return the Quiz component's `initial` payload. */
  async function quizPayload(attemptId: string): Promise<AttemptPayload> {
    const { default: QuizPage } = await import("@/app/unit/[unitId]/quiz/page");
    const el = await QuizPage({
      params: Promise.resolve({ unitId: REWRITE_UNIT }),
      searchParams: Promise.resolve({ attempt: attemptId }),
    });
    const find = (node: ReactNode): ReactElement | null => {
      if (isValidElement(node)) {
        const t = node.type as { name?: string };
        if (t.name === "Quiz") return node;
        const found = find((node.props as { children?: ReactNode }).children);
        if (found) return found;
      }
      if (Array.isArray(node)) for (const c of node) { const f = find(c); if (f) return f; }
      return null;
    };
    const quiz = find(el);
    const initial = (quiz?.props as { initial?: AttemptPayload }).initial;
    if (!initial) throw new Error("quiz payload not found");
    return initial;
  }

  it("restores the display data and the per-phase drafts for a final question", async () => {
    env = await setupTestEnv();
    const me = await seedUser(env.db);
    env.signedInAs(asSessionUser(me));
    const [q1, q2] = rewriteUnit.questions.slice(0, 2).map((q) => q.id);
    const a = await seedAttempt(env.db, me.id, { unitId: REWRITE_UNIT, questionIds: [q1, q2] });
    await insertRewritePhase(env.db, {
      attemptId: a.id,
      userId: me.id,
      unitId: REWRITE_UNIT,
      questionId: q1,
      status: "final",
      phase1Answer: "Phase one.",
      phase1Marks: 1,
      phase1Feedback: "Name the tax.",
      phase1TermOutcomes: [{ conceptId: "c-tariff", correct: false }],
      phase2Answer: "A tariff raised import prices.",
      phase2Marks: 2,
      phase2Feedback: "Better.",
      recordedMark: 2,
      displayData: {
        phase1: { spanByTerm: { "c-tariff": "taxed imports" } },
        phase2: { spanByTerm: { "c-tariff": "tariff" } },
        phase2TermOutcomes: [{ conceptId: "c-tariff", correct: true }],
        languageNote: { spelling: [{ wrong: "fromm", fix: "from" }] },
      },
    });
    await upsertRewriteDraft(env.db, me.id, a.id, REWRITE_UNIT, q1, 1, "phase one draft");
    await upsertRewriteDraft(env.db, me.id, a.id, REWRITE_UNIT, q1, 2, "phase two draft");

    const payload = await quizPayload(a.id);
    const rs = payload.rewriteState![q1];
    expect(rs.phase1CreditedSpans).toEqual([{ conceptId: "c-tariff", span: "taxed imports" }]);
    expect(rs.phase2CreditedSpans).toEqual([{ conceptId: "c-tariff", span: "tariff" }]);
    expect(rs.phase2TermOutcomes).toEqual([{ conceptId: "c-tariff", correct: true }]);
    expect(rs.languageNote).toEqual({ spelling: [{ wrong: "fromm", fix: "from" }] });
    expect(rs.phase1Draft).toBe("phase one draft");
    expect(rs.phase2Draft).toBe("phase two draft");
  });

  it("restores a server draft for a question with no phase row, with no key fields (FR-038, FR-053)", async () => {
    env = await setupTestEnv();
    const me = await seedUser(env.db);
    env.signedInAs(asSessionUser(me));
    const [q1, q2] = rewriteUnit.questions.slice(0, 2).map((q) => q.id);
    const a = await seedAttempt(env.db, me.id, { unitId: REWRITE_UNIT, questionIds: [q1, q2] });
    // q2 has a server draft but no phase row (phase 1 not yet graded)
    await upsertRewriteDraft(env.db, me.id, a.id, REWRITE_UNIT, q2, 1, "half-typed sentence");

    const payload = await quizPayload(a.id);
    const rs = payload.rewriteState![q2];
    expect(rs.phase).toBe("draft");
    expect(rs.phase1Draft).toBe("half-typed sentence");
    // no key fields before a phase 1 grade: no span, hint term, definition, model sentence or note
    expect(rs.phase1Answer).toBeUndefined();
    expect(rs.phase1CreditedSpans).toBeUndefined();
    expect(rs.phase2CreditedSpans).toBeUndefined();
    expect(rs.phase2TermOutcomes).toBeUndefined();
    expect(rs.languageNote).toBeUndefined();
    expect(rs.hint).toBeUndefined();
    expect(rs.discussion).toBeUndefined();
    expect(rs.phase1Marks).toBeUndefined();
  });
});
