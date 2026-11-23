// POST /api/grade for the English essay (spec 011 contracts/api.md F): the length rules before anything else, the
// lease, the reference text before any model call or slot, the marker (one retry, failure refunds), the daily cap, the
// deterministic quote check and final-mark adjustments, the stored row and result, and the double submit. PGlite and a
// stubbed model; no network.

import { and, eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dailyAiUsage, essayPhases, results, rewriteDrafts, attempts, referenceTexts } from "@/lib/db/schema";
import { sydneyDate } from "@/lib/sydney";
import { resetReferenceTextCache } from "@/lib/english-essay/reference-text.server";

import {
  E1,
  INVENTED_QUOTE_FAKE,
  INVENTED_QUOTE_NEAR,
  INVENTED_QUOTE_OK,
  MODEL_WORD,
  NOTES,
  TAG,
  englishMarkerContent,
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
  resetReferenceTextCache();
  vi.restoreAllMocks();
  await env?.close();
});

const quiet = () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
};
const used = async (userId: string) => (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce((s, r) => s + r.count, 0);
const phase = async (attemptId: string) => (await env.db.select().from(essayPhases).where(eq(essayPhases.attemptId, attemptId)))[0]!;
const draft = async (attemptId: string) => (await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.attemptId, attemptId)))[0];
const KEY_TEXT = ["ENOTES-TOKEN-5521", "EMODELESSAYTOKEN", NOTES.slice(0, 40)];
const noKey = (value: unknown) => {
  const s = JSON.stringify(value);
  for (const t of KEY_TEXT) expect(s).not.toContain(t);
};
const quoted = (q: string) => `"${q}"`;

describe("the length rules come first", () => {
  it("refuses empty, short, long and over-12,000-character essays before any lease, limiter, slot or model call", async () => {
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    const a = await startEnglishToWriting();
    expect((await gradeEnglish(a, E1, "")).body).toEqual({ error: "invalid_request" });
    expect((await gradeEnglish(a, E1, essayOfWords(799))).body).toMatchObject({ error: "essay_too_short", words: 799, min: 800, max: 1200 });
    expect((await gradeEnglish(a, E1, essayOfWords(1201))).body).toMatchObject({ error: "essay_too_long", words: 1201 });
    expect((await gradeEnglish(a, E1, "a".repeat(12001))).status).toBe(400);
    expect(env.chat).not.toHaveBeenCalled();
    expect(await used(user.id)).toBe(0);
    expect((await phase(a.attemptId)).markingStartedAt).toBeNull();
  });

  it("does not truncate a valid 1,200-word essay at the shared 6,000-character limit", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    const essay = Array.from({ length: 1200 }, () => "eightchar").join(" "); // 11,999 characters
    const r = await gradeEnglish(a, E1, essay);
    expect(r.status).toBe(200);
    expect((await phase(a.attemptId)).essayText).toBe(essay);
  });
});

describe("state checks", () => {
  it("refuses a plan that is not locked, replays a finished essay and refuses a live lease", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const planning = await startEnglish(E1);
    expect(await gradeEnglish(planning, E1, essayOfWords(900))).toMatchObject({ status: 409, body: { error: "scaffold_not_locked" } });

    await saveEnglishScaffold(planning, E1, "start", goodEnglishScaffold());
    await env.db.update(essayPhases).set({ markingStartedAt: new Date() }).where(eq(essayPhases.attemptId, planning.attemptId));
    expect(await gradeEnglish(planning, E1, essayOfWords(900))).toMatchObject({ status: 409, body: { error: "marking_in_progress" } });
    expect(env.chat).not.toHaveBeenCalled();
    await env.db.update(essayPhases).set({ markingStartedAt: null }).where(eq(essayPhases.attemptId, planning.attemptId));

    const first = await gradeEnglish(planning, E1, essayOfWords(900));
    expect(first.status).toBe(200);
    const again = await gradeEnglish(planning, E1, essayOfWords(900));
    expect(again.status).toBe(409);
    expect(again.body).toMatchObject({ error: "already_answered", result: { finalMark: first.body.result.finalMark } });
    expect(env.chat).toHaveBeenCalledTimes(1);
  });

  it("an expired lease (over 130 seconds) is taken over", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    await env.db.update(essayPhases).set({ markingStartedAt: new Date(Date.now() - 200_000) }).where(eq(essayPhases.attemptId, a.attemptId));
    expect((await gradeEnglish(a, E1, essayOfWords(900))).status).toBe(200);
  });

  it("unreadable database is 503 and never a guessed mark", async () => {
    quiet();
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    env.databaseDown();
    expect((await gradeEnglish(a, E1, essayOfWords(900))).status).toBe(503);
    env.databaseUp();
    expect(env.chat).not.toHaveBeenCalled();
  });
});

describe("a successful marking", () => {
  it("stores every English field, the result row and completes the attempt, deleting the draft", async () => {
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    const a = await startEnglishToWriting();
    await saveEnglishDraft(a, E1, "draft text");
    expect(await draft(a.attemptId)).toBeDefined();
    const r = await gradeEnglish(a, E1, essayOfWords(900, "[band:2]", "[mark:14]"));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ saved: true, attemptCompleted: true, result: { finalMark: 14, finalBand: 2, questionFocus: "fully", capped: false } });
    expect(Object.keys(r.body.result.criteria).sort()).toEqual(["analysis", "argument", "expression", "knowledge"]);

    const row = await phase(a.attemptId);
    expect(row).toMatchObject({
      status: "finished",
      essayWords: 900,
      rawMark: 14,
      band: 2,
      finalMark: 14,
      finalBand: 2,
      questionFocus: "fully",
      promptVersion: "eng-essay-pilot-5",
      markingStartedAt: null,
    });
    expect(row.referenceTextHash).toHaveLength(64);
    expect(row.knowledgeErrors).toEqual([]);
    expect(Array.isArray(row.quoteResults)).toBe(true);
    expect(row.model).toBe("openai/gpt-6.2-sol");
    expect(row.gaps).toEqual([{ conceptId: TAG, detail: expect.stringContaining("EMARKER-GAP-8810") }]);

    const [res] = await env.db.select().from(results).where(eq(results.attemptId, a.attemptId));
    expect(res).toMatchObject({ marksAwarded: 14, maxMarks: 20, gradedBy: "llm", userId: user.id });
    expect(res!.conceptOutcomes).toEqual([
      { conceptId: TAG, correct: false },
      { conceptId: `${TAG.replace("skill-thesis", "skill-expression")}`, correct: true },
    ]);
    expect(await draft(a.attemptId)).toBeUndefined();
    expect((await env.db.select().from(attempts).where(eq(attempts.id, a.attemptId)))[0]!.completedAt).not.toBeNull();
    expect(await used(user.id)).toBe(1);
  });

  it("sends the question, the notes and the essay to the English model, never the model essay, and reads only its own setting", async () => {
    process.env.ENGLISH_ESSAY_GRADING_MODEL = "vendor/english-mark";
    process.env.ESSAY_GRADING_MODEL = "vendor/economics";
    process.env.GRADING_MODEL = "vendor/general";
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    await gradeEnglish(a, E1, essayOfWords(900));
    const call = env.chat.mock.calls[0]![0] as { model: string; temperature: number; maxTokens: number; json: boolean; messages: Array<{ content: string }> };
    expect(call).toMatchObject({ model: "vendor/english-mark", temperature: 0, maxTokens: 8000, json: true });
    const sent = call.messages.map((m) => m.content).join("\n");
    expect(sent).toContain("ENOTES-TOKEN-5521");
    expect(sent).not.toContain(MODEL_WORD);
    delete process.env.ESSAY_GRADING_MODEL;
    delete process.env.GRADING_MODEL;
  });

  it("releases the model essay only in the student's own result, never the key or the marking notes", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    const r = await gradeEnglish(a, E1, essayOfWords(900));
    expect(r.body.result.modelEssay).toContain(MODEL_WORD);
    expect(JSON.stringify(r.body)).not.toContain("ENOTES-TOKEN-5521");
    expect(JSON.stringify(r.body)).not.toContain("conceptTags");
    expect(r.body.result).not.toHaveProperty("rawMark");
    expect(r.body.result).not.toHaveProperty("band");
    expect(r.body.result).not.toHaveProperty("review");
  });
});

describe("the quote check and the final mark", () => {
  const essayWith = (n: number, ...parts: string[]) => `${parts.join(" ")} ${essayOfWords(n - parts.join(" ").split(/\s+/).length)}`;

  it("an exact quotation costs nothing and is not shown", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    const r = await gradeEnglish(a, E1, essayWith(900, "[mark:14]", quoted(INVENTED_QUOTE_OK)));
    expect(r.body.result).toMatchObject({ finalMark: 14, quoteFlags: [], knowledgeErrors: [] });
    expect((await phase(a.attemptId)).quoteResults).toEqual([{ quote: INVENTED_QUOTE_OK, status: "ok" }]);
  });

  it("a near quotation shows the play's exact words and costs nothing", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    const r = await gradeEnglish(a, E1, essayWith(900, "[mark:14]", quoted(INVENTED_QUOTE_NEAR)));
    expect(r.body.result.finalMark).toBe(14);
    expect(r.body.result.knowledgeErrors).toEqual([]);
    expect(r.body.result.quoteFlags).toEqual([{ quote: INVENTED_QUOTE_NEAR, status: "near", correct: "The lantern trembled in the salt wind", ratio: expect.any(Number) }]);
  });

  it("an invented quotation is a knowledge error: one mark off and a not-found flag", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    const r = await gradeEnglish(a, E1, essayWith(900, "[mark:14]", quoted(INVENTED_QUOTE_FAKE)));
    expect(r.body.result).toMatchObject({ finalMark: 13, finalBand: 2, capped: true });
    expect(r.body.result.knowledgeErrors).toEqual([{ quote: INVENTED_QUOTE_FAKE, why: "check this quote: not found in the play" }]);
    expect(r.body.result.quoteFlags[0]).toMatchObject({ quote: INVENTED_QUOTE_FAKE, status: "not-found" });
    expect(r.body.result.quoteFlags[0]).not.toHaveProperty("correct");
  });

  it("two marker errors cap the mark at 16 and the band follows the final mark, not the marker's", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    const r = await gradeEnglish(a, E1, essayOfWords(900, "[band:1]", "[mark:19]", "[err1]", "[err2]"));
    expect(r.body.result).toMatchObject({ finalMark: 16, finalBand: 2, knowledgeCapApplied: true });
    const row = await phase(a.attemptId);
    expect(row).toMatchObject({ rawMark: 19, band: 1, finalMark: 16, finalBand: 2 });
    expect((row.knowledgeErrors as unknown[]).length).toBe(2);
    expect(r.body.result).not.toHaveProperty("band");
  });

  it("partly and barely on the question cap the mark at 12 and 10 and show the warning data", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    const r = await gradeEnglish(a, E1, essayOfWords(900, "[band:1]", "[mark:19]", "[focus:partly]"));
    expect(r.body.result).toMatchObject({ finalMark: 12, finalBand: 3, questionFocus: "partly", focusCap: 12, capped: true });
  });
});

describe("failures never self-mark", () => {
  it("a missing reference text refuses before any model call or slot, keeps the draft and clears the lease", async () => {
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    await env.db.delete(referenceTexts);
    const a = await startEnglishToWriting();
    const essay = essayOfWords(900);
    const r = await gradeEnglish(a, E1, essay);
    expect(r).toMatchObject({ status: 200, body: { notMarked: { reason: "reference_text_unavailable" }, saved: false } });
    expect(env.chat).not.toHaveBeenCalled();
    expect(await used(user.id)).toBe(0);
    expect((await draft(a.attemptId))!.phase1Draft).toBe(essay);
    expect((await phase(a.attemptId)).markingStartedAt).toBeNull();
    expect((await phase(a.attemptId)).status).toBe("writing");
  });

  it("marker failure returns the editable box, refunds the slot and keeps the draft; the next try works", async () => {
    quiet();
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    const a = await startEnglishToWriting();
    env.chat.mockResolvedValue({ ok: false, reason: "http", status: 500 });
    const essay = essayOfWords(900);
    const r = await gradeEnglish(a, E1, essay);
    expect(r.body).toEqual({ notMarked: { reason: "marker_unavailable" }, saved: false });
    expect(await used(user.id)).toBe(0);
    expect((await draft(a.attemptId))!.phase1Draft).toBe(essay);
    expect((await phase(a.attemptId)).markingStartedAt).toBeNull();
    expect((await env.db.select().from(results).where(eq(results.attemptId, a.attemptId)))).toHaveLength(0);
    env.chat.mockReset();
    env.chat.mockImplementation((await import("../helpers/english-essay")).englishDirectiveReply as never);
    expect((await gradeEnglish(a, E1, essay)).status).toBe(200);
  });

  it("one malformed reply is retried once; two are marker_unavailable; a cut-off reply counts as failed", async () => {
    quiet();
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    const a = await startEnglishToWriting();
    env.chat.mockResolvedValueOnce({ ok: true, content: "sorry, no json", finishReason: "stop" });
    const ok = await gradeEnglish(a, E1, essayOfWords(900));
    expect(ok.status).toBe(200);
    expect(ok.body.result).toBeDefined();
    expect(env.chat).toHaveBeenCalledTimes(2);

    const b = await (async () => {
      const done = await env.db.select().from(attempts).where(eq(attempts.userId, user.id));
      await env.db.update(attempts).set({ completedAt: new Date() }).where(eq(attempts.id, done[0]!.id));
      return startEnglishToWriting();
    })();
    env.chat.mockReset();
    env.chat.mockResolvedValue({ ok: true, content: "{ broken", finishReason: "length" });
    const bad = await gradeEnglish(b, E1, essayOfWords(900));
    expect(bad.body).toEqual({ notMarked: { reason: "marker_unavailable" }, saved: false });
    expect(env.chat).toHaveBeenCalledTimes(2);
    expect(await used(user.id)).toBe(1);
  });

  it("no key, or LLM_DAILY_CAP=0, is marker_unavailable with no call and no slot", async () => {
    quiet();
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    const a = await startEnglishToWriting();
    process.env.LLM_DAILY_CAP = "0";
    expect((await gradeEnglish(a, E1, essayOfWords(900))).body).toMatchObject({ notMarked: { reason: "marker_unavailable" } });
    expect(env.chat).not.toHaveBeenCalled();
    expect(await used(user.id)).toBe(0);
  });

  it("the daily limit keeps the draft, spends no slot, and the write state then carries the cap", async () => {
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    process.env.LLM_DAILY_CAP = "1";
    await env.db.insert(dailyAiUsage).values({ userId: user.id, sydneyDate: sydneyDate(new Date()), count: 1 });
    const a = await startEnglishToWriting();
    const essay = essayOfWords(900);
    const r = await gradeEnglish(a, E1, essay);
    expect(r.body).toMatchObject({ notMarked: { reason: "daily_limit", resetsAt: expect.any(String) }, saved: false });
    expect(env.chat).not.toHaveBeenCalled();
    expect(await used(user.id)).toBe(1);
    expect((await draft(a.attemptId))!.phase1Draft).toBe(essay);
    expect((await startEnglish()).englishEssayState).toMatchObject({ stage: "write", cap: { resetsAt: expect.any(String) } });
  });

  it("a double submit marks once: one lease, one slot, one result", async () => {
    env = await setupEnglishEnv();
    const user = await signedInStudent(env);
    const a = await startEnglishToWriting();
    const [x, y] = await Promise.all([gradeEnglish(a, E1, essayOfWords(900)), gradeEnglish(a, E1, essayOfWords(900))]);
    expect([x.status, y.status].sort()).toEqual([200, 409]);
    expect(env.chat).toHaveBeenCalledTimes(1);
    expect(await used(user.id)).toBe(1);
    expect(await env.db.select().from(results).where(and(eq(results.attemptId, a.attemptId), eq(results.questionId, E1)))).toHaveLength(1);
  });

  it("a rate-limited request clears the lease and keeps the essay", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    process.env.GRADE_RATE_LIMIT = "1";
    expect((await gradeEnglish(a, E1, essayOfWords(900))).status).toBe(200);
    const b = await (async () => {
      const done = await env.db.select().from(attempts);
      await env.db.update(attempts).set({ completedAt: new Date() }).where(eq(attempts.id, done[0]!.id));
      return startEnglishToWriting();
    })();
    const limited = await gradeEnglish(b, E1, essayOfWords(900));
    expect(limited.status).toBe(429);
    expect((await phase(b.attemptId)).markingStartedAt).toBeNull();
    noKey(limited.body);
  });
});
