// POST /api/paragraph/flag (spec 007 FR-029): stored once, idempotent across tabs, never changes a
// mark, only for a final marker-marked answer, scoped to the session student.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";

import { paragraphPhases, results } from "@/lib/db/schema";

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
  delete process.env.FLAG_RATE_LIMIT;
  await env?.close();
});

async function flag(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/paragraph/flag/route");
  const res = await POST(post("/api/paragraph/flag", body));
  return { status: res.status, body: await res.json() };
}
const phase = async (qid: string) => (await env.db.select().from(paragraphPhases).where(eq(paragraphPhases.questionId, qid)))[0];

async function finalAnswer(text = "Perfect. [met:abcd]") {
  env = await setupParagraphEnv();
  const user = await signedInStudent(env);
  const { started, questionId } = await startParagraph();
  await gradeParagraph(started, questionId, text);
  return { user, started, questionId, req: { attemptId: started.attemptId, attemptToken: started.attemptToken, questionId } };
}

describe("POST /api/paragraph/flag", () => {
  it("stores the flag once and never touches the mark or the result", async () => {
    const { questionId, req } = await finalAnswer();
    const before = (await env.db.select().from(results).where(eq(results.questionId, questionId)))[0];
    const first = await flag(req);
    expect(first).toEqual({ status: 200, body: { flagged: true } });
    const row = await phase(questionId);
    expect(row.flaggedAt).not.toBeNull();
    expect(row.recordedMark).toBe(4);
    const after = (await env.db.select().from(results).where(eq(results.questionId, questionId)))[0];
    expect(after).toEqual(before);
  });

  it("a repeat (or another tab) is the same done state and changes nothing", async () => {
    const { questionId, req } = await finalAnswer();
    await flag(req);
    const flaggedAt = (await phase(questionId)).flaggedAt;
    const again = await flag(req);
    expect(again).toEqual({ status: 200, body: { flagged: true, already: true } });
    expect((await phase(questionId)).flaggedAt).toEqual(flaggedAt);
  });

  it("is refused while the part is still on the correction", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const { started, questionId } = await startParagraph();
    await gradeParagraph(started, questionId, "First try. [met:ad]");
    const r = await flag({ attemptId: started.attemptId, attemptToken: started.attemptToken, questionId });
    expect(r).toEqual({ status: 409, body: { error: "not_final" } });
    expect((await phase(questionId)).flaggedAt).toBeNull();
  });

  it("rejects a bad body, a bad token, an unknown question and another student", async () => {
    const { started, questionId, req } = await finalAnswer();
    expect((await flag({})).status).toBe(400);
    expect((await flag({ ...req, attemptToken: "nope" })).status).toBe(401);
    expect((await flag({ ...req, questionId: "y12-economics-paragraph-writing.e01p2" })).status).toBe(404);
    expect((await flag({ ...req, questionId: "y11-physics-preliminary.q1" })).status).toBe(404);

    await signedInStudent(env); // a different student
    const other = await flag({ attemptId: started.attemptId, attemptToken: started.attemptToken, questionId });
    expect(other.status).toBe(401); // the token is bound to the first student
    expect((await phase(questionId)).flaggedAt).toBeNull();
  });

  it("reads only attemptId, questionId and the token (extra fields are ignored)", async () => {
    const { questionId, req } = await finalAnswer();
    const r = await flag({ ...req, marks: 0, userId: "someone-else", recordedMark: 0 });
    expect(r.status).toBe(200);
    expect((await phase(questionId)).recordedMark).toBe(4);
  });

  it("is rate limited", async () => {
    process.env.FLAG_RATE_LIMIT = "1";
    const { req } = await finalAnswer();
    expect((await flag(req)).status).toBe(200);
    const second = await flag(req);
    expect(second.status).toBe(429);
    expect(second.body.error).toBe("rate_limited");
  });
});
