import { vi } from "vitest";

import { setupTestEnv, type TestEnv } from "./env";
import { post, startAttempt, type StartedAttempt } from "./routes";

// Test helpers for the paragraph unit (spec 007): a stubbed model that answers like the fake
// OpenRouter (scripts/fake-openrouter.ts): the student's text can carry a directive [met:abd] that
// chooses the verdicts (a, b, c = the part's criteria, d = the conventions; a missing letter is NOT
// met; no directive means all met). The reasons and feedback are recognisable strings so a test
// can assert they never reach a log.

export const PARAGRAPH_UNIT = "y12-economics-paragraph-writing";
export const REASON = "MOCK-REASON-7731";
export const FEEDBACK = "MOCK-FEEDBACK-4417";
export const q = (essay: number, part: number) => `${PARAGRAPH_UNIT}.e${String(essay).padStart(2, "0")}p${part}`;

export type ChatMock = ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<unknown>>>;

export interface ParagraphEnv extends TestEnv {
  chat: ChatMock;
}

export function markerContent(met: string, overrides: Record<string, unknown> = {}): string {
  const has = (k: string) => met.includes(k);
  return JSON.stringify({
    restated: "RESTATED-MUST-NOT-BE-KEPT",
    criteria: {
      a: { reason: REASON, met: has("a") },
      b: { reason: REASON, met: has("b") },
      c: { reason: REASON, met: has("c") },
    },
    conventions: { reason: REASON, preciseLanguage: has("d"), noPadding: has("d") },
    feedback: FEEDBACK,
    ...overrides,
  });
}

/** The default stub: reads [met:...] from the student's text in the prompt (all met without one). */
export function directiveReply(...args: unknown[]) {
  const params = args[0] as { messages: Array<{ role: string; content: string }> };
  const user = params.messages.find((m) => m.role === "user")!.content;
  const answer = /Student's [^\n]+:\n"""\n([\s\S]*?)\n"""/.exec(user)?.[1] ?? "";
  const met = /\[met:([abcd]*)\]/.exec(answer)?.[1] ?? "abcd";
  return Promise.resolve({ ok: true as const, content: markerContent(met) });
}

const savedKey = process.env.OPENROUTER_API_KEY;

/** setupTestEnv plus a stubbed `chatCompletion`; the real OpenRouter call is never made. */
export async function setupParagraphEnv(): Promise<ParagraphEnv> {
  const env = await setupTestEnv();
  process.env.OPENROUTER_API_KEY = "test-key";
  const chat: ChatMock = vi.fn<(...args: unknown[]) => Promise<unknown>>(directiveReply);
  vi.doMock("@/lib/openrouter.server", () => ({
    llmGradingConfigured: () => true,
    DEFAULT_MODEL: "mock-default",
    gradeShortAnswer: () => Promise.resolve(null),
    gradeRewrite: () => Promise.resolve(null),
    chatCompletion: (...args: unknown[]) => chat(...args),
  }));
  return Object.assign(env, { chat });
}

export function restoreParagraphEnv() {
  if (savedKey === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = savedKey;
  delete process.env.LLM_DAILY_CAP;
  delete process.env.GRADE_RATE_LIMIT;
}

export async function gradeParagraph(
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

export async function startParagraph() {
  const started = await startAttempt(PARAGRAPH_UNIT);
  return { started, questionId: started.questions?.[0]?.id as string };
}

/** `n` words of filler, plus an optional directive, so a test can go over a part's word limit. */
export const words = (n: number, directive = "") => `${Array.from({ length: n }, () => "word").join(" ")} ${directive}`.trim();
