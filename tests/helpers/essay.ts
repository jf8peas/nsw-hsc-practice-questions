import { vi } from "vitest";

import type { AnswerSet } from "@/lib/types";

import { post, startAttempt, type StartedAttempt } from "./routes";
import { setupTestEnv, type TestEnv } from "./env";
import type { ChatMock } from "./unseen";

// Test helpers for the essay-writing unit (spec 010). No essay has shipped (all six are `live: false`), so these
// tests give the unit two live essays by mocking the generated questions and answers modules: e1 (China, a school
// trial question with school criteria) and e5 (both economies, original). The model is stubbed: an essay can carry
// directives such as [band:1], [mark:19] and [nocover], and a reply is a valid marker reply.

export const ESSAY_UNIT = "y12-economics-essay-writing";
export const E1 = `${ESSAY_UNIT}.e1`;
export const E2 = `${ESSAY_UNIT}.e2`;
export const E5 = `${ESSAY_UNIT}.e5`;

export const NOTES = "NOTES-TOKEN-4471 a strong answer covers the open-door policy, special economic zones, WTO accession in 2001 and export-led growth in detail";
export const SCHOOL = "SCHOOL-TOKEN-9082 band six answers explain the role of globalisation with cause and effect and sustained use of data";
export const MODEL_WORD = "MODELESSAYTOKEN";
export const modelEssay = (): string => [MODEL_WORD, ...Array.from({ length: 659 }, (_, i) => `model${i}`)].join(" ");

export const KEYS: AnswerSet = {
  [E1]: { rubric: [], essay: { markingNotes: NOTES, schoolCriteria: SCHOOL, modelEssay: modelEssay(), concepts: [`${ESSAY_UNIT}.c-china-wto`] } },
  [E2]: { rubric: [], essay: { markingNotes: `${NOTES} (balance)`, schoolCriteria: null, modelEssay: modelEssay(), concepts: [`${ESSAY_UNIT}.c-china-environment`] } },
  [E5]: { rubric: [], essay: { markingNotes: `${NOTES} (both economies)`, schoolCriteria: null, modelEssay: modelEssay(), concepts: [`${ESSAY_UNIT}.c-china-wto`, `${ESSAY_UNIT}.c-nepal-remittances`] } },
};

/** An essay of exactly `n` words (a directive such as [band:1] counts as a word, so tests can sit on the word rules). */
export function essayOfWords(n: number, ...directives: string[]): string {
  return [...Array.from({ length: Math.max(0, n - directives.length) }, () => "word"), ...directives].join(" ");
}

export interface MarkerOptions {
  band?: number;
  mark?: number;
  covers?: boolean;
  flags?: Array<{ quote: string; why: string }>;
  gaps?: Array<{ concept: string; detail: string }>;
  used?: string[];
  extra?: Record<string, unknown>;
}

/** A valid marker reply (contracts/replies.md §1). */
export function markerEssayContent(o: MarkerOptions = {}): string {
  const reason = "MARKER-REASON-2210";
  const c = (verdict: string) => ({ reason, verdict });
  return JSON.stringify({
    criteria: { understanding: c("sound"), theory: c("sound"), assessment: c("developing"), data: c("sound"), structure: c("strong") },
    coversRequiredEconomies: o.covers ?? true,
    dataFlags: o.flags ?? [],
    band: o.band ?? 2,
    mark: o.mark ?? 14,
    bandReason: "MARKER-BANDREASON-6631 detailed understanding with some thorough data.",
    liftYourMark: ["MARKER-LIFT-ONE-1182", "MARKER-LIFT-TWO-1183"],
    gaps: o.gaps ?? [{ concept: "china-wto", detail: "MARKER-GAP-7710 WTO named but no effect on exports shown" }],
    conceptsUsedWell: o.used ?? ["skill-judgement"],
    ...(o.extra ?? {}),
  });
}

/** The stub: reads directives from the student's essay in the prompt. */
export function essayDirectiveReply(...args: unknown[]) {
  const params = args[0] as { messages: Array<{ role: string; content: string }> };
  const user = params.messages.find((m) => m.role === "user")!.content;
  const essay = /"""\n([\s\S]*?)\n"""/.exec(user)?.[1] ?? "";
  const band = /\[band:(\d)\]/.exec(essay)?.[1];
  const mark = /\[mark:(\d+)\]/.exec(essay)?.[1];
  return Promise.resolve({
    ok: true as const,
    content: markerEssayContent({
      ...(band ? { band: Number(band) } : {}),
      ...(mark ? { mark: Number(mark) } : {}),
      covers: !essay.includes("[nocover]"),
    }),
    finishReason: "stop",
  });
}

export interface EssayEnv extends TestEnv {
  chat: ChatMock;
}

const savedKey = process.env.OPENROUTER_API_KEY;
const saved = { cap: process.env.LLM_DAILY_CAP };

/** Mocks the unit's content so two essays are live. Call BEFORE the routes (or @/content) are first imported in the test. */
export function mockEssayContent(liveIds: string[] = [E1, E5]) {
  const questionsPath = "@/content/units/y12-economics-essay-writing/questions";
  vi.doMock(questionsPath, async () => {
    const real = (await vi.importActual(questionsPath)) as { questions: Array<{ id: string; live: boolean }> };
    return { ...real, questions: real.questions.map((q) => ({ ...q, live: liveIds.includes(q.id) })) };
  });
  vi.doMock("@/content/units/y12-economics-essay-writing/answers", () => ({ answers: KEYS }));
}

export async function setupEssayEnv(): Promise<EssayEnv> {
  const env = await setupTestEnv();
  process.env.OPENROUTER_API_KEY = "test-key";
  const chat: ChatMock = vi.fn<(...args: unknown[]) => Promise<unknown>>(essayDirectiveReply);
  vi.doMock("@/lib/openrouter.server", () => ({
    llmGradingConfigured: () => Boolean(process.env.OPENROUTER_API_KEY),
    DEFAULT_MODEL: "mock-default",
    gradeShortAnswer: () => Promise.resolve(null),
    gradeRewrite: () => Promise.resolve(null),
    chatCompletion: (...args: unknown[]) => chat(...args),
  }));
  mockEssayContent();
  return Object.assign(env, { chat });
}

export function restoreEssayEnv() {
  vi.unstubAllEnvs();
  if (savedKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = savedKey;
  if (saved.cap === undefined) delete process.env.LLM_DAILY_CAP;
  else process.env.LLM_DAILY_CAP = saved.cap;
  delete process.env.GRADE_RATE_LIMIT;
  vi.doUnmock("@/lib/openrouter.server");
  vi.doUnmock("@/content/units/y12-economics-essay-writing/questions");
  vi.doUnmock("@/content/units/y12-economics-essay-writing/answers");
}

type Started = Pick<StartedAttempt, "attemptId" | "attemptToken">;

/** Start (or resume) an essay attempt through the real POST /api/attempts. */
export async function startEssay(questionId?: string) {
  const { POST } = await import("@/app/api/attempts/route");
  const res = await POST(post("/api/attempts", questionId === undefined ? { unitId: ESSAY_UNIT } : { unitId: ESSAY_UNIT, questionId }));
  const body = await res.json();
  return { ...body, status: res.status } as StartedAttempt & { essayState?: Record<string, unknown>; error?: string; questionId?: string; resumed?: boolean };
}

export async function saveScaffold(started: Started, questionId: string, action: "save" | "start", scaffold: unknown) {
  const { POST } = await import("@/app/api/essay/scaffold/route");
  const res = await POST(post("/api/essay/scaffold", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, action, scaffold }));
  return { status: res.status, body: await res.json() };
}

export async function gradeEssay(started: Started, questionId: string, answer: string) {
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(post("/api/grade", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, answer }));
  return { status: res.status, body: await res.json() };
}

export async function saveEssayDraft(started: Started, questionId: string, draft: string) {
  const { POST } = await import("@/app/api/rewrite/draft/route");
  const res = await POST(post("/api/rewrite/draft", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, phase: 1, draft }));
  return { status: res.status, body: await res.json() };
}

/** A scaffold with a judgement and one point (enough to start writing). */
export const goodScaffold = (extra: Record<string, unknown> = {}) => ({
  intro: { judgement: "Globalisation has strongly lifted China's growth.", terms: "globalisation", economies: "China, emerging" },
  body: [{ point: "Trade expanded after WTO entry in 2001", theory: "comparative advantage", data: "exports 2001 to 2020", evaluation: "uneven gains", link: "supports the judgement" }, {}, {}],
  conclusion: { judgement: "So globalisation was highly effective.", weighs: "export growth" },
  ...extra,
});

/** Start e1 and e5-style attempts to the writing stage: scaffold saved and locked, ready for an essay. */
export async function startToWriting(questionId: string = E1) {
  const started = await startEssay(questionId);
  const locked = await saveScaffold(started, questionId, "start", goodScaffold());
  if (locked.status !== 200) throw new Error(`could not lock the scaffold: ${JSON.stringify(locked.body)}`);
  return started;
}

export interface ReviewOptions {
  /** ids whose status is a fix (the rest are strengths). */
  fixes?: string[];
  flags?: Array<{ quote: string; why: string }>;
  extra?: Record<string, unknown>;
}

/** A valid plan-review reply (contracts/replies.md §2): every fix is a question. */
export function reviewEssayContent(o: ReviewOptions = {}): string {
  const ids = ["answers", "scope", "band", "data", "models", "evaluation", "fit"];
  const fixes = o.fixes ?? ["data"];
  return JSON.stringify({
    checks: ids.map((id) => (fixes.includes(id) ? { id, status: "fix", line: `REVIEW-FIX-${id}: which indicator and year supports this point?` } : { id, status: "strength", line: `REVIEW-OK-${id}: this is working.` })),
    figureFlags: o.flags ?? [],
    ...(o.extra ?? {}),
  });
}

export async function reviewPlanRequest(started: Pick<StartedAttempt, "attemptId" | "attemptToken">, questionId: string, scaffold: unknown) {
  const { POST } = await import("@/app/api/essay/review/route");
  const res = await POST(post("/api/essay/review", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, scaffold }));
  return { status: res.status, body: await res.json() };
}
