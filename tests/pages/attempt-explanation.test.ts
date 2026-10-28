// The attempt detail page shows the current explanation under each wrong multiple-choice item
// (spec 002 US5; FR-041, FR-042). Nothing is stored per result, so an old attempt shows the
// explanation as it is now.

import { isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedResult, seedUser } from "../helpers/fixtures";
import { READY, fixtureAnswers, fixtureContent } from "../helpers/concept-fixtures";

let env: TestEnv;
beforeEach(async () => {
  env = await setupTestEnv();
  fixtureContent();
});
afterEach(async () => {
  await env.close();
});

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (isValidElement(node)) return textOf((node as ReactElement<{ children?: ReactNode }>).props.children);
  return "";
}

const MC1 = `${READY}.m01`;
const MC2 = `${READY}.m02`;
const SA1 = `${READY}.s01`;

async function seeded() {
  const me = await seedUser(env.db);
  env.signedInAs(asSessionUser(me));
  const attempt = await seedAttempt(env.db, me.id, { unitId: READY, questionIds: [MC1, MC2, SA1] });
  const base = { attemptId: attempt.id, userId: me.id };
  await seedResult(env.db, base, { unitId: READY, questionId: MC1, answer: "Wrong 1b", marksAwarded: 0, maxMarks: 1, gradedBy: "auto" });
  await seedResult(env.db, base, { unitId: READY, questionId: MC2, answer: "Right 2", marksAwarded: 1, maxMarks: 1, gradedBy: "auto" });
  await seedResult(env.db, base, { unitId: READY, questionId: SA1, answer: "my answer", marksAwarded: 0, maxMarks: 2, gradedBy: "llm", feedback: "Needs more." });
  return { me, attempt };
}

async function render(attemptId: string) {
  const Page = (await import("@/app/attempts/[attemptId]/page")).default;
  return textOf(await Page({ params: Promise.resolve({ attemptId }) }));
}

describe("the attempt detail page", () => {
  it("shows the explanation under a wrong multiple-choice item, and only that one", async () => {
    const { attempt } = await seeded();
    const text = await render(attempt.id);
    const explanation = fixtureAnswers[MC1].wrongExplanations!["Wrong 1b"];
    expect(text).toContain("Why this is wrong");
    expect(text).toContain(explanation);
    // not the other options' explanations, the correct item's, or anything for the short answer
    expect(text).not.toContain(fixtureAnswers[MC1].wrongExplanations!["Wrong 1a"]);
    expect(text).not.toContain(fixtureAnswers[MC2].wrongExplanations!["Wrong 2a"]);
    expect(text.match(/Why this is wrong/g)).toHaveLength(1);
  });

  it("shows the explanation as it is now, not as it was when the question was answered", async () => {
    const { attempt } = await seeded();
    const key = fixtureAnswers[MC1].wrongExplanations!;
    const before = key["Wrong 1b"];
    key["Wrong 1b"] = "A corrected explanation.";
    try {
      const text = await render(attempt.id);
      expect(text).toContain("A corrected explanation.");
      expect(text).not.toContain(before);
    } finally {
      key["Wrong 1b"] = before;
    }
  });

  it("never shows model answers or rubrics", async () => {
    const { attempt } = await seeded();
    const text = await render(attempt.id);
    expect(text).not.toContain(fixtureAnswers[SA1].modelAnswer);
    expect(text).not.toContain("Rubric point one");
    expect(text).not.toContain("MC rubric");
  });

  it("another student's attempt is the not-found page", async () => {
    const { attempt } = await seeded();
    const other = await seedUser(env.db);
    env.signedInAs(asSessionUser(other));
    await expect(render(attempt.id)).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("no page rendered before the student answers carries an explanation", async () => {
    const me = await seedUser(env.db);
    env.signedInAs(asSessionUser(me));
    const attempt = await seedAttempt(env.db, me.id, { unitId: READY, questionIds: [MC1, MC2] });
    const every = Object.values(fixtureAnswers).flatMap((a) => Object.values(a.wrongExplanations ?? {}));

    const UnitPage = (await import("@/app/unit/[unitId]/page")).default;
    const unitText = textOf(await UnitPage({ params: Promise.resolve({ unitId: READY }) }));
    const QuizPage = (await import("@/app/unit/[unitId]/quiz/page")).default;
    const quizText = JSON.stringify(
      await QuizPage({ params: Promise.resolve({ unitId: READY }), searchParams: Promise.resolve({ attempt: attempt.id }) }),
    );
    for (const e of every) {
      expect(unitText).not.toContain(e);
      expect(quizText).not.toContain(e);
    }
  });
});
