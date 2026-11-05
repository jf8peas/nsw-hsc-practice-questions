// POST /api/rewrite/draft now also serves paragraph parts (spec 007 research R6): the draft is saved
// per phase, nothing is written once the first try is marked (phase 1) or the part is final
// (phase 2), and the sentence unit is unchanged.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { rewriteDrafts } from "@/lib/db/schema";

import {
  gradeParagraph,
  restoreParagraphEnv,
  setupParagraphEnv,
  startParagraph,
  type ParagraphEnv,
} from "../helpers/paragraph";
import { post, signedInStudent } from "../helpers/routes";

let env: ParagraphEnv;
afterEach(async () => {
  restoreParagraphEnv();
  await env?.close();
});

async function draft(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/rewrite/draft/route");
  const res = await POST(post("/api/rewrite/draft", body));
  return { status: res.status, body: await res.json() };
}
const row = async (qid: string) => (await env.db.select().from(rewriteDrafts).where(eq(rewriteDrafts.questionId, qid)))[0];

describe("paragraph drafts", () => {
  it("saves the phase 1 draft, replaces it on a second save, and keeps each phase separate", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    const base = { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId };
    expect((await draft({ ...base, phase: 1, draft: "First words" })).body).toEqual({ saved: true });
    expect((await draft({ ...base, phase: 1, draft: "More words" })).body).toEqual({ saved: true });
    expect(await row(questionId)).toMatchObject({ phase1Draft: "More words", phase2Draft: "" });
  });

  it("writes nothing once the first try is marked (phase 1) and keeps the correction draft while on the correction", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    const base = { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId };
    await gradeParagraph(started, questionId, "First try. [met:ad]");
    expect((await draft({ ...base, phase: 1, draft: "late" })).body).toEqual({ saved: false });
    expect((await draft({ ...base, phase: 2, draft: "My correction so far" })).body).toEqual({ saved: true });
    expect((await row(questionId)).phase2Draft).toBe("My correction so far");
  });

  it("writes nothing once the part is final, and the final grade deletes the draft row", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    const base = { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId };
    await draft({ ...base, phase: 1, draft: "typing" });
    await gradeParagraph(started, questionId, "Perfect. [met:abcd]");
    expect(await row(questionId)).toBeUndefined();
    expect((await draft({ ...base, phase: 2, draft: "late" })).body).toEqual({ saved: false });
    expect(await row(questionId)).toBeUndefined();
  });

  it("refuses a bad token and a question that is not in the attempt", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    const bad = await draft({ attemptId: started.attemptId, attemptToken: "nope", questionId, phase: 1, draft: "x" });
    expect(bad.status).toBe(401);
    const other = await draft({ attemptId: started.attemptId, attemptToken: started.attemptToken, questionId: "y12-economics-paragraph-writing.e01p2", phase: 1, draft: "x" });
    expect(other.status).toBe(404);
  });
});
