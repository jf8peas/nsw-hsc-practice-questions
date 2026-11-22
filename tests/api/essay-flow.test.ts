// The essay unit end to end through the real routes (spec 010 contracts/api.md B, C, E, F): start and resume,
// the scaffold (cap, required fields, lock), the essay draft, marking (word rules, clamp, one-economy cap, gaps,
// flags, retry, failure, daily limit, the lease), the stored result, and that no key text leaves the server before
// the student's own finished result. PGlite and a stubbed model; no network.

import { and, eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dailyAiUsage, essayPhases, results, rewriteDrafts, attempts } from "@/lib/db/schema";

import {
  E1,
  E2,
  E5,
  MODEL_WORD,
  NOTES,
  SCHOOL,
  ESSAY_UNIT,
  essayOfWords,
  goodScaffold,
  gradeEssay,
  markerEssayContent,
  saveEssayDraft,
  saveScaffold,
  setupEssayEnv,
  restoreEssayEnv,
  startEssay,
  startToWriting,
  type EssayEnv,
} from "../helpers/essay";
import { post, signedInStudent } from "../helpers/routes";
import { seedUser } from "../helpers/fixtures";
import { asSessionUser } from "../helpers/env";

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
const KEY_TEXT = [NOTES.slice(0, 40), SCHOOL.slice(0, 40), "NOTES-TOKEN-4471", "SCHOOL-TOKEN-9082"];
const noKey = (value: unknown) => {
  const s = JSON.stringify(value);
  for (const t of KEY_TEXT) expect(s).not.toContain(t);
};

describe("starting an essay", () => {
  it("starts the picked essay with the public question, the scaffold stage and no key", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    expect(a.status).toBe(201);
    expect(a.questions).toHaveLength(1);
    expect(a.questions[0]).toMatchObject({ id: E1, type: "essay", economy: "china", source: "Barker 2024 Trial, Q27" });
    expect(a.essayState).toMatchObject({ stage: "scaffold", locked: false });
    expect(JSON.stringify(a)).not.toContain("modelEssay");
    noKey(a);
    expect(await phase(a.attemptId)).toMatchObject({ status: "planning", scaffoldLockedAt: null });
  });

  it("refuses an essay that is not live and one that does not exist", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    expect((await startEssay(E2)).status).toBe(404);
    expect((await startEssay(`${ESSAY_UNIT}.e9`)).status).toBe(404);
  });

  it("resumes the open attempt and refuses a second essay while one is open", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    const again = await startEssay(E1);
    expect(again.status).toBe(200);
    expect(again.attemptId).toBe(a.attemptId);
    expect(again.resumed).toBe(true);
    const resumed = await startEssay();
    expect(resumed.attemptId).toBe(a.attemptId);
    const other = await startEssay(E5);
    expect(other.status).toBe(409);
    expect(other).toMatchObject({ error: "attempt_open", questionId: E1 });
  });

  it("has nothing to resume when no attempt is open", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const none = await startEssay();
    expect(none.status).toBe(404);
    expect(none.error).toBe("no_open_attempt");
  });

  it("ends two tabs starting at once on one attempt", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const [x, y] = await Promise.all([startEssay(E1), startEssay(E1)]);
    expect(x.attemptId).toBe(y.attemptId);
    expect(await env.db.select().from(attempts).where(eq(attempts.unitId, ESSAY_UNIT))).toHaveLength(1);
  });

  it("is unavailable, never guessed, when the database cannot be read", async () => {
    quiet();
    env = await setupEssayEnv();
    await signedInStudent(env);
    env.databaseDown();
    expect((await startEssay(E1)).status).toBe(503);
  });
});

describe("the scaffold", () => {
  it("saves under the cap, refuses over it without storing, and recounts the words itself", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    const ok = await saveScaffold(a, E1, "save", goodScaffold());
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ saved: true });
    const long = goodScaffold({ conclusion: { judgement: Array.from({ length: 260 }, () => "w").join(" "), weighs: "" } });
    const over = await saveScaffold(a, E1, "save", long);
    expect(over.status).toBe(400);
    expect(over.body).toMatchObject({ error: "over_cap", max: 250 });
    expect((await phase(a.attemptId)).scaffoldWords).toBe(ok.body.words);
  });

  it("refuses to start without a judgement or a body point, with the reasons", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    const empty = await saveScaffold(a, E1, "start", { intro: {}, body: [{}, {}, {}], conclusion: {} });
    expect(empty.status).toBe(400);
    expect(empty.body).toMatchObject({ error: "scaffold_invalid", reasons: ["no_judgement", "no_body_point"] });
    expect((await phase(a.attemptId)).status).toBe("planning");
  });

  it("starts writing: locks the plan, and refuses every later edit", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    const go = await saveScaffold(a, E1, "start", goodScaffold());
    expect(go.body).toMatchObject({ started: true, stage: "write", locked: true });
    const row = await phase(a.attemptId);
    expect(row.status).toBe("writing");
    expect(row.scaffoldLockedAt).not.toBeNull();
    expect((await saveScaffold(a, E1, "save", goodScaffold({ intro: { judgement: "changed" } }))).body).toMatchObject({ error: "scaffold_locked" });
    expect((await saveScaffold(a, E1, "start", goodScaffold())).status).toBe(409);
    expect((await phase(a.attemptId)).scaffold.intro.judgement).toBe("Globalisation has strongly lifted China's growth.");
  });

  it("is restored on resume, and the stage follows the lock", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    await saveScaffold(a, E1, "save", goodScaffold());
    const back = await startEssay();
    expect(back.essayState).toMatchObject({ stage: "scaffold", locked: false });
    expect((back.essayState as { scaffold: { intro: { judgement: string } } }).scaffold.intro.judgement).toContain("Globalisation");
    await saveScaffold(a, E1, "start", goodScaffold());
    expect((await startEssay()).essayState).toMatchObject({ stage: "write", locked: true });
  });

  it("rejects malformed bodies, a bad token and another student's attempt", async () => {
    env = await setupEssayEnv();
    const owner = await signedInStudent(env);
    const a = await startEssay(E1);
    const { POST } = await import("@/app/api/essay/scaffold/route");
    expect((await POST(post("/api/essay/scaffold", "not json"))).status).toBe(400);
    expect((await saveScaffold(a, E1, "nope" as never, goodScaffold())).status).toBe(400);
    expect((await saveScaffold(a, E1, "save", { intro: { judgement: 5 } })).status).toBe(400);
    expect((await saveScaffold({ ...a, attemptToken: "garbage" }, E1, "save", goodScaffold())).status).toBe(401);
    const intruder = await seedUser(env.db, { email: "intruder@example.com", googleSub: "g-intruder" });
    env.signedInAs(asSessionUser(intruder));
    expect((await saveScaffold(a, E1, "save", goodScaffold())).status).toBe(401);
    env.signedInAs(asSessionUser(owner));
    expect((await saveScaffold(a, E1, "save", goodScaffold())).status).toBe(200);
  });

  it("needs a session", async () => {
    env = await setupEssayEnv();
    env.signedOut();
    const { POST } = await import("@/app/api/essay/scaffold/route");
    expect((await POST(post("/api/essay/scaffold", {}))).status).toBe(401);
  });
});

describe("the essay draft", () => {
  it("is refused while the plan is editable and saved once writing, and comes back on resume", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    expect((await saveEssayDraft(a, E1, "early")).body).toEqual({ saved: false });
    await saveScaffold(a, E1, "start", goodScaffold());
    expect((await saveEssayDraft(a, E1, "my essay so far")).body).toEqual({ saved: true });
    expect((await startEssay()).essayState).toMatchObject({ stage: "write", draft: "my essay so far" });
  });

  it("allows an 8000-character draft and cuts anything longer", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    await saveEssayDraft(a, E1, "x".repeat(9000));
    const row = (await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.attemptId, a.attemptId)))[0];
    expect(row.phase1Draft).toHaveLength(8000);
  });

  it("refuses a second phase", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    const { POST } = await import("@/app/api/rewrite/draft/route");
    const res = await POST(post("/api/rewrite/draft", { attemptId: a.attemptId, attemptToken: a.attemptToken, questionId: E1, phase: 2, draft: "x" }));
    expect(res.status).toBe(400);
  });
});

describe("marking an essay", () => {
  it("marks, stores everything, writes the result row, completes the attempt and shows the model essay", async () => {
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    const a = await startToWriting();
    await saveEssayDraft(a, E1, "draft");
    const res = await gradeEssay(a, E1, essayOfWords(700));
    expect(res.status).toBe(200);
    const r = res.body.result;
    expect(r).toMatchObject({ finalMark: 14, band: 2, capped: false, words: 700 });
    expect(r.modelEssay).toContain(MODEL_WORD);
    expect(r.lift).toHaveLength(2);
    expect(r.gaps[0]).toMatchObject({ conceptId: `${ESSAY_UNIT}.c-china-wto` });
    expect(res.body).toMatchObject({ saved: true, attemptCompleted: true });

    const row = await phase(a.attemptId);
    expect(row).toMatchObject({ status: "finished", rawMark: 14, band: 2, finalMark: 14, coversBoth: true, markingStartedAt: null, promptVersion: "essay-pilot-2" });
    expect(row.criteria?.assessment.verdict).toBe("developing");
    expect(row.usedWell).toEqual([`${ESSAY_UNIT}.c-skill-judgement`]);
    const res0 = (await env.db.select().from(results).where(eq(results.userId, user.id)))[0];
    expect(res0).toMatchObject({ marksAwarded: 14, maxMarks: 20, gradedBy: "llm", unitId: ESSAY_UNIT });
    expect(res0.conceptOutcomes).toEqual([
      { conceptId: `${ESSAY_UNIT}.c-china-wto`, correct: false },
      { conceptId: `${ESSAY_UNIT}.c-skill-judgement`, correct: true },
    ]);
    expect((await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.attemptId, a.attemptId)))).toHaveLength(0);
    expect(await used(user.id)).toBe(1);
  });

  it("refuses 599 and 801 words before any slot or marker call, and the empty essay", async () => {
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    const a = await startToWriting();
    const short = await gradeEssay(a, E1, essayOfWords(599));
    expect(short).toMatchObject({ status: 400, body: { error: "essay_too_short", words: 599, min: 600, max: 800 } });
    const long = await gradeEssay(a, E1, essayOfWords(801));
    expect(long).toMatchObject({ status: 400, body: { error: "essay_too_long", words: 801 } });
    expect((await gradeEssay(a, E1, "   ")).status).toBe(400);
    expect(await used(user.id)).toBe(0);
    expect(env.chat).not.toHaveBeenCalled();
    expect((await gradeEssay(a, E1, essayOfWords(600))).status).toBe(200);
  });

  it("accepts exactly 800 words", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    expect((await gradeEssay(a, E1, essayOfWords(800))).status).toBe(200);
  });

  it("refuses an essay while the plan is still being edited", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startEssay(E1);
    expect(await gradeEssay(a, E1, essayOfWords(650))).toMatchObject({ status: 409, body: { error: "scaffold_not_locked" } });
  });

  it("clamps a mark into its band and keeps the raw mark", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    const res = await gradeEssay(a, E1, essayOfWords(700, "[band:1]", "[mark:15]"));
    expect(res.body.result.finalMark).toBe(17);
    const row = await phase(a.attemptId);
    expect(row).toMatchObject({ rawMark: 15, finalMark: 17, band: 1 });
  });

  it("caps a one-economy answer to a two-economy question at 12, and only there", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const both = await startToWriting(E5);
    const capped = await gradeEssay(both, E5, essayOfWords(700, "[band:1]", "[mark:19]", "[nocover]"));
    expect(capped.body.result).toMatchObject({ finalMark: 12, capped: true });
    expect(await phase(both.attemptId)).toMatchObject({ rawMark: 19, finalMark: 12, coversBoth: false });

    const one = await startToWriting(E1);
    const free = await gradeEssay(one, E1, essayOfWords(700, "[band:1]", "[mark:19]", "[nocover]"));
    expect(free.body.result).toMatchObject({ finalMark: 19, capped: false });
  });

  it("drops gaps that are not on the concept list, keeps at most five, and removes used-well ids that are also gaps", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    const keys = ["china-wto", "china-fdi-bri", "china-soe", "china-hukou", "china-environment", "china-rebalancing"];
    env.chat.mockResolvedValueOnce({
      ok: true,
      finishReason: "stop",
      content: markerEssayContent({
        gaps: [{ concept: "made-up-concept", detail: "x" }, ...keys.map((k) => ({ concept: k, detail: `D-${k}` })), { concept: "china-wto", detail: "dup" }],
        used: ["china-wto", "skill-models", "not-a-concept"],
      }),
    });
    const res = await gradeEssay(a, E1, essayOfWords(700));
    const ids = res.body.result.gaps.map((g: { conceptId: string }) => g.conceptId);
    expect(ids).toEqual(keys.slice(0, 5).map((k) => `${ESSAY_UNIT}.c-${k}`));
    expect((await phase(a.attemptId)).usedWell).toEqual([`${ESSAY_UNIT}.c-skill-models`]);
  });

  it("keeps a flag only when its quote is in the essay and never states a replacement figure", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    env.chat.mockResolvedValueOnce({
      ok: true,
      finishReason: "stop",
      content: markerEssayContent({
        flags: [
          { quote: "China GDP was $90 trillion in 2020", why: "It was about 14.7 trillion." },
          { quote: "never written by the student", why: "invented" },
        ],
      }),
    });
    const essay = `${essayOfWords(690)} China GDP was $90 trillion in 2020 ok`;
    const res = await gradeEssay(a, E1, essay);
    expect(res.body.result.flags).toEqual([{ quote: "China GDP was $90 trillion in 2020", why: "This figure looks wrong; check it against a source." }]);
  });

  it("retries one malformed reply and uses the second", async () => {
    quiet();
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    const a = await startToWriting();
    env.chat.mockResolvedValueOnce({ ok: true, finishReason: "stop", content: "not json at all" });
    const res = await gradeEssay(a, E1, essayOfWords(700));
    expect(res.body.result.finalMark).toBe(14);
    expect(env.chat).toHaveBeenCalledTimes(2);
    expect(await used(user.id)).toBe(1);
  });

  it("returns the editable box when the marker fails twice: no mark, slot refunded, draft kept, lease cleared", async () => {
    quiet();
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    const a = await startToWriting();
    env.chat.mockResolvedValue({ ok: false, reason: "network" });
    const res = await gradeEssay(a, E1, essayOfWords(700));
    expect(res).toMatchObject({ status: 200, body: { notMarked: { reason: "marker_unavailable" }, saved: false } });
    expect(res.body.result).toBeUndefined();
    expect(await used(user.id)).toBe(0);
    const row = await phase(a.attemptId);
    expect(row).toMatchObject({ status: "writing", markingStartedAt: null, finalMark: null });
    expect((await env.db.select().from(results).where(eq(results.userId, user.id)))).toHaveLength(0);
    expect((await startEssay()).essayState).toMatchObject({ stage: "write", draft: essayOfWords(700) });
    // and a later try works
    env.chat.mockImplementation(async () => ({ ok: true, finishReason: "stop", content: markerEssayContent() }));
    expect((await gradeEssay(a, E1, essayOfWords(700))).body.result.finalMark).toBe(14);
  });

  it("treats a reply cut off at max_tokens as a failure", async () => {
    quiet();
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    env.chat.mockResolvedValue({ ok: true, finishReason: "length", content: markerEssayContent() });
    expect((await gradeEssay(a, E1, essayOfWords(700))).body.notMarked).toMatchObject({ reason: "marker_unavailable" });
  });

  it("never self-marks when marking is off (no key)", async () => {
    quiet();
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    delete process.env.OPENROUTER_API_KEY;
    const res = await gradeEssay(a, E1, essayOfWords(700));
    expect(res.body).toMatchObject({ notMarked: { reason: "marker_unavailable" } });
    expect(env.chat).not.toHaveBeenCalled();
  });

  it("holds the essay at the daily limit: come back tomorrow, drafts kept, no slot taken, no marker call", async () => {
    env = await setupEssayEnv();
    process.env.LLM_DAILY_CAP = "1";
    const user = await signedInStudent(env);
    const first = await startToWriting(E1);
    expect((await gradeEssay(first, E1, essayOfWords(700))).status).toBe(200);
    const second = await startToWriting(E5);
    env.chat.mockClear();
    const res = await gradeEssay(second, E5, essayOfWords(700));
    expect(res.body.notMarked).toMatchObject({ reason: "daily_limit" });
    expect(res.body.notMarked.resetsAt).toMatch(/T00:00:00/);
    expect(env.chat).not.toHaveBeenCalled();
    expect(await used(user.id)).toBe(1);
    const state = (await startEssay()).essayState as { stage: string; draft?: string; cap?: { resetsAt: string } };
    expect(state).toMatchObject({ stage: "write", draft: essayOfWords(700) });
    expect(state.cap?.resetsAt).toMatch(/T00:00:00/);
  });

  it("refuses a second marking while one is in flight, and ignores a stale lease", async () => {
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    await env.db.update(essayPhases).set({ markingStartedAt: new Date() }).where(eq(essayPhases.attemptId, a.attemptId));
    expect(await gradeEssay(a, E1, essayOfWords(700))).toMatchObject({ status: 409, body: { error: "marking_in_progress" } });
    expect(env.chat).not.toHaveBeenCalled();
    await env.db.update(essayPhases).set({ markingStartedAt: new Date(Date.now() - 120_000) }).where(eq(essayPhases.attemptId, a.attemptId));
    expect((await gradeEssay(a, E1, essayOfWords(700))).status).toBe(200);
  });

  it("answers a second submit of a finished essay with the stored result, never marking twice", async () => {
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    const a = await startToWriting();
    await gradeEssay(a, E1, essayOfWords(700));
    env.chat.mockClear();
    const again = await gradeEssay(a, E1, essayOfWords(700));
    expect(again.status).toBe(409);
    expect(again.body).toMatchObject({ error: "already_answered", result: { finalMark: 14 } });
    expect(env.chat).not.toHaveBeenCalled();
    expect(await used(user.id)).toBe(1);
  });

  it("is unavailable, never guessed, when the database cannot be read", async () => {
    quiet();
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    env.databaseDown();
    expect((await gradeEssay(a, E1, essayOfWords(700))).status).toBe(503);
  });

  it("lets a finished essay be redone as a new attempt, and the latest result stands", async () => {
    env = await setupEssayEnv();
    const user = await signedInStudent(env);
    const first = await startToWriting();
    await gradeEssay(first, E1, essayOfWords(700, "[band:3]", "[mark:10]"));
    const redo = await startEssay(E1);
    expect(redo.status).toBe(201);
    expect(redo.attemptId).not.toBe(first.attemptId);
    const rows = await env.db.select().from(results).where(and(eq(results.userId, user.id), eq(results.questionId, E1)));
    expect(rows).toHaveLength(1);
  });
});

describe("what reaches the browser", () => {
  it("never carries the marking notes, school criteria or model essay before the student's own finished result", async () => {
    quiet();
    env = await setupEssayEnv();
    await signedInStudent(env);
    for (const id of [E1, E5]) {
      const started = await startEssay(id);
      noKey(started);
      noKey(await startEssay());
      noKey((await saveScaffold(started, id, "save", goodScaffold())).body);
      noKey((await saveScaffold(started, id, "start", goodScaffold())).body);
      noKey((await saveEssayDraft(started, id, "draft")).body);
      noKey(await startEssay());
      env.chat.mockResolvedValueOnce({ ok: false, reason: "network" });
      env.chat.mockResolvedValueOnce({ ok: false, reason: "network" });
      const failed = await gradeEssay(started, id, essayOfWords(700));
      noKey(failed.body);
      expect(JSON.stringify(failed.body)).not.toContain(MODEL_WORD);
      expect(JSON.stringify(await startEssay())).not.toContain(MODEL_WORD);

      const done = await gradeEssay(started, id, essayOfWords(700));
      noKey(done.body);
      expect(JSON.stringify(done.body)).toContain(MODEL_WORD); // the student's own finished result
      // the marker's own words are shown; the notes and the school's criteria are not
      expect(JSON.stringify(done.body)).toContain("MARKER-BANDREASON-6631");
    }
  });

  it("sends the key to the model provider only, and rejects a reply that repeats it", async () => {
    quiet();
    env = await setupEssayEnv();
    await signedInStudent(env);
    const a = await startToWriting();
    const res = await gradeEssay(a, E1, essayOfWords(700));
    const sent = JSON.stringify(env.chat.mock.calls[0]![0]);
    expect(sent).toContain("NOTES-TOKEN-4471");
    expect(sent).toContain("SCHOOL-TOKEN-9082");
    expect(sent).not.toContain(MODEL_WORD);
    noKey(res.body);

    const b = await startToWriting(E5);
    const echo = markerEssayContent({ extra: { bandReason: `${NOTES} ${NOTES}` } });
    env.chat.mockResolvedValue({ ok: true, finishReason: "stop", content: echo });
    const failed = await gradeEssay(b, E5, essayOfWords(700));
    expect(failed.body.notMarked).toMatchObject({ reason: "marker_unavailable" });
    noKey(failed.body);
  });
});
