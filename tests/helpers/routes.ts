import { vi } from "vitest";

import { getAnswer } from "@/content/answers";
import { UNITS } from "@/content";
import type { Question } from "@/lib/types";

import { asSessionUser, setupTestEnv, type TestEnv } from "./env";
import { seedUser } from "./fixtures";

export interface LlmGrade {
  marksAwarded: number;
  feedback: string;
  rubricHits: string[];
  rubricMisses: string[];
  gradedBy: string;
}

export interface RouteEnv extends TestEnv {
  /** The mocked LLM grader. Default: full marks with feedback. Return null to simulate failure. */
  llm: ReturnType<typeof vi.fn<(...args: unknown[]) => Promise<LlmGrade | null>>>;
}

export const DEFAULT_LLM_GRADE: LlmGrade = {
  marksAwarded: 1,
  feedback: "Good reasoning.",
  rubricHits: ["point one"],
  rubricMisses: [],
  gradedBy: "mock-model",
};

/** setupTestEnv plus a mock for the LLM grader (the real OpenRouter call is never made). */
export async function setupRouteEnv(): Promise<RouteEnv> {
  const env = await setupTestEnv();
  const llm = vi.fn<(...args: unknown[]) => Promise<LlmGrade | null>>(async () => ({
    ...DEFAULT_LLM_GRADE,
  }));
  vi.doMock("@/lib/openrouter.server", () => ({
    llmGradingConfigured: () => true,
    gradeShortAnswer: (...args: unknown[]) => llm(...args),
  }));
  return Object.assign(env, { llm });
}

export function post(url: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export async function signedInStudent(env: TestEnv, overrides = {}) {
  const row = await seedUser(env.db, overrides);
  env.signedInAs(asSessionUser(row));
  return row;
}

export interface StartedAttempt {
  attemptId: string;
  attemptToken: string;
  persisted: boolean;
  questions: Question[];
  status: number;
}

/** Start an attempt through the real POST /api/attempts handler. */
export async function startAttempt(unitId = "y11-formula-test"): Promise<StartedAttempt> {
  const { POST } = await import("@/app/api/attempts/route");
  const res = await POST(post("/api/attempts", { unitId }));
  const body = await res.json();
  return { ...body, status: res.status };
}

/** The display index of the correct option for an MC question as shown in `questions`. */
export function correctDisplayIndex(question: Question): number {
  if (question.type !== "mc") throw new Error("not an MC question");
  const key = getAnswer(question.id)!;
  const idx = question.options.indexOf(key.correctText as string);
  if (idx < 0) throw new Error("correctText not among displayed options");
  return idx;
}

export function wrongDisplayIndex(question: Question): number {
  if (question.type !== "mc") throw new Error("not an MC question");
  return question.options.findIndex((_, i) => i !== correctDisplayIndex(question));
}

export const firstOf = (questions: Question[], type: "mc" | "short") => {
  const q = questions.find((x) => x.type === type);
  if (!q) throw new Error(`no ${type} question drawn`);
  return q;
};

export function unitWithBoth() {
  return UNITS.find((u) => u.id === "y11-formula-test")!;
}

/** Collect every object key in a JSON-able value. */
export function allKeys(value: unknown, into = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => allKeys(v, into));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      into.add(k);
      allKeys(v, into);
    }
  }
  return into;
}
