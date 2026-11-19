import { vi } from "vitest";

import { questions } from "@/content/units/y12-english-advanced-unseen-texts/questions";
import { SKILL_IDS } from "@/lib/unseen/skills";

import { setupTestEnv, type TestEnv } from "./env";
import { post, startAttempt, type StartedAttempt } from "./routes";

// Test helpers for the unseen-text unit (spec 008): a stubbed model that answers like the fake
// OpenRouter (scripts/fake-openrouter.ts). The student's answer can carry directives: [mark:2] sets
// the mark (clamped to the question's value) and [miss:technique-effect,apt-evidence] lists the skills
// marked missed; with neither, every skill is met and the mark is full. The reasons, feedback and gap
// are recognisable strings so a test can assert they never reach a log.

export const UNSEEN_UNIT = "y12-english-advanced-unseen-texts";
export const REASON = "MOCK-REASON-8842";
export const FEEDBACK = "MOCK-FEEDBACK-5519";
export const GAP = "MOCK-GAP-3306";
export const GO_FURTHER = "MOCK-GOFURTHER-7714";

/** The bank's questions in order; `Q[0]` is the first starter question. */
export const Q = questions.map((q) => q.id);

export type ChatMock = ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;

export interface UnseenEnv extends TestEnv {
  chat: ChatMock;
}

export function markerContent(mark: number, missed: string[] = [], overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    mark,
    skills: Object.fromEntries(SKILL_IDS.map((id) => [id, { met: !missed.includes(id), reason: REASON }])),
    feedback: FEEDBACK,
    biggestGap: GAP,
    // always sent, so the app is what keeps it to full-mark tries (a below-full reply's goFurther is dropped)
    goFurther: GO_FURTHER,
    descriptionAdequate: null,
    ...overrides,
  });
}

/** The default stub: reads [mark:N] and [miss:a,b] from the student's answer in the prompt. */
export function directiveReply(...args: unknown[]) {
  const params = args[0] as { messages: Array<{ role: string; content: string }> };
  const user = params.messages.find((m) => m.role === "user")!.content;
  const max = Number(/QUESTION \((\d+) marks?\)/.exec(user)?.[1] ?? "3");
  const answer = /<<<ANSWER\n([\s\S]*?)\nANSWER>>>/.exec(user)?.[1] ?? "";
  const markDirective = /\[mark:(\d+)\]/.exec(answer)?.[1];
  const missed = (/\[miss:([a-z,-]*)\]/.exec(answer)?.[1] ?? "").split(",").filter(Boolean);
  const mark = markDirective !== undefined ? Math.min(Number(markDirective), max) : missed.length > 0 ? Math.max(0, max - 1) : max;
  return Promise.resolve({ ok: true as const, content: markerContent(mark, missed), finishReason: "stop" });
}

const savedKey = process.env.OPENROUTER_API_KEY;

/** setupTestEnv plus a stubbed `chatCompletion`; the real OpenRouter call is never made. */
export async function setupUnseenEnv(): Promise<UnseenEnv> {
  const env = await setupTestEnv();
  process.env.OPENROUTER_API_KEY = "test-key";
  const chat: ChatMock = vi.fn<(...args: unknown[]) => Promise<unknown>>(directiveReply);
  // a deterministic draw: the first unanswered question, in the bank's order (the real draw is random)
  vi.doMock("node:crypto", async (importOriginal) => ({ ...(await importOriginal<typeof import("node:crypto")>()), randomInt: () => 0 }));
  vi.doMock("@/lib/openrouter.server", () => ({
    llmGradingConfigured: () => Boolean(process.env.OPENROUTER_API_KEY),
    DEFAULT_MODEL: "mock-default",
    gradeShortAnswer: () => Promise.resolve(null),
    gradeRewrite: () => Promise.resolve(null),
    chatCompletion: (...args: unknown[]) => chat(...args),
  }));
  return Object.assign(env, { chat });
}

export function restoreUnseenEnv() {
  vi.unstubAllEnvs();
  if (savedKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = savedKey;
  delete process.env.LLM_DAILY_CAP;
  delete process.env.GRADE_RATE_LIMIT;
  vi.doUnmock("@/lib/openrouter.server");
  vi.doUnmock("node:crypto");
}

export async function gradeUnseen(
  started: Pick<StartedAttempt, "attemptId" | "attemptToken">,
  questionId: string,
  answer: string,
  extra: { phase?: 1 | 2 | "2"; skip?: boolean } = {},
) {
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(
    post("/api/grade", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, answer, phase: 1, ...extra }),
  );
  return { status: res.status, body: await res.json() };
}

export async function declineUnseen(started: Pick<StartedAttempt, "attemptId" | "attemptToken">, questionId: string) {
  const { POST } = await import("@/app/api/unseen/decline/route");
  const res = await POST(post("/api/unseen/decline", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId }));
  return { status: res.status, body: await res.json() };
}

export async function startUnseen() {
  const started = await startAttempt(UNSEEN_UNIT);
  return { started, questionId: started.questions?.[0]?.id as string };
}

/** An answer of exactly `n` words (the directives count as words), so a test can sit on a length rule. */
export function fillWords(n: number, ...directives: string[]): string {
  const fillers = Array.from({ length: Math.max(0, n - directives.length) }, () => "word");
  return [...fillers, ...directives].join(" ");
}
