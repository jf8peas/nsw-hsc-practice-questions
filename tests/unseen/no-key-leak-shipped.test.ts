// Principle I over EVERY shipped unseen question (spec 008 T060, research R4): the start payload and the
// resume state at write, choice, retry and discussion, and the grade responses, never carry a 40-character
// run of the criteria, notes or a visual's description; the model answer appears only at the discussion
// of a final attempt; a below-full grade response has no discussion. Runs inside the stimulus or the
// question's own wording (the school's criteria restate the question) are quotation, not a leak. Also: the public registry serialised holds no key run.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getAnswer } from "@/content/answers";
import { UNITS, getUnit } from "@/content";
import { attempts } from "@/lib/db/schema";
import { loadUnseenState } from "@/lib/unseen/state.server";
import type { UnseenText } from "@/lib/types";

import { post, signedInStudent } from "../helpers/routes";
import { Q, UNSEEN_UNIT, fillWords, gradeUnseen, restoreUnseenEnv, setupUnseenEnv, startUnseen, type UnseenEnv } from "../helpers/unseen";

const RUN = 40;
const squash = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

function stimulusOf(text: UnseenText, question: { prompt: string; parts?: Array<{ text: string }> }): string {
  const body = text.body.kind === "poem" ? text.body.stanzas.flat().join("\n") : text.body.kind === "prose" ? text.body.paragraphs.join("\n") : "";
  return squash([text.title, text.author, body, ...(text.footnotes ?? []).map((f) => f.text), question.prompt, ...(question.parts ?? []).map((p) => p.text)].join("\n"));
}

/** True when a RUN-character window of `secret` appears in `payload` outside the stimulus. */
function leaks(secret: string, payload: string, stimulus: string): boolean {
  return firstLeak(secret, payload, stimulus) !== null;
}

function firstLeak(secret: string, payload: string, stimulus: string): string | null {
  const k = squash(secret);
  const p = squash(payload);
  for (let i = 0; i + RUN <= k.length; i += 5) {
    const w = k.slice(i, i + RUN);
    if (p.includes(w) && !stimulus.includes(w)) return `${w} @ ${p.slice(Math.max(0, p.indexOf(w) - 60), p.indexOf(w) + 100)}`;
  }
  return null;
}

const unit = UNITS.find((u) => u.id === UNSEEN_UNIT)!;
const questionOf = (qid: string) => unit.questions.find((q) => q.id === qid) as unknown as { textId: string; prompt: string; parts?: Array<{ text: string }> };
const allowedOf = (qid: string) => stimulusOf(unit.texts!.find((t) => t.id === questionOf(qid).textId)!, questionOf(qid));

let env: UnseenEnv;
afterEach(async () => {
  restoreUnseenEnv();
  vi.restoreAllMocks();
  await env?.close();
});

describe("the public registry", () => {
  it("holds no run of any shipped question's criteria, notes, model answer or description", () => {
    const serialised = JSON.stringify(getUnit(UNSEEN_UNIT));
    for (const qid of Q) {
      const key = getAnswer(qid)!.unseen!;
      const stim = Q.map(allowedOf).join(" ");
      for (const secret of [key.model, key.criteria, key.notes, key.visual?.description ?? ""]) {
        if (secret.trim()) expect(firstLeak(secret, serialised, stim), qid).toBeNull();
      }
    }
  });
});

describe("every shipped unseen question, through the whole flow", () => {
  it("never leaks the key before the discussion, and releases only the model answer there", async () => {
    env = await setupUnseenEnv();
    const user = await signedInStudent(env);
    const seen = new Set<string>();
    // the whole bank is walked in one go, so the per-user limits are lifted for this test
    for (const name of ["ATTEMPT_RATE_LIMIT", "GRADE_RATE_LIMIT", "GRADE_IP_RATE_LIMIT", "DRAFT_RATE_LIMIT", "LLM_DAILY_CAP"]) vi.stubEnv(name, "100000");

    for (let n = 0; n < Q.length; n++) {
      const { started, questionId } = await startUnseen();
      expect(seen.has(questionId), "a question must not be drawn twice").toBe(false);
      seen.add(questionId);
      const key = getAnswer(questionId)!.unseen!;
      const stim = allowedOf(questionId);
      const before: Array<[string, unknown]> = [["start payload", started]];
      const state = async () => {
        const [row] = await env.db.select().from(attempts).where(eq(attempts.id, started.attemptId));
        return loadUnseenState(env.db, user.id, row);
      };

      before.push(["write state", await state()]);
      const first = await gradeUnseen(started, questionId, fillWords(60, "[mark:1]", "[miss:technique-effect]"));
      expect(first.body.result.discussion, "a below-full first try has no discussion").toBeUndefined();
      before.push(["first grade", first.body]);
      before.push(["choice state", await state()]);

      const { POST } = await import("@/app/api/rewrite/draft/route");
      await POST(post("/api/rewrite/draft", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, phase: 2, draft: "A retry in progress" }));
      const retryState = (await state()) as { stage: string };
      expect(retryState.stage).toBe("retry");
      before.push(["retry state", retryState]);

      for (const [label, payload] of before) {
        const json = JSON.stringify(payload);
        for (const [name, secret] of [["model answer", key.model], ["criteria", key.criteria], ["notes", key.notes], ["description", key.visual?.description ?? ""]] as const) {
          if (secret.trim()) expect(firstLeak(secret, json, stim), `${questionId} ${label} leaks the ${name}`).toBeNull();
        }
      }

      const last = await gradeUnseen(started, questionId, fillWords(60, "[mark:2]"), { phase: 2 });
      const discussionState = await state();
      expect((discussionState as { stage: string }).stage).toBe("discussion");
      // the model answer is released here, so wording the criteria share with it is not a leak either
      const withModel = `${stim} ${squash(key.model)}`;
      for (const [label, payload] of [["final grade", last.body], ["discussion state", discussionState]] as const) {
        const json = JSON.stringify(payload);
        // the model answer is released here, and only here; the rest of the key still is not
        expect(JSON.stringify(payload), `${questionId} ${label} carries the model answer`).toContain(key.model.slice(0, 30).replace(/"/g, '\\"'));
        for (const [name, secret] of [["criteria", key.criteria], ["notes", key.notes], ["description", key.visual?.description ?? ""]] as const) {
          if (secret.trim()) expect(firstLeak(secret, json, withModel), `${questionId} ${label} leaks the ${name}`).toBeNull();
        }
      }
    }
    expect(seen.size).toBe(Q.length);
  });
});
