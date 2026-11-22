// The comparative unit's first try through POST /api/attempts and POST /api/grade (spec 009 FR-001, FR-008 to FR-013,
// contracts/api.md): the question payload with every allowed text and no key, nine verdicts, the pick stored with
// the try, only picked texts reaching the marker, the word rules, and the two ways a try cannot be marked (neither
// self-marks, neither ends the question). PGlite and a stubbed model; no network.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dailyAiUsage, results, rewriteDrafts, unseenPhases } from "@/lib/db/schema";
import { limitsFor } from "@/lib/unseen/limits";
import { COMPARATIVE_SKILL_IDS } from "@/lib/unseen/skills";

import {
  CHOICE_Q,
  FIXED_Q,
  KEY,
  TEXTS,
  gradeComparative,
  restoreComparativeEnv,
  savePick,
  setupComparativeEnv,
  startComparative,
  type ComparativeEnv,
} from "../helpers/comparative";
import { FEEDBACK, GAP, GO_FURTHER, REASON, fillWords, markerContent9 } from "../helpers/unseen";
import { signedInStudent } from "../helpers/routes";
import { storeTexts } from "@/content/units/y12-english-advanced-unseen-texts/store-texts";

let env: ComparativeEnv;
afterEach(async () => {
  restoreComparativeEnv();
  vi.restoreAllMocks();
  await env?.close();
});

const quiet = () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
};
const phaseRow = async (q: string) => (await env.db.select().from(unseenPhases).where(eq(unseenPhases.questionId, q)))[0];
const used = async (userId: string) => (await env.db.select().from(dailyAiUsage).where(eq(dailyAiUsage.userId, userId))).reduce((s, r) => s + r.count, 0);
/** What the LAST model call was given (the quiz before it may have sent other texts). */
const sentToModel = () => JSON.stringify(env.chat.mock.calls.at(-1)![0]);
const wordsOf = (id: string) => {
  const t = storeTexts.find((x) => x.id === id)!;
  // a distinctive line of the text: the first body line / paragraph
  return t.body.kind === "poem" ? t.body.stanzas[0][0] : t.body.kind === "prose" ? t.body.paragraphs[0].slice(0, 60) : "";
};

async function startChoice() {
  const user = await signedInStudent(env);
  const first = await startComparative();
  await gradeComparative(first.started, FIXED_Q, fillWords(60));
  const second = await startComparative();
  return { user, ...second };
}

describe("starting a comparative quiz", () => {
  it("returns the question, every text it shows, and a write-stage state with no key and no pairing", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const { started, questionId, state } = await startComparative();
    expect(questionId).toBe(FIXED_Q);
    expect(state).toMatchObject({ stage: "write", pickLocked: false });
    expect((state.texts as Array<{ id: string }>).map((t) => t.id)).toEqual([TEXTS.A, TEXTS.V]);
    const wire = JSON.stringify(started);
    for (const secret of [KEY.model.slice(0, 40), "Skilful comparison", "pairing"]) expect(wire).not.toContain(secret);
    // the visual's written description never leaves the server
    expect(wire).not.toMatch(/"description"/);
  });

  it("a choice question shows the fixed text and every allowed text", async () => {
    env = await setupComparativeEnv();
    const { state, questionId } = await startChoice();
    expect(questionId).toBe(CHOICE_Q);
    expect((state.texts as Array<{ id: string }>).map((t) => t.id)).toEqual([TEXTS.A, TEXTS.B, TEXTS.V]);
  });
});

describe("a first try on a fixed pair", () => {
  it("marks it with nine verdicts, stores the try with no pick, and saves the result with the nine first-try outcomes", async () => {
    env = await setupComparativeEnv();
    const user = await signedInStudent(env);
    const { started } = await startComparative();
    const { status, body } = await gradeComparative(started, FIXED_Q, fillWords(60, "[mark:4]", "[miss:compares-texts]"));
    expect(status).toBe(200);
    expect(body.result).toMatchObject({ type: "comparative", phase: 1, marksAwarded: 4, maxMarks: 6, retryOffered: true, feedback: FEEDBACK, biggestGap: GAP });
    expect(body.result.skills.map((s: { id: string }) => s.id)).toEqual([...COMPARATIVE_SKILL_IDS]);
    expect(body.result.skills.find((s: { id: string }) => s.id === "compares-texts").met).toBe(false);
    expect(body.result.pick).toBeUndefined();
    expect(body.result.discussion).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain(KEY.model.slice(0, 40));
    const row = await phaseRow(FIXED_Q);
    expect(row).toMatchObject({ status: "try1", maxMarks: 6, try1Mark: 4, pickedTextIds: null });
    expect(row.try1PromptVersion).toMatch(/^comparative-pilot-/);
    expect(Object.keys(row.try1Verdicts)).toHaveLength(9);
    expect(await used(user.id)).toBe(1);
  });

  it("at full marks goes straight to the discussion: the model answer, no pairing on a fixed pair, nine concept outcomes", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const { started } = await startComparative();
    const { body } = await gradeComparative(started, FIXED_Q, fillWords(60));
    expect(body.result).toMatchObject({ phase: 1, marksAwarded: 6, recordedMark: 6, ending: "full_marks", goFurther: GO_FURTHER });
    expect(body.result.discussion).toEqual({ modelAnswer: KEY.model, modelWords: KEY.model.trim().split(/\s+/).length });
    expect(body.result.discussion.pairing).toBeUndefined();
    const res = (await env.db.select().from(results).where(eq(results.questionId, FIXED_Q)))[0];
    expect(res.conceptOutcomes).toHaveLength(9);
    // the seven keep spec 008's concept ids; the two comparison skills are this unit's own
    const ids = (res.conceptOutcomes as Array<{ conceptId: string }>).map((o) => o.conceptId);
    expect(ids.slice(0, 7).every((id) => id.startsWith("y12-english-advanced-unseen-texts.c-"))).toBe(true);
    expect(ids.slice(7)).toEqual(["y12-english-advanced-comparative-texts.c-compares-texts", "y12-english-advanced-comparative-texts.c-treats-both-in-depth"]);
  });

  it("refuses a pick on a fixed pair before any slot or model call", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const { started } = await startComparative();
    const { status, body } = await gradeComparative(started, FIXED_Q, fillWords(60), { pick: [TEXTS.A] });
    expect({ status, body }).toEqual({ status: 400, body: { error: "invalid_pick" } });
    expect(env.chat).not.toHaveBeenCalled();
    expect(await phaseRow(FIXED_Q)).toBeUndefined();
  });

  it("sends the marker both texts of the pair, one of them as its written description", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const { started } = await startComparative();
    await gradeComparative(started, FIXED_Q, fillWords(60));
    const sent = sentToModel();
    expect(sent).toContain(wordsOf(TEXTS.A).slice(0, 30).replace(/"/g, '\\"'));
    expect(sent).toContain("VISUAL TEXT: you cannot see the image");
  });
});

describe("a first try on a choice question", () => {
  it("needs a complete pick: an incomplete, repeated, disallowed or missing pick is refused with no marker call", async () => {
    env = await setupComparativeEnv();
    const { started, questionId } = await startChoice();
    const before = env.chat.mock.calls.length;
    for (const pick of [undefined, [], [TEXTS.B, TEXTS.V], [TEXTS.B, TEXTS.B], [TEXTS.A], ["nope"], "text"]) {
      const res = await gradeComparative(started, questionId, fillWords(60), pick === undefined ? {} : { pick });
      expect({ status: res.status, body: res.body }).toEqual({ status: 400, body: { error: "invalid_pick" } });
    }
    expect(env.chat.mock.calls.length).toBe(before);
    expect(await phaseRow(questionId)).toBeUndefined();
  });

  it("stores the pick with the try, echoes it, and sends the marker only the fixed text and the picked one", async () => {
    env = await setupComparativeEnv();
    const { started, questionId } = await startChoice();
    const { status, body } = await gradeComparative(started, questionId, fillWords(60, "[mark:3]"), { pick: [TEXTS.B] });
    expect(status).toBe(200);
    expect(body.result.pick).toEqual([TEXTS.B]);
    expect((await phaseRow(questionId)).pickedTextIds).toEqual([TEXTS.B]);
    const sent = sentToModel();
    expect(sent).toContain(wordsOf(TEXTS.A).slice(0, 30).replace(/"/g, '\\"'));
    expect(sent).toContain(wordsOf(TEXTS.B).slice(0, 30).replace(/"/g, '\\"'));
    // the unpicked allowed text is the visual: neither its description nor its heading reached the provider
    expect(sent).not.toContain("VISUAL TEXT");
    expect(sent).not.toContain(storeTexts.find((t) => t.id === TEXTS.V)!.heading);
  });

  it("picking the visual sends its written description, and not the other allowed text", async () => {
    env = await setupComparativeEnv();
    const { started, questionId } = await startChoice();
    await gradeComparative(started, questionId, fillWords(60), { pick: [TEXTS.V] });
    const sent = sentToModel();
    expect(sent).toContain("VISUAL TEXT: you cannot see the image");
    expect(sent).not.toContain(wordsOf(TEXTS.B).slice(0, 30).replace(/"/g, '\\"'));
  });

  it("a choice at full marks releases the pairing with the model answer, and the pick is stored in the final row", async () => {
    env = await setupComparativeEnv();
    const { started, questionId } = await startChoice();
    const { body } = await gradeComparative(started, questionId, fillWords(60), { pick: [TEXTS.V] });
    expect(body.result.discussion).toEqual({ modelAnswer: KEY.model, modelWords: KEY.model.trim().split(/\s+/).length, pairing: KEY.pairing });
    expect(await phaseRow(questionId)).toMatchObject({ status: "final", ending: "full_marks", pickedTextIds: [TEXTS.V] });
  });

  it("a saved draft pick is not the submitted pick: the grade request's pick is what is validated and stored", async () => {
    env = await setupComparativeEnv();
    const { started, questionId } = await startChoice();
    await savePick(started, questionId, [TEXTS.B]);
    await gradeComparative(started, questionId, fillWords(60, "[mark:3]"), { pick: [TEXTS.V] });
    expect((await phaseRow(questionId)).pickedTextIds).toEqual([TEXTS.V]);
  });
});

describe("the answer rules (as spec 008)", () => {
  it("refuses under 20 words and over 120% of the suggested length, before any limit, slot or call", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const { started } = await startComparative();
    const { max } = limitsFor(216);
    const short = await gradeComparative(started, FIXED_Q, fillWords(19));
    expect(short).toMatchObject({ status: 400, body: { error: "answer_too_short" } });
    const long = await gradeComparative(started, FIXED_Q, fillWords(max + 1));
    expect(long).toMatchObject({ status: 400, body: { error: "answer_too_long", maxWords: max } });
    expect(env.chat).not.toHaveBeenCalled();
    expect(await phaseRow(FIXED_Q)).toBeUndefined();
  });
});

describe("a try that cannot be marked (never self-marked, never ends the question)", () => {
  it("returns notMarked with the answer kept as the draft, the slot refunded and no mark, on a marker failure", async () => {
    env = await setupComparativeEnv();
    quiet();
    const user = await signedInStudent(env);
    const { started } = await startComparative();
    env.chat.mockResolvedValue({ ok: false, reason: "http", status: 503 });
    const { status, body } = await gradeComparative(started, FIXED_Q, fillWords(60));
    expect(status).toBe(200);
    expect(body).toEqual({ notMarked: { reason: "marker_unavailable", phase: 1 }, saved: false });
    expect(await phaseRow(FIXED_Q)).toBeUndefined();
    expect(await used(user.id)).toBe(0);
    const draft = (await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.questionId, FIXED_Q)))[0];
    expect(draft.phase1Draft).toBe(fillWords(60));
  });

  it("retries a reply missing a comparison verdict, then returns the good reply", async () => {
    env = await setupComparativeEnv();
    quiet();
    await signedInStudent(env);
    const { started } = await startComparative();
    const sevenOnly = JSON.parse(markerContent9(4, ["compares-texts"]));
    delete sevenOnly.skills["treats-both-in-depth"];
    env.chat
      .mockResolvedValueOnce({ ok: true, content: JSON.stringify(sevenOnly), finishReason: "stop" })
      .mockResolvedValueOnce({ ok: true, content: markerContent9(4, ["compares-texts"]), finishReason: "stop" });
    const { body } = await gradeComparative(started, FIXED_Q, fillWords(60));
    expect(env.chat).toHaveBeenCalledTimes(2);
    expect(body.result.skills).toHaveLength(9);
  });

  it("holds the question at the daily limit: notMarked daily_limit with the next Sydney midnight, no row", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    process.env.LLM_DAILY_CAP = "1";
    const { started } = await startComparative();
    await gradeComparative(started, FIXED_Q, fillWords(60, "[mark:4]"));
    const { body } = await gradeComparative(started, FIXED_Q, fillWords(60, "[mark:5]"), { phase: 2 });
    expect(body.notMarked).toMatchObject({ reason: "daily_limit", phase: 2 });
    expect(body.notMarked.resetsAt).toMatch(/T00:00:00\+1[01]:00$/);
  });

  it("answers 503 and records nothing when the database cannot be read, and never self-marks", async () => {
    env = await setupComparativeEnv();
    await signedInStudent(env);
    const { started } = await startComparative();
    env.databaseDown();
    const { status, body } = await gradeComparative(started, FIXED_Q, fillWords(60));
    expect(status).toBe(503);
    expect(body.error).toBe("temporarily_unavailable");
    env.databaseUp();
    expect(await phaseRow(FIXED_Q)).toBeUndefined();
  });
});

describe("what the log may hold", () => {
  it("never carries the answer, the key, a reason, the feedback or the pick's text", async () => {
    env = await setupComparativeEnv();
    const spies = [vi.spyOn(console, "info"), vi.spyOn(console, "error"), vi.spyOn(console, "warn"), vi.spyOn(console, "log")].map((s) => s.mockImplementation(() => {}));
    const { started, questionId } = await startChoice();
    await gradeComparative(started, questionId, fillWords(60), { pick: ["nope"] });
    await gradeComparative(started, questionId, fillWords(60, "[mark:3]"), { pick: [TEXTS.B] });
    const logged = spies.flatMap((s) => s.mock.calls.map((c) => c.join(" "))).join("\n");
    for (const secret of [REASON, FEEDBACK, GAP, KEY.model.slice(0, 40), "word word word"]) expect(logged).not.toContain(secret);
    expect(logged).toContain("outcome=invalid_pick");
  });
});
