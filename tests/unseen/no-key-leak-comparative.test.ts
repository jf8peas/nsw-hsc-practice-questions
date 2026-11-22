// Principle I over EVERY comparative question (spec 009 SC-006, research R11, task T051): the start payload, the resume
// state at write, choice, retry and discussion, the pick route and every grade response never carry a 40-character run of
// the criteria, notes or a visual's description, nor a `pairing` field, before the discussion; the model answer and (for a
// choice question only) the pairing appear only at the discussion of a final attempt. Runs inside the shown texts or the
// question's own wording are quotation, not a leak. Walks the real bank once it ships; until then, the synthetic bank.

import { afterEach, describe, expect, it, vi } from "vitest";

import { questions as realQuestions } from "@/content/units/y12-english-advanced-comparative-texts/questions";
import { storeTexts } from "@/content/units/y12-english-advanced-unseen-texts/store-texts";
import type { ComparativeQuestion } from "@/lib/types";

import { choiceQuestion, fixedQuestion, mockComparativeContent } from "../helpers/comparative";
import { setupUnseenEnv, restoreUnseenEnv, markerContent9, fillWords, type UnseenEnv } from "../helpers/unseen";
import { post, signedInStudent, startAttempt } from "../helpers/routes";

const RUN = 40;
const squash = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
const synthetic = realQuestions.length === 0;
const bank: ComparativeQuestion[] = (synthetic ? [fixedQuestion, choiceQuestion] : realQuestions) as ComparativeQuestion[];

function stimulusOf(q: ComparativeQuestion): string {
  const parts = q.textIds.flatMap((id) => {
    const t = storeTexts.find((x) => x.id === id)!;
    const body = t.body.kind === "poem" ? t.body.stanzas.flat().join("\n") : t.body.kind === "prose" ? t.body.paragraphs.join("\n") : "";
    return [t.title, t.author, body, ...(t.footnotes ?? []).map((f) => f.text)];
  });
  return squash([...parts, q.prompt, ...(q.parts ?? []).map((p) => p.text)].join("\n"));
}
function firstLeak(secret: string, payload: string, stimulus: string): string | null {
  const k = squash(secret);
  const p = squash(payload);
  for (let i = 0; i + RUN <= k.length; i += 5) {
    const w = k.slice(i, i + RUN);
    if (p.includes(w) && !stimulus.includes(w)) return w;
  }
  return null;
}

let env: UnseenEnv;
afterEach(async () => {
  vi.doUnmock("@/content/units/y12-english-advanced-comparative-texts/questions");
  vi.doUnmock("@/content/units/y12-english-advanced-comparative-texts/keys");
  restoreUnseenEnv();
  vi.restoreAllMocks();
  await env?.close();
});

describe("every comparative question, through the whole flow", () => {
  it("never leaks the key before the discussion, and releases only the model answer (and a choice's pairing) there", async () => {
    env = await setupUnseenEnv();
    if (synthetic) mockComparativeContent();
    env.chat.mockImplementation((...args: unknown[]) => {
      const user = (args[0] as { messages: Array<{ role: string; content: string }> }).messages.find((m) => m.role === "user")!.content;
      const missed = (/\[miss:([a-z,-]*)\]/.exec(user)?.[1] ?? "").split(",").filter(Boolean);
      const max = Number(/QUESTION \((\d+) marks?\)/.exec(user)?.[1] ?? "6");
      // always one below full marks, so a retry is offered and the discussion comes only at the decline
      return Promise.resolve({ ok: true as const, content: markerContent9(max - 1, missed), finishReason: "stop" });
    });
    await signedInStudent(env);
    for (const name of ["ATTEMPT_RATE_LIMIT", "GRADE_RATE_LIMIT", "GRADE_IP_RATE_LIMIT", "DRAFT_RATE_LIMIT", "LLM_DAILY_CAP"]) vi.stubEnv(name, "100000");
    const { getAnswer } = await import("@/content/answers");

    const seen = new Set<string>();
    for (let n = 0; n < bank.length; n++) {
      const started = await startAttempt("y12-english-advanced-comparative-texts");
      const questionId = started.questions?.[0]?.id as string;
      expect(seen.has(questionId), "a question must not be drawn twice").toBe(false);
      seen.add(questionId);
      const question = bank.find((q) => q.id === questionId)!;
      const key = getAnswer(questionId)!.comparative!;
      const stim = stimulusOf(question);
      const secrets = [key.model, key.criteria, key.notes, ...Object.values(key.visuals ?? {}).map((v) => v.description)].filter((s) => s.trim());
      const before: Array<[string, unknown]> = [["start payload", started]];

      // choose the first allowed pick, save it, then submit below full marks (the model answer must not appear yet)
      const pick = question.choice ? question.choice.from.slice(0, question.choice.pick) : undefined;
      if (pick) {
        const { POST } = await import("@/app/api/comparative/pick/route");
        const res = await POST(post("/api/comparative/pick", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, pick }));
        before.push(["pick response", await res.json()]);
      }
      const { POST: grade } = await import("@/app/api/grade/route");
      const res = await grade(post("/api/grade", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, answer: fillWords(60, "[miss:compares-texts]"), phase: 1, ...(pick ? { pick } : {}) }));
      const first = await res.json();
      before.push(["first-try response", first]);
      expect(first.result.discussion, "below full marks: no discussion").toBeUndefined();

      const { loadComparativeState } = await import("@/lib/comparative/state.server");
      const { attempts } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");
      const [row] = await env.db.select().from(attempts).where(eq(attempts.id, started.attemptId));
      before.push(["resume at the retry choice", await loadComparativeState(env.db, row.userId, row)]);

      for (const [label, payload] of before) {
        const wire = JSON.stringify(payload);
        for (const secret of secrets) expect(firstLeak(secret, wire, stim), `${questionId}: ${label}`).toBeNull();
        expect(wire, `${questionId}: ${label} must not carry the pairing`).not.toContain('"pairing"');
        expect(wire, `${questionId}: ${label} must not carry the model answer`).not.toContain(squash(key.model).slice(0, 30));
      }

      // the discussion: the model answer, and the pairing for a choice question only
      const { POST: decline } = await import("@/app/api/unseen/decline/route");
      const done = await (await decline(post("/api/unseen/decline", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId }))).json();
      expect(done.result.discussion.modelAnswer).toBe(key.model);
      if (question.choice) expect(done.result.discussion.pairing).toEqual(key.pairing);
      else expect(done.result.discussion.pairing).toBeUndefined();
      for (const secret of [key.criteria, key.notes, ...Object.values(key.visuals ?? {}).map((v) => v.description)].filter((s) => s.trim())) {
        expect(firstLeak(secret, JSON.stringify(done), stim), `${questionId}: discussion`).toBeNull();
      }
    }
    expect(seen.size).toBe(bank.length);
  });
});
