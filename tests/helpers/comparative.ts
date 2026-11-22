import { vi } from "vitest";

import { storeTexts } from "@/content/units/y12-english-advanced-unseen-texts/store-texts";
import type { ComparativeKey, ComparativeQuestion } from "@/lib/types";
import { COMPARATIVE_SKILL_IDS, comparativeSkillConceptId } from "@/lib/unseen/skills";

import { setupUnseenEnv, restoreUnseenEnv, markerContent9, type UnseenEnv } from "./unseen";
import { post, startAttempt, type StartedAttempt } from "./routes";

// Test helpers for the comparative unit (spec 009). No comparative question has shipped yet, so these tests give the
// unit a small synthetic bank: two questions on REAL texts of the shared store (so the texts, the descriptions and
// the image route are the genuine ones), mocked in place of the generated questions.ts and keys.ts. The model is
// stubbed like the unseen unit's (an answer can carry [mark:N] and [miss:a,b] directives; nine verdicts come back).

export const CMP_UNIT = "y12-english-advanced-comparative-texts";
export const FIXED_Q = `${CMP_UNIT}.test-fixed`;
export const CHOICE_Q = `${CMP_UNIT}.test-choice`;

const written = storeTexts.filter((t) => t.body.kind !== "image" && t.hscChecked);
const [A, B, C] = written;
const visual = storeTexts.find((t) => t.body.kind === "image")!;
export const TEXTS = { A: A.id, B: B.id, C: C.id, V: visual.id };

const paper = { school: "Invented", short: "Invented", year: 2026, exam: "Trial" as const, qNo: 5 as const };
const base = {
  type: "comparative" as const,
  group: "comparative" as const,
  maxMarks: 6,
  verb: "compare",
  suggestedWords: 216,
  suggestedFrom: "lines" as const,
  paper,
  outcome: "EAV-12-01" as const,
  concepts: [comparativeSkillConceptId("compares-texts"), comparativeSkillConceptId("answers-question")],
  source: "Invented 2026 Trial, Q5",
};

/** A fixed pair: the first written text and the visual (so the tabs, the description and the image are exercised). */
export const fixedQuestion: ComparativeQuestion = {
  ...base,
  id: FIXED_Q,
  prompt: "Compare how the two texts shape the idea of belonging.",
  textIds: [A.id, visual.id],
  choice: null,
};

/** A choice question: the first written text and ONE of the second written text or the visual. */
export const choiceQuestion: ComparativeQuestion = {
  ...base,
  id: CHOICE_Q,
  prompt: "Compare how the first text and ONE other text explore the effect of memory.",
  textIds: [A.id, B.id, visual.id],
  choice: { fixed: [A.id], from: [B.id, visual.id], pick: 1 },
};

const model =
  "Both texts treat the idea as something felt before it is explained, whereas the first builds it through its images and the second through its structure, and the answer weighs a technique in each against the other, quoting both, so that the comparison runs through the whole response and not only its last sentence, which keeps both texts in the same depth.";
export const KEY: Omit<ComparativeKey, "visuals"> = {
  criteria: "6 – Skilful comparison\n5 – Effective comparison\n4 – Sound comparison\n3 – Some comparison\n2 – Limited\n1 – Little",
  notes: "None provided by the school.",
  model,
  modelOrigin: "school",
  criteriaOrigin: "school",
  pairing: [A.id, B.id],
};

/** Give the unit its synthetic bank: call BEFORE the routes (or @/content) are first imported in the test. */
export function mockComparativeContent() {
  vi.doMock("@/content/units/y12-english-advanced-comparative-texts/questions", () => ({ questions: [fixedQuestion, choiceQuestion] }));
  vi.doMock("@/content/units/y12-english-advanced-comparative-texts/keys", () => ({
    keys: { [FIXED_Q]: { ...KEY, pairing: [A.id, visual.id] }, [CHOICE_Q]: KEY },
  }));
}

export type ComparativeEnv = UnseenEnv;

export async function setupComparativeEnv(): Promise<ComparativeEnv> {
  const env = await setupUnseenEnv();
  mockComparativeContent();
  // the nine-verdict stub: [mark:N] and [miss:a,b] in the student's answer, as the unseen unit's helper
  env.chat.mockImplementation((...args: unknown[]) => {
    const params = args[0] as { messages: Array<{ role: string; content: string }> };
    const user = params.messages.find((m) => m.role === "user")!.content;
    const max = Number(/QUESTION \((\d+) marks?\)/.exec(user)?.[1] ?? "6");
    const answer = /<<<ANSWER\n([\s\S]*?)\nANSWER>>>/.exec(user)?.[1] ?? "";
    const markDirective = /\[mark:(\d+)\]/.exec(answer)?.[1];
    const missed = (/\[miss:([a-z,-]*)\]/.exec(answer)?.[1] ?? "").split(",").filter(Boolean);
    const mark = markDirective !== undefined ? Math.min(Number(markDirective), max) : missed.length > 0 ? Math.max(0, max - 1) : max;
    return Promise.resolve({ ok: true as const, content: markerContent9(mark, missed), finishReason: "stop" });
  });
  return env;
}

export function restoreComparativeEnv() {
  vi.doUnmock("@/content/units/y12-english-advanced-comparative-texts/questions");
  vi.doUnmock("@/content/units/y12-english-advanced-comparative-texts/keys");
  restoreUnseenEnv();
}

export async function startComparative() {
  const started = await startAttempt(CMP_UNIT);
  return { started, questionId: started.questions?.[0]?.id as string, state: (started as unknown as { comparativeState: Record<string, unknown> }).comparativeState };
}

type Started = Pick<StartedAttempt, "attemptId" | "attemptToken">;

export async function gradeComparative(
  started: Started,
  questionId: string,
  answer: string,
  extra: { phase?: 1 | 2 | "2"; pick?: unknown } = {},
) {
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(post("/api/grade", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, answer, phase: 1, ...extra }));
  return { status: res.status, body: await res.json() };
}

export async function savePick(started: Started, questionId: string, pick: unknown) {
  const { POST } = await import("@/app/api/comparative/pick/route");
  const res = await POST(post("/api/comparative/pick", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, pick }));
  return { status: res.status, body: await res.json() };
}

export { COMPARATIVE_SKILL_IDS };
