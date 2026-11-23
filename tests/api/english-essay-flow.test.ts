// The English essay unit end to end through the real routes (spec 011 US1): start, scaffold save and lock, draft, grade,
// result; resume at every stage; one marking per attempt; Redo creates a new attempt and the latest mark replaces the unit
// display without deleting history; and that no key text leaves the server before the student's own finished result.
// PGlite and a stubbed model; no network.

import { and, desc, eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { attempts, essayPhases, results } from "@/lib/db/schema";
import { latestEnglishEssayMarks } from "@/lib/db/queries/english-essay-phases.server";

import {
  ENGLISH_UNIT,
  E1,
  E2,
  MODEL_WORD,
  essayOfWords,
  goodEnglishScaffold,
  gradeEnglish,
  restoreEnglishEnv,
  saveEnglishDraft,
  saveEnglishScaffold,
  setupEnglishEnv,
  startEnglish,
  startEnglishToWriting,
  type EnglishEnv,
} from "../helpers/english-essay";
import { signedInStudent } from "../helpers/routes";

let env: EnglishEnv;
afterEach(async () => {
  restoreEnglishEnv();
  vi.restoreAllMocks();
  await env?.close();
});

const SECRETS = ["ENOTES-TOKEN-5521", "markingNotes", "conceptTags", "EMARKER-NOT-A-SECRET-PLACEHOLDER"].filter((s) => !s.includes("PLACEHOLDER"));
const noKey = (value: unknown) => {
  const s = JSON.stringify(value);
  for (const t of SECRETS) expect(s).not.toContain(t);
};

describe("the whole rehearsal", () => {
  it("plans, writes, submits once and sees the finished result with the model essay", async () => {
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);

    const started = await startEnglish(E1);
    expect(started.status).toBe(201);
    expect(started.englishEssayState).toMatchObject({ stage: "scaffold", locked: false });
    noKey(started);

    const saved = await saveEnglishScaffold(started, E1, "save", goodEnglishScaffold());
    expect(saved.status).toBe(200);
    const locked = await saveEnglishScaffold(started, E1, "start", goodEnglishScaffold());
    expect(locked.body).toMatchObject({ started: true, stage: "write", locked: true });
    noKey([saved, locked]);

    expect((await saveEnglishDraft(started, E1, "half an essay")).body).toEqual({ saved: true });
    const graded = await gradeEnglish(started, E1, essayOfWords(920, "[band:2]", "[mark:15]"));
    expect(graded.status).toBe(200);
    expect(graded.body).toMatchObject({ saved: true, attemptCompleted: true });
    expect(graded.body.result).toMatchObject({ finalMark: 15, finalBand: 2, words: 920 });
    expect(graded.body.result.modelEssay).toContain(MODEL_WORD);
    expect(graded.body.result.plan.thesis).toContain("facing loss together");
    noKey(graded.body);

    expect((await env.db.select().from(attempts).where(eq(attempts.userId, user.id)))[0]!.completedAt).not.toBeNull();
    expect(env.chat).toHaveBeenCalledTimes(1);
  });

  it("refuses a second try within the finished attempt", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    await gradeEnglish(a, E1, essayOfWords(900));
    const again = await gradeEnglish(a, E1, essayOfWords(900));
    expect(again.status).toBe(409);
    expect(again.body.error).toBe("already_answered");
    expect(env.chat).toHaveBeenCalledTimes(1);
    // and the plan can no longer be touched: the attempt is complete, so it is no longer an attempt that can be edited
    expect((await saveEnglishScaffold(a, E1, "save", goodEnglishScaffold())).status).toBe(404);
  });
});

describe("resume at every stage", () => {
  it("maps planning to scaffold, writing to write with the draft, and finished to the result", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglish(E1);
    await saveEnglishScaffold(a, E1, "save", goodEnglishScaffold());
    const planning = await startEnglish();
    expect(planning.englishEssayState).toMatchObject({ stage: "scaffold", locked: false });
    expect((planning.englishEssayState as { scaffold: { thesis: string } }).scaffold.thesis).toContain("facing loss together");

    await saveEnglishScaffold(a, E1, "start", goodEnglishScaffold());
    await saveEnglishDraft(a, E1, "my draft so far");
    const writing = await startEnglish();
    expect(writing.englishEssayState).toMatchObject({ stage: "write", locked: true, draft: "my draft so far" });
    noKey(writing);

    await gradeEnglish(a, E1, essayOfWords(900));
    // a finished attempt completes: there is no open attempt, so a bare resume finds nothing
    expect((await startEnglish()).error).toBe("no_open_attempt");
  });

  it("never restores a marking lease as a marking screen", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    await env.db.update(essayPhases).set({ markingStartedAt: new Date() }).where(eq(essayPhases.attemptId, a.attemptId));
    const back = await startEnglish();
    expect(back.englishEssayState).toMatchObject({ stage: "write" });
    expect(JSON.stringify(back.englishEssayState)).not.toMatch(/marking|lease/i);
  });

  it("heals a finished essay whose result row was never saved, so it cannot block the next essay", async () => {
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    const a = await startEnglishToWriting();
    await gradeEnglish(a, E1, essayOfWords(900, "[mark:14]"));
    // simulate a failed result save: remove the result row and reopen the attempt
    await env.db.delete(results).where(eq(results.attemptId, a.attemptId));
    await env.db.update(attempts).set({ completedAt: null }).where(eq(attempts.id, a.attemptId));
    const next = await startEnglish(E2);
    expect(next.status).toBe(201);
    const rows = await env.db.select().from(results).where(and(eq(results.attemptId, a.attemptId), eq(results.userId, user.id)));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ marksAwarded: 14, maxMarks: 20 });
  });
});

describe("Redo and the latest mark", () => {
  it("creates a new attempt and the latest final mark replaces the unit display, keeping history", async () => {
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    const first = await startEnglishToWriting();
    await gradeEnglish(first, E1, essayOfWords(900, "[mark:10]", "[band:3]"));
    let latest = await latestEnglishEssayMarks(env.db, user.id, ENGLISH_UNIT);
    expect(latest.get(E1)).toMatchObject({ mark: 10, band: 3, attemptId: first.attemptId });

    const redo = await startEnglishToWriting(E1);
    expect(redo.attemptId).not.toBe(first.attemptId);
    expect(redo.status).toBe(201);
    await gradeEnglish(redo, E1, essayOfWords(900, "[mark:17]", "[band:1]"));
    latest = await latestEnglishEssayMarks(env.db, user.id, ENGLISH_UNIT);
    expect(latest.get(E1)).toMatchObject({ mark: 17, band: 1, attemptId: redo.attemptId });

    const all = await env.db.select().from(results).where(eq(results.userId, user.id)).orderBy(desc(results.createdAt));
    expect(all).toHaveLength(2);
  });

  it("uses the FINAL band for the display, not the marker's band", async () => {
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    const a = await startEnglishToWriting();
    await gradeEnglish(a, E1, essayOfWords(900, "[band:1]", "[mark:19]", "[focus:partly]"));
    const latest = await latestEnglishEssayMarks(env.db, user.id, ENGLISH_UNIT);
    expect(latest.get(E1)).toMatchObject({ mark: 12, band: 3 });
  });

  it("lets another essay start only after the open one is finished", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting(E1);
    expect((await startEnglish(E2)).status).toBe(409);
    await gradeEnglish(a, E1, essayOfWords(900));
    expect((await startEnglish(E2)).status).toBe(201);
  });
});
