// The essay unit page's data and the gap rule through real marked results (spec 010 FR-001 to FR-005, FR-038 to
// FR-040): the live essays in the offered order, the latest mark, which essay is open, a gap clearing only on
// different essays, the missing-piece line, and a finished essay whose result row was lost being repaired.
// PGlite and a stubbed model; no network.

import { and, eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { attempts, results } from "@/lib/db/schema";

import {
  E1,
  E2,
  E5,
  ESSAY_UNIT,
  essayOfWords,
  gradeEssay,
  markerEssayContent,
  mockEssayContent,
  restoreEssayEnv,
  setupEssayEnv,
  startEssay,
  startToWriting,
  type EssayEnv,
} from "../helpers/essay";
import { signedInStudent } from "../helpers/routes";

let env: EssayEnv;
afterEach(async () => {
  restoreEssayEnv();
  vi.restoreAllMocks();
  await env?.close();
});

const WTO = `${ESSAY_UNIT}.c-china-wto`;
const data = async (userId: string) => {
  const { getUnit } = await import("@/content");
  const { loadEssayUnitData } = await import("@/lib/essay/progress.server");
  return loadEssayUnitData(env.db, userId, getUnit(ESSAY_UNIT)!);
};
const progress = async (userId: string) => {
  const { getUnit } = await import("@/content");
  const { loadConceptProgress } = await import("@/lib/db/queries/results.server");
  return loadConceptProgress(env.db, userId, getUnit(ESSAY_UNIT)!);
};
/** Mark one essay with a given set of gaps and used-well ids. */
async function finish(id: string, gaps: string[], used: string[]) {
  const a = await startToWriting(id);
  env.chat.mockResolvedValueOnce({ ok: true, finishReason: "stop", content: markerEssayContent({ gaps: gaps.map((g) => ({ concept: g, detail: `missing ${g}` })), used }) });
  const res = await gradeEssay(a, id, essayOfWords(700));
  expect(res.status).toBe(200);
  return a;
}

describe("the unit page's essays", () => {
  it("lists only live essays in the offered order, with the first unmarked one next up", async () => {
    env = await setupEssayEnv();
    mockEssayContent([E1, E2, E5]);
    const user = await signedInStudent(env);
    const d = await data(user.id);
    expect(d.essays.map((e) => e.question.id.split(".")[1])).toEqual(["e1", "e5", "e2"]);
    expect(d.essays.map((e) => e.nextUp)).toEqual([true, false, false]);
    expect(d.openAttempt).toBeNull();
    expect(JSON.stringify(d)).not.toContain("NOTES-TOKEN");
  });

  it("shows no essay that is not live", async () => {
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    expect((await data(user.id)).essays.map((e) => e.question.id)).toEqual([E1, E5]);
  });

  it("shows the latest mark, moves next up on, and a redo replaces the mark", async () => {
    env = await setupEssayEnv();
    mockEssayContent([E1, E2, E5]);
    const user = await signedInStudent(env);
    await finish(E1, [], []);
    let d = await data(user.id);
    expect(d.essays[0]).toMatchObject({ latest: { mark: 14, band: 2 }, nextUp: false });
    expect(d.essays[1].nextUp).toBe(true);

    const redo = await startToWriting(E1);
    await gradeEssay(redo, E1, essayOfWords(700, "[band:3]", "[mark:10]"));
    d = await data(user.id);
    expect(d.essays[0].latest).toMatchObject({ mark: 10, band: 3, attemptId: redo.attemptId });
  });

  it("marks the open essay, says which stage it is in, and allows only one open attempt", async () => {
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    const a = await startEssay(E1);
    let d = await data(user.id);
    expect(d.openAttempt).toMatchObject({ essayId: E1, attemptId: a.attemptId, stage: "scaffold" });
    expect(d.essays.find((e) => e.question.id === E1)!.open).toBe(true);
    await startToWriting(E1).catch(() => {});
    d = await data(user.id);
    expect(d.openAttempt?.stage).toBe("write");
    expect((await startEssay(E5)).status).toBe(409);
  });
});

describe("gaps in Things I need to know", () => {
  it("lists a gap with count 2 and its missing-piece line", async () => {
    env = await setupEssayEnv();
    mockEssayContent([E1, E2, E5]);
    const user = await signedInStudent(env);
    await finish(E1, ["china-wto"], []);
    expect((await progress(user.id)).map((c) => [c.conceptId, c.count])).toEqual([[WTO, 2]]);
    expect((await data(user.id)).gapDetails[WTO]).toBe("missing china-wto");
  });

  it("clears after two later essays use it correctly, never on a redo of the essay that raised it", async () => {
    env = await setupEssayEnv();
    mockEssayContent([E1, E2, E5]);
    const user = await signedInStudent(env);
    await finish(E1, ["china-wto"], []);
    await finish(E1, [], ["china-wto"]); // a redo of e1 does not count
    expect((await progress(user.id)).map((c) => c.count)).toEqual([2]);
    await finish(E5, [], ["china-wto"]);
    expect((await progress(user.id)).map((c) => c.count)).toEqual([1]);
    await finish(E2, [], ["china-wto"]);
    expect(await progress(user.id)).toEqual([]);
  });

  it("is raised again by a miss on another essay", async () => {
    env = await setupEssayEnv();
    mockEssayContent([E1, E2, E5]);
    const user = await signedInStudent(env);
    await finish(E1, ["china-wto"], []);
    await finish(E5, [], ["china-wto"]);
    await finish(E2, ["china-wto"], []);
    expect((await progress(user.id)).map((c) => c.count)).toEqual([2]);
  });

  it("tracks nothing for an essay with no gaps and no concepts used well", async () => {
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    await finish(E1, [], []);
    expect(await progress(user.id)).toEqual([]);
  });
});

describe("a finished essay whose result row was lost", () => {
  it("is repaired, so it cannot leave an attempt open and block every other essay", async () => {
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    const a = await finish(E1, [], []);
    // simulate a failed result save: no results row and the attempt still open
    await env.db.delete(results).where(eq(results.attemptId, a.attemptId));
    await env.db.update(attempts).set({ completedAt: null }).where(eq(attempts.id, a.attemptId));

    const next = await startEssay(E5);
    expect(next.status).toBe(201);
    const rows = await env.db.select().from(results).where(and(eq(results.userId, user.id), eq(results.questionId, E1)));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ marksAwarded: 14, maxMarks: 20 });
    expect((await env.db.select().from(attempts).where(eq(attempts.id, a.attemptId)))[0].completedAt).not.toBeNull();
  });
});
