// Synthetic units and a scriptable model port for the spec 002 tests, so they never depend on
// which real units have been tagged.
//
//   fx-ready  : concept-ready and explanations-complete. 12 MC (group "mc") + 12 short (group "sa"),
//               6 concepts, each tagging 2 MC and 2 short questions. A quiz draws 4 + 4 = 8.
//   fx-plain  : no concepts, no markers. 3 MC.
//
// Call `fixtureContent()` after `setupTestEnv()` and before importing the module under test.

import { vi } from "vitest";

import type { Db } from "@/lib/db/index.server";
import { results } from "@/lib/db/schema";
import type {
  CallFailed,
  ConceptLlmPort,
  ContentRejected,
  GeneratedSummary,
  ReviewVerdict,
} from "@/lib/concepts/port";
import type { Answer, AnswerSet, Concept, McQuestion, Question, ShortQuestion, Unit } from "@/lib/types";

export const READY = "fx-ready";
export const PLAIN = "fx-plain";

const pad = (n: number) => String(n).padStart(2, "0");
const SLUGS = ["a", "b", "c", "d", "e", "f"];

export const readyConcepts: Concept[] = SLUGS.map((s) => ({
  id: `${READY}.c-${s}`,
  description: `Concept ${s.toUpperCase()}`,
}));
/** conceptId for letter "a".."f" */
export const conceptId = (letter: string) => `${READY}.c-${letter}`;

function readyQuestions(): { questions: Question[]; answers: AnswerSet } {
  const questions: Question[] = [];
  const answers: AnswerSet = {};
  for (let i = 1; i <= 12; i++) {
    const concept = readyConcepts[(i - 1) % 6].id;
    const mcId = `${READY}.m${pad(i)}`;
    const mc: McQuestion = {
      id: mcId,
      group: "mc",
      type: "mc",
      prompt: `Multiple choice ${i}`,
      maxMarks: 1,
      options: [`Right ${i}`, `Wrong ${i}a`, `Wrong ${i}b`, `Wrong ${i}c`],
      concept,
    };
    questions.push(mc);
    answers[mcId] = {
      correctText: `Right ${i}`,
      rubric: [`MC rubric ${i}: the right option is right because of reason ${i}`],
      wrongExplanations: {
        [`Wrong ${i}a`]: `Explanation ${i}a: this is wrong because of reason A${i}.`,
        [`Wrong ${i}b`]: `Explanation ${i}b: this is wrong because of reason B${i}.`,
        [`Wrong ${i}c`]: `Explanation ${i}c: this is wrong because of reason C${i}.`,
      },
    };
  }
  for (let i = 1; i <= 12; i++) {
    const concept = readyConcepts[(i - 1) % 6].id;
    const sId = `${READY}.s${pad(i)}`;
    const sa: ShortQuestion = {
      id: sId,
      group: "sa",
      type: "short",
      prompt: `Short answer ${i}`,
      maxMarks: 2,
      concept,
    };
    questions.push(sa);
    answers[sId] = {
      modelAnswer: `Model answer for short ${i}: a long unique sentence that must never be copied into a concept summary ${i}.`,
      rubric: [`Rubric point one for short ${i}`, `Rubric point two for short ${i}`],
    };
  }
  return { questions, answers };
}

const ready = readyQuestions();

export const readyUnit: Unit = {
  id: READY,
  year: "Year 11",
  topic: "Fixtures",
  type: "Topic Quiz",
  title: "Ready fixture",
  description: "A concept-ready, explanations-complete fixture unit.",
  created: "2026-10-01",
  order: 1,
  quiz: {
    short: 4,
    mc: 4,
    passMark: 50,
    groups: [
      { group: "mc", n: 4 },
      { group: "sa", n: 4 },
    ],
  },
  conceptsReady: true,
  explanationsComplete: true,
  questions: ready.questions,
  concepts: readyConcepts,
  retired: {},
};

const plainQuestions: McQuestion[] = [1, 2, 3].map((i) => ({
  id: `${PLAIN}.m${pad(i)}`,
  group: "mc",
  type: "mc",
  prompt: `Plain multiple choice ${i}`,
  maxMarks: 1,
  options: [`P-right ${i}`, `P-wrong ${i}a`, `P-wrong ${i}b`, `P-wrong ${i}c`],
}));

export const plainUnit: Unit = {
  id: PLAIN,
  year: "Year 11",
  topic: "Fixtures",
  type: "Topic Quiz",
  title: "Plain fixture",
  description: "A unit that has not adopted concepts.",
  created: "2026-10-01",
  order: 2,
  quiz: { short: 0, mc: 3, passMark: 50 },
  questions: plainQuestions,
};

const plainAnswers: AnswerSet = Object.fromEntries(
  plainQuestions.map((q, i): [string, Answer] => [
    q.id,
    { correctText: `P-right ${i + 1}`, rubric: ["why"], wrongExplanations: { [`P-wrong ${i + 1}a`]: "should never be shown" } },
  ]),
);

export const fixtureUnits: Unit[] = [readyUnit, plainUnit];
export const fixtureAnswers: AnswerSet = { ...ready.answers, ...plainAnswers };

/** Replace the content registry and the answer key with the fixtures (and only them). */
export function fixtureContent(units: Unit[] = fixtureUnits, answers: AnswerSet = fixtureAnswers): void {
  vi.doMock("@/content", async () => {
    const actual = await vi.importActual<typeof import("@/content")>("@/content");
    const getUnit = (id: string) => units.find((u) => u.id === id);
    const getQuestion = (questionId: string) => {
      for (const unit of units) {
        const question = unit.questions.find((q) => q.id === questionId);
        if (question) return { unit, question };
      }
      return undefined;
    };
    const getConcept = (id: string) => {
      for (const unit of units) {
        const concept = unit.concepts?.find((c) => c.id === id);
        if (concept) return { unit, concept };
      }
      return undefined;
    };
    return {
      ...actual,
      UNITS: units,
      getUnit,
      getQuestion,
      getConcept,
      unitsByYear: () => [{ year: "Year 11", isEmpty: false, units }],
    };
  });
  vi.doMock("@/content/answers", () => ({ getAnswer: (id: string) => answers[id] }));
}

/** Insert a result at an exact time (the answer time that concept progress replays). */
export async function seedResultAt(
  db: Db,
  base: { attemptId: string; userId: string },
  unitId: string,
  questionId: string,
  marks: number,
  max: number,
  at: Date,
  overrides: Partial<typeof results.$inferInsert> = {},
) {
  const [row] = await db
    .insert(results)
    .values({
      ...base,
      unitId,
      questionId,
      answer: "an answer",
      marksAwarded: marks,
      maxMarks: max,
      gradedBy: "auto",
      createdAt: at,
      ...overrides,
    })
    .returning();
  return row;
}

// ---- scriptable model port ---------------------------------------------------

type Reply<T> = T | ((input: never) => T) | "call_failed" | "content_rejected";
type SummaryReply = { ok: true; value: GeneratedSummary };
type VerdictReply = { ok: true; verdict: ReviewVerdict };
type SvgReply = { ok: true; svg: string };

export const GOOD_BULLETS = [
  "First idea in general terms.",
  "Second idea, still general.",
  "Third idea to remember.",
];
export const GOOD_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><line x1="60" y1="340" x2="600" y2="340" stroke="black"/>' +
  '<line x1="60" y1="340" x2="60" y2="40" stroke="black"/><text x="300" y="380" font-size="16">Quantity</text>' +
  '<text x="10" y="30" font-size="16">Price</text><line x1="80" y1="320" x2="560" y2="80" stroke="blue"/></svg>';

export const passVerdict = (): VerdictReply => ({
  ok: true,
  verdict: { pass: true, reason: "", checks: { matches_concept: true, accurate: true, no_answer_leak: true, general_not_question_specific: true } },
});
export const failVerdict = (reason = "The summary is not accurate."): VerdictReply => ({
  ok: true,
  verdict: { pass: false, reason, checks: { matches_concept: true, accurate: false, no_answer_leak: true, general_not_question_specific: true } },
});

export interface FakePort extends ConceptLlmPort {
  /** Every call, in order. `method` is the port method; `model` is what the pipeline passed. */
  calls: Array<{ method: string; model: string; input: unknown }>;
  /** Queue replies for the next calls of a method (consumed in order, then the default applies). */
  queue: {
    generateSummary: Array<Reply<SummaryReply>>;
    reviewSummary: Array<Reply<VerdictReply>>;
    generateIllustration: Array<Reply<SvgReply>>;
    reviewIllustration: Array<Reply<VerdictReply>>;
  };
  count(method: string): number;
}

/** A model port that records every call and replies from queues, defaulting to "everything passes". */
export function fakeLlmPort(opts: { illustrate?: boolean } = {}): FakePort {
  const summaryDefault: SummaryReply = {
    ok: true,
    value: {
      bullets: GOOD_BULLETS,
      illustration: opts.illustrate ? { brief: "A labelled diagram of the idea.", alt: "A graph with two labelled axes." } : null,
    },
  };
  const calls: FakePort["calls"] = [];
  const queue: FakePort["queue"] = {
    generateSummary: [],
    reviewSummary: [],
    generateIllustration: [],
    reviewIllustration: [],
  };

  function resolve<T>(method: keyof FakePort["queue"], input: { model: string }, fallback: T): T | CallFailed | ContentRejected {
    calls.push({ method, model: input.model, input });
    const next = (queue[method] as Array<Reply<T>>).shift();
    if (next === undefined) return fallback;
    if (next === "call_failed") return { ok: false, kind: "call_failed", reason: "scripted call failure" };
    if (next === "content_rejected") return { ok: false, kind: "content_rejected", reason: "scripted content rejection" };
    return typeof next === "function" ? (next as (i: never) => T)(input as never) : (next as T);
  }

  return {
    calls,
    queue,
    count: (method) => calls.filter((c) => c.method === method).length,
    generateSummary: async (input) => resolve("generateSummary", input, summaryDefault) as never,
    reviewSummary: async (input) => resolve("reviewSummary", input, passVerdict()) as never,
    generateIllustration: async (input) =>
      resolve("generateIllustration", input, { ok: true, svg: GOOD_SVG } as SvgReply) as never,
    reviewIllustration: async (input) => resolve("reviewIllustration", input, passVerdict()) as never,
  };
}
