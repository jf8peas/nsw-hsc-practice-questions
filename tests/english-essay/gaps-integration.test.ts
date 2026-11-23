// Gap outcomes and derived progress for the English essay unit (spec 011 FR-032 to FR-034, data-model §9): the results row
// carries on-list deduplicated gaps as misses (at most five, marker order) then on-list used-well ids as hits (at most eight,
// disjoint); off-list ids never persist; and a gap clears after two correct uses on later, DIFFERENT essays, with a redo of
// the raising essay ignored and nothing stored per student beyond the results. PGlite and a stubbed model; no network.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UNITS } from "@/content";
import { concepts } from "@/content/units/y12-english-essay-writing/concepts";
import { conceptProgress, type ConceptResult } from "@/lib/concepts/progress";
import { results } from "@/lib/db/schema";
import type { Unit } from "@/lib/types";

import {
  E1,
  E2,
  E3,
  englishMarkerContent,
  essayOfWords,
  gradeEnglish,
  restoreEnglishEnv,
  setupEnglishEnv,
  startEnglishToWriting,
  type EnglishEnv,
} from "../helpers/english-essay";
import { signedInStudent } from "../helpers/routes";

const U = "y12-english-essay-writing";
const id = (key: string) => `${U}.c-${key}`;

let env: EnglishEnv;
afterEach(async () => {
  restoreEnglishEnv();
  vi.restoreAllMocks();
  await env?.close();
});

const outcomes = async (attemptId: string) => (await env.db.select().from(results).where(eq(results.attemptId, attemptId)))[0]!.conceptOutcomes;

describe("what the results row stores", () => {
  it("gaps as misses first (deduped, on-list, at most five, marker order), then used-well as hits (on-list, at most eight, disjoint)", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    env.chat.mockResolvedValue({
      ok: true,
      finishReason: "stop",
      content: englishMarkerContent({
        gaps: [
          { concept: "skill-thesis", detail: "first" },
          { concept: "not-on-the-list", detail: "dropped" },
          { concept: "skill-thesis", detail: "duplicate" },
          { concept: "away-symbols", detail: "second" },
          { concept: "skill-expression", detail: "third" },
        ],
        used: ["skill-expression", "away-tom-mortality", "bogus-id", "away-tom-mortality", "away-coral-grief"],
      }),
    });
    await gradeEnglish(a, E1, essayOfWords(900));
    expect(await outcomes(a.attemptId)).toEqual([
      { conceptId: id("skill-thesis"), correct: false },
      { conceptId: id("away-symbols"), correct: false },
      { conceptId: id("skill-expression"), correct: false },
      { conceptId: id("away-tom-mortality"), correct: true },
      { conceptId: id("away-coral-grief"), correct: true },
    ]);
  });

  it("keeps at most five gaps and eight used-well ids", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    const a = await startEnglishToWriting();
    const skills = ["skill-thesis", "skill-answers-question", "skill-analysis-not-recount", "skill-technique-effect", "skill-dramatic-form", "skill-apt-evidence"];
    const aways = ["away-tom-mortality", "away-coral-grief", "away-gwen-fear", "away-class-migrants", "away-meg-independence", "away-harry-vic-acceptance", "away-storm-catalyst", "away-shakespeare-frame", "away-play-within-play"];
    env.chat.mockResolvedValue({
      ok: true,
      finishReason: "stop",
      content: englishMarkerContent({ gaps: skills.map((s) => ({ concept: s, detail: "d" })), used: aways }),
    });
    await gradeEnglish(a, E1, essayOfWords(900));
    const out = await outcomes(a.attemptId);
    expect(out!.filter((o) => !o.correct)).toHaveLength(5);
    expect(out!.filter((o) => o.correct)).toHaveLength(8);
  });
});

describe("clearing across essays", () => {
  // The spec example (data-model §9): e1 misses skill-thesis (2); a redo of e1 using it well is ignored (still 2); e2 using
  // it well takes it to 1; e3 using it well clears it. Real marking drives the results; the replay is the generic one.
  const finish = async (qid: string, gaps: Array<{ concept: string; detail: string }>, used: string[]) => {
    const a = await startEnglishToWriting(qid);
    env.chat.mockResolvedValue({ ok: true, finishReason: "stop", content: englishMarkerContent({ gaps, used }) });
    expect((await gradeEnglish(a, qid, essayOfWords(900))).status).toBe(200);
  };

  const replay = async (): Promise<ConceptResult[]> => {
    const rows = await env.db.select().from(results).orderBy(results.createdAt);
    return rows.map((r) => ({ id: r.id, questionId: r.questionId, marks: r.marksAwarded, max: r.maxMarks, answeredAt: r.createdAt, conceptOutcomes: r.conceptOutcomes ?? [] }));
  };
  const unit = (): Unit => ({ id: U, questions: [{ id: E1 }, { id: E2 }, { id: E3 }], concepts, conceptsClearOnOtherQuestions: true }) as unknown as Unit;
  const count = async (conceptKey: string) => conceptProgress(unit(), await replay()).find((c) => c.conceptId === id(conceptKey))?.count;

  it("a miss sets 2; a redo of the raising essay is ignored; two later different essays clear it", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    await finish(E1, [{ concept: "skill-thesis", detail: "thesis not sustained" }], []);
    expect(await count("skill-thesis")).toBe(2);

    await finish(E1, [], ["skill-thesis"]); // redo of e1: does not count
    expect(await count("skill-thesis")).toBe(2);

    await finish(E2, [], ["skill-thesis"]);
    expect(await count("skill-thesis")).toBe(1);

    await finish(E3, [], ["skill-thesis"]);
    expect(await count("skill-thesis")).toBeUndefined(); // cleared
  });

  it("a later miss re-raises it", async () => {
    env = await setupEnglishEnv();
    await signedInStudent(env);
    await finish(E1, [{ concept: "skill-thesis", detail: "d" }], []);
    await finish(E2, [], ["skill-thesis"]);
    expect(await count("skill-thesis")).toBe(1);
    await finish(E3, [{ concept: "skill-thesis", detail: "again" }], []);
    expect(await count("skill-thesis")).toBe(2);
  });

  it("the registered unit sets the same-question rule and clear-after 2 for every concept", () => {
    env = undefined as unknown as EnglishEnv; // no database in this one: the previous test's was already closed
    const live = UNITS.find((u) => u.id === U);
    // the unit registers only once an essay is live; the shipped content has none yet, so check the content directly
    if (live) expect(live.conceptsClearOnOtherQuestions).toBe(true);
    expect(concepts.every((c) => c.clearAfter === 2)).toBe(true);
  });
});
