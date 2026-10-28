// Wrong multiple-choice options carry a written explanation, returned after answering
// (spec 002 US5; FR-039 to FR-043; constitution Principle I).

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { fixtureAnswers, PLAIN, READY, fixtureContent } from "../helpers/concept-fixtures";
import {
  allKeys,
  post,
  setupRouteEnv,
  signedInStudent,
  startAttempt,
  type RouteEnv,
  type StartedAttempt,
} from "../helpers/routes";
import type { McQuestion } from "@/lib/types";

let env: RouteEnv;
beforeEach(async () => {
  env = await setupRouteEnv();
  fixtureContent();
  await signedInStudent(env);
});
afterEach(async () => {
  await env.close();
});

async function grade(started: StartedAttempt, questionId: string, answer: string) {
  const { POST } = await import("@/app/api/grade/route");
  const res = await POST(
    post("/api/grade", { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId, answer }),
  );
  return { status: res.status, body: await res.json() };
}

const correctDisplayIndex = (q: McQuestion) => q.options.indexOf(fixtureAnswers[q.id].correctText as string);
const mcs = (s: StartedAttempt) => s.questions.filter((q): q is McQuestion => q.type === "mc");
const textAt = (q: McQuestion, display: number) => q.options[display];
const explanationFor = (q: McQuestion, optionText: string) => fixtureAnswers[q.id].wrongExplanations?.[optionText];
const allExplanations = () =>
  Object.values(fixtureAnswers).flatMap((a) => Object.values(a.wrongExplanations ?? {}));

describe("a wrong answer", () => {
  it("returns the explanation for the chosen option and for no other", async () => {
    const started = await startAttempt(READY);
    const q = mcs(started)[0];
    const right = correctDisplayIndex(q);
    for (let display = 0; display < q.options.length; display++) {
      if (display === right) continue;
      const fresh = await startAttempt(READY);
      const same = fresh.questions.find((x) => x.id === q.id);
      if (!same || same.type !== "mc") continue; // the draw differs per attempt
      const wrong = same.options.findIndex((o) => o !== fixtureAnswers[q.id].correctText);
      const { body } = await grade(fresh, same.id, String(wrong));
      expect(body.result.optionExplanation).toBe(explanationFor(same, textAt(same, wrong)));
      for (const other of allExplanations()) {
        if (other !== body.result.optionExplanation) expect(JSON.stringify(body)).not.toContain(other);
      }
    }
  });

  it("is also returned when the database cannot be reached", async () => {
    const started = await startAttempt(READY);
    const q = mcs(started)[0];
    const wrong = q.options.findIndex((o) => o !== fixtureAnswers[q.id].correctText);
    env.databaseDown();
    const { status, body } = await grade(started, q.id, String(wrong));
    expect(status).toBe(200);
    expect(body.degraded).toBe(true);
    expect(body.result.optionExplanation).toBe(explanationFor(q, textAt(q, wrong)));
  });

  it("is recomputed from the stored option on a 409 already_answered", async () => {
    const started = await startAttempt(READY);
    const q = mcs(started)[0];
    const wrong = q.options.findIndex((o) => o !== fixtureAnswers[q.id].correctText);
    await grade(started, q.id, String(wrong));
    const again = await grade(started, q.id, String(correctDisplayIndex(q)));
    expect(again.status).toBe(409);
    expect(again.body.result.optionExplanation).toBe(explanationFor(q, textAt(q, wrong)));
  });
});

describe("a correct answer", () => {
  it("returns no explanation and no field that contains one", async () => {
    const started = await startAttempt(READY);
    const q = mcs(started)[0];
    const { body } = await grade(started, q.id, String(correctDisplayIndex(q)));
    expect(body.result.optionExplanation).toBeUndefined();
    expect(allKeys(body).has("wrongExplanations")).toBe(false);
    const text = JSON.stringify(body);
    for (const e of allExplanations()) expect(text).not.toContain(e);
  });
});

describe("when there is nothing to show", () => {
  it("a unit that is not explanations-complete returns none", async () => {
    const started = await startAttempt(PLAIN);
    const q = mcs(started)[0];
    const wrong = q.options.findIndex((o) => o !== fixtureAnswers[q.id].correctText);
    const { status, body } = await grade(started, q.id, String(wrong));
    expect(status).toBe(200);
    expect(body.result.optionExplanation).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("should never be shown");
  });

  it("an option with no explanation returns none and no error", async () => {
    const started = await startAttempt(READY);
    const q = mcs(started)[0];
    const wrong = q.options.findIndex((o) => o !== fixtureAnswers[q.id].correctText);
    const key = fixtureAnswers[q.id];
    const saved = key.wrongExplanations;
    delete (key.wrongExplanations as Record<string, string>)[textAt(q, wrong)];
    try {
      const { status, body } = await grade(started, q.id, String(wrong));
      expect(status).toBe(200);
      expect(body.result.optionExplanation).toBeUndefined();
    } finally {
      key.wrongExplanations = saved;
      (key.wrongExplanations as Record<string, string>)[textAt(q, wrong)] = "restored";
    }
  });

  it("short answers never carry the field", async () => {
    const started = await startAttempt(READY);
    const s = started.questions.find((q) => q.type === "short")!;
    const { body } = await grade(started, s.id, "an answer");
    expect(body.result.optionExplanation).toBeUndefined();
  });
});
