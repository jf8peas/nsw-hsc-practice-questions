import { vi } from "vitest";

import type { AnswerSet } from "@/lib/types";
import { englishEssayConceptId } from "@/lib/english-essay/types";
import { referenceTexts } from "@/lib/db/schema";
import { sha256Hex } from "@/lib/english-essay/play-index";
import type { Db } from "@/lib/db/index.server";

import { post, startAttempt, type StartedAttempt } from "./routes";
import { setupTestEnv, type TestEnv } from "./env";
import type { ChatMock } from "./unseen";

// Test helpers for the English essay-writing unit (spec 011). No essay has shipped (all six are `live: false`), so
// these tests give the unit three live essays by mocking the generated questions and answers modules. EVERYTHING here
// is invented: the "play" is a short made-up passage, the notes and the model are tokens. No real Away line, marking
// note, pilot essay or model content appears in any helper (tasks.md T013).

export const ENGLISH_UNIT = "y12-english-essay-writing";
export const E1 = `${ENGLISH_UNIT}.e1`;
export const E2 = `${ENGLISH_UNIT}.e2`;
export const E3 = `${ENGLISH_UNIT}.e3`;
export const E4 = `${ENGLISH_UNIT}.e4`;

export const NOTES = "ENOTES-TOKEN-5521 a strong answer covers the lantern keeper, the salt wind and the harbour bell in detail";
export const MODEL_WORD = "EMODELESSAYTOKEN";
export const modelEssay = (): string => [MODEL_WORD, ...Array.from({ length: 999 }, (_, i) => `model${i}`)].join(" ");
export const TAG = `${ENGLISH_UNIT}.c-skill-thesis`;
export const AWAY_TAG = `${ENGLISH_UNIT}.c-away-symbols`;

export const KEYS: AnswerSet = Object.fromEntries(
  [E1, E2, E3].map((id) => [id, { rubric: [], englishEssay: { markingNotes: `${NOTES} (${id})`, modelEssay: modelEssay(), conceptTags: [TAG, AWAY_TAG] } }]),
);

/** An invented reference passage (NOT Away). Quote-check tests quote from or near it. */
export const INVENTED_PLAY = [
  "Title page and notes that are not part of the text.",
  "ACT ONE",
  "The lantern trembled in the salt wind and the keeper counted the hours until the harbour bell rang.",
  "Nobody on the jetty spoke of the ferry that never came home, but every window stayed lit.",
  "The moon is a patient clerk who writes down what the tide forgets.",
].join("\n");

export const INVENTED_QUOTE_OK = "the lantern trembled in the salt wind";
export const INVENTED_QUOTE_NEAR = "the lantern trembles in the salt wind";
export const INVENTED_QUOTE_FAKE = "the moon repaired every sorrow before dawn";

export async function seedReferenceText(db: Db, text: string = INVENTED_PLAY, id = "away"): Promise<string> {
  const hash = sha256Hex(text);
  await db.insert(referenceTexts).values({ id, content: text, contentHash: hash }).onConflictDoUpdate({
    target: referenceTexts.id,
    set: { content: text, contentHash: hash },
  });
  return hash;
}

export interface EnglishEnv extends TestEnv {
  chat: ChatMock;
}

const savedKey = process.env.OPENROUTER_API_KEY;
const saved = { cap: process.env.LLM_DAILY_CAP, model: process.env.ENGLISH_ESSAY_GRADING_MODEL };

/** Mocks the unit's content so e1 to e3 are live. Call BEFORE the routes (or @/content) are first imported. */
export function mockEnglishContent(liveIds: string[] = [E1, E2, E3]) {
  const questionsPath = "@/content/units/y12-english-essay-writing/questions";
  vi.doMock(questionsPath, async () => {
    const real = (await vi.importActual(questionsPath)) as { questions: Array<{ id: string; live: boolean }> };
    return { ...real, questions: real.questions.map((q) => ({ ...q, live: liveIds.includes(q.id) })) };
  });
  vi.doMock("@/content/units/y12-english-essay-writing/answers", () => ({ answers: KEYS }));
}

/** An essay of exactly `n` words (a directive such as [band:1] counts as a word, so tests can sit on the word rules). */
export function essayOfWords(n: number, ...directives: string[]): string {
  return [...Array.from({ length: Math.max(0, n - directives.length) }, () => "word"), ...directives].join(" ");
}

export interface EnglishMarkerOptions {
  band?: number;
  mark?: number;
  focus?: "fully" | "partly" | "barely";
  errors?: Array<{ quote: string; why: string }>;
  gaps?: Array<{ concept: string; detail: string }>;
  used?: string[];
  extra?: Record<string, unknown>;
}

/** A valid marker reply (contracts/replies.md §1). */
export function englishMarkerContent(o: EnglishMarkerOptions = {}): string {
  const reason = "EMARKER-REASON-3310";
  const c = (verdict: string) => ({ reason, verdict });
  return JSON.stringify({
    criteria: { argument: c("sound"), analysis: c("sound"), knowledge: c("developing"), expression: c("strong") },
    questionFocus: o.focus ?? "fully",
    questionFocusReason: "EMARKER-FOCUS-4410 engages the question's own terms.",
    knowledgeErrors: o.errors ?? [],
    band: o.band ?? 2,
    mark: o.mark ?? 14,
    bandReason: "EMARKER-BANDREASON-7731 detailed analysis with some controlled expression.",
    liftYourMark: ["EMARKER-LIFT-ONE-2281", "EMARKER-LIFT-TWO-2282"],
    gaps: o.gaps ?? [{ concept: "skill-thesis", detail: "EMARKER-GAP-8810 thesis named but not sustained" }],
    conceptsUsedWell: o.used ?? ["skill-expression"],
    ...(o.extra ?? {}),
  });
}

/**
 * The stub: reads directives from the student's essay in the prompt: [band:n], [mark:n], [focus:partly|barely],
 * [err1] and [err2] (each becomes a marker knowledge error quoting that token).
 */
export function englishDirectiveReply(...args: unknown[]) {
  const params = args[0] as { messages: Array<{ role: string; content: string }> };
  const user = params.messages.find((m) => m.role === "user")!.content;
  const essay = /"""\n([\s\S]*?)\n"""/.exec(user)?.[1] ?? user;
  const band = /\[band:(\d)\]/.exec(essay)?.[1];
  const mark = /\[mark:(\d+)\]/.exec(essay)?.[1];
  const focus = /\[focus:(partly|barely)\]/.exec(essay)?.[1] as "partly" | "barely" | undefined;
  const errors = ["[err1]", "[err2]"].filter((t) => essay.includes(t)).map((t, i) => ({ quote: t, why: `EERR-WHY-${i + 1} a distinct mistake` }));
  return Promise.resolve({
    ok: true as const,
    content: englishMarkerContent({
      ...(band ? { band: Number(band) } : {}),
      ...(mark ? { mark: Number(mark) } : {}),
      ...(focus ? { focus } : {}),
      errors,
    }),
    finishReason: "stop",
  });
}

export async function setupEnglishEnv(): Promise<EnglishEnv> {
  const env = await setupTestEnv();
  process.env.OPENROUTER_API_KEY = "test-key";
  const chat: ChatMock = vi.fn<(...args: unknown[]) => Promise<unknown>>(englishDirectiveReply);
  vi.doMock("@/lib/openrouter.server", () => ({
    llmGradingConfigured: () => Boolean(process.env.OPENROUTER_API_KEY),
    DEFAULT_MODEL: "mock-default",
    gradeShortAnswer: () => Promise.resolve(null),
    gradeRewrite: () => Promise.resolve(null),
    chatCompletion: (...args: unknown[]) => chat(...args),
  }));
  mockEnglishContent();
  await seedReferenceText(env.db);
  return Object.assign(env, { chat });
}

export function restoreEnglishEnv() {
  vi.unstubAllEnvs();
  if (savedKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = savedKey;
  if (saved.cap === undefined) delete process.env.LLM_DAILY_CAP;
  else process.env.LLM_DAILY_CAP = saved.cap;
  if (saved.model === undefined) delete process.env.ENGLISH_ESSAY_GRADING_MODEL;
  else process.env.ENGLISH_ESSAY_GRADING_MODEL = saved.model;
  delete process.env.GRADE_RATE_LIMIT;
  vi.doUnmock("@/lib/openrouter.server");
  vi.doUnmock("@/content/units/y12-english-essay-writing/questions");
  vi.doUnmock("@/content/units/y12-english-essay-writing/answers");
}

type Started = Pick<StartedAttempt, "attemptId" | "attemptToken">;

/** Start (or resume) an English essay attempt through the real POST /api/attempts. */
export async function startEnglish(questionId?: string) {
  const { POST } = await import("@/app/api/attempts/route");
  const res = await POST(post("/api/attempts", questionId === undefined ? { unitId: ENGLISH_UNIT } : { unitId: ENGLISH_UNIT, questionId }));
  const body = await res.json();
  return { ...body, status: res.status } as StartedAttempt & { englishEssayState?: Record<string, unknown>; error?: string; questionId?: string; resumed?: boolean };
}

export async function saveEnglishScaffold(started: Started, questionId: string, action: "save" | "start", scaffold: unknown) {
  const { POST } = await import("@/app/api/english-essay/scaffold/route");
  const res = await POST(post("/api/english-essay/scaffold", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, action, scaffold }));
  return { status: res.status, body: await res.json() };
}

export async function gradeEnglish(started: Started, questionId: string, answer: string) {
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(post("/api/grade", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, answer }));
  return { status: res.status, body: await res.json() };
}

export async function saveEnglishDraft(started: Started, questionId: string, draft: string) {
  const { POST } = await import("@/app/api/rewrite/draft/route");
  const res = await POST(post("/api/rewrite/draft", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, phase: 1, draft }));
  return { status: res.status, body: await res.json() };
}

export async function discardEnglish(started: Started, questionId: string) {
  const { POST } = await import("@/app/api/english-essay/discard/route");
  const res = await POST(post("/api/english-essay/discard", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId }));
  return { status: res.status, body: await res.json() };
}

/** A scaffold with a thesis and one claim (enough to start writing). */
export const goodEnglishScaffold = (extra: Record<string, unknown> = {}) => ({
  thesis: "The play shows that facing loss together is what makes a community.",
  body: [{ claim: "Grief is shared, not private", evidence: "the lantern scene" }, {}, {}],
  ...extra,
});

/** Start an English attempt to the writing stage: scaffold saved and locked, ready for an essay. */
export async function startEnglishToWriting(questionId: string = E1) {
  const started = await startEnglish(questionId);
  const locked = await saveEnglishScaffold(started, questionId, "start", goodEnglishScaffold());
  if (locked.status !== 200) throw new Error(`could not lock the scaffold: ${JSON.stringify(locked.body)}`);
  return started;
}

export { englishEssayConceptId };
