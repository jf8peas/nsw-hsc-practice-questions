// Starting and resuming the paragraph unit through POST /api/attempts (spec 007 FR-001 to FR-005,
// FR-035): the next part in order from recorded marks, one essay in progress, two tabs, an unfinished
// part offered again with its saved state, the finished state, and a database that cannot be read.

import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { attempts, rewriteDrafts } from "@/lib/db/schema";

import {
  PARAGRAPH_UNIT,
  gradeParagraph,
  q,
  restoreParagraphEnv,
  setupParagraphEnv,
  type ParagraphEnv,
} from "../helpers/paragraph";
import { post, signedInStudent } from "../helpers/routes";

let env: ParagraphEnv;
afterEach(async () => {
  restoreParagraphEnv();
  vi.restoreAllMocks();
  await env?.close();
});

async function start() {
  const { POST } = await import("@/app/api/attempts/route");
  const res = await POST(post("/api/attempts", { unitId: PARAGRAPH_UNIT }));
  return { status: res.status, body: await res.json() };
}
const attemptRows = () => env.db.select().from(attempts).where(eq(attempts.unitId, PARAGRAPH_UNIT));

describe("the next part, in order, from recorded marks", () => {
  it("a new student gets essay 1 part 1 as a one-question attempt with the write stage", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const r = await start();
    expect(r.status).toBe(201);
    expect(r.body.questions).toHaveLength(1);
    expect(r.body.questions[0].id).toBe(q(1, 1));
    expect(r.body.persisted).toBe(true);
    expect(r.body.paragraphState.stage).toBe("write");
    expect(r.body.paragraphState.view.part).toBe(1);
    expect(r.body.essay.parts.map((p: { state: string }) => p.state)).toEqual(["next", "later", "later", "later", "later"]);
    const rows = await attemptRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].questionIds).toEqual([q(1, 1)]);
  });

  it("each finished part moves the student to the next, across essays, never skipping one, until the bank is done", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    for (const essay of [1, 2]) {
      for (let part = 1; part <= 5; part++) {
        const r = await start();
        expect(r.status, `essay ${essay} part ${part}`).toBe(201);
        expect(r.body.questions[0].id).toBe(q(essay, part));
        expect(r.body.paragraphState.view.earlier).toHaveLength(part - 1);
        expect(r.body.essay.essayNo).toBe(essay);
        const g = await gradeParagraph(r.body, q(essay, part), "A full-marks answer. [met:abcd]");
        expect(g.body.result.ending).toBe("full_marks");
      }
    }
    // the shipped bank is finished: no attempt is created
    const done = await start();
    expect(done.status).toBe(200);
    expect(done.body).toMatchObject({ finished: true, essayTotal: 2 });
    expect(await attemptRows()).toHaveLength(10);
  });

  it("a part finished with the correction capped still counts, and the essay bar shows the recorded mark", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const first = await start();
    await gradeParagraph(first.body, q(1, 1), "First try. [met:ad]");
    await gradeParagraph(first.body, q(1, 1), "Correction. [met:abcd]", { phase: 2 });
    const second = await start();
    expect(second.body.questions[0].id).toBe(q(1, 2));
    expect(second.body.essay.parts[0]).toMatchObject({ state: "done", mark: 3 });
  });
});

describe("one attempt per part: two tabs and an unfinished part", () => {
  it("two starts at once end on the same attempt (one created, one resumed)", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const [a, b] = await Promise.all([start(), start()]);
    expect(a.body.attemptId).toBe(b.body.attemptId);
    expect([a.status, b.status].sort()).toEqual([200, 201]);
    expect(await attemptRows()).toHaveLength(1);
  });

  it("an unfinished part is offered again as the same attempt, with its saved state", async () => {
    env = await setupParagraphEnv();
    const user = await signedInStudent(env);
    const first = await start();
    // a first try under 4, then the student leaves during the correction
    await gradeParagraph(first.body, q(1, 1), "First try. [met:ad]");
    await env.db.insert(rewriteDrafts).values({ attemptId: first.body.attemptId, userId: user.id, unitId: PARAGRAPH_UNIT, questionId: q(1, 1), phase1Draft: "", phase2Draft: "Half a correction" });
    const again = await start();
    expect(again.status).toBe(200);
    expect(again.body.resumed).toBe(true);
    expect(again.body.attemptId).toBe(first.body.attemptId);
    expect(again.body.questions[0].id).toBe(q(1, 1));
    expect(again.body.paragraphState).toMatchObject({ stage: "correct", draft2: "Half a correction" });
    expect(again.body.paragraphState.phase1.mark).toBe(2);
    expect(await attemptRows()).toHaveLength(1);
  });

  it("restores a saved first draft on the write stage", async () => {
    env = await setupParagraphEnv();
    const user = await signedInStudent(env);
    const first = await start();
    await env.db.insert(rewriteDrafts).values({ attemptId: first.body.attemptId, userId: user.id, unitId: PARAGRAPH_UNIT, questionId: q(1, 1), phase1Draft: "Half a paragraph", phase2Draft: "" });
    const again = await start();
    expect(again.body.paragraphState).toMatchObject({ stage: "write", draft1: "Half a paragraph" });
  });

  it("never shows the discussion of an unmarked part: no discussion object before the part is final", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const first = await start();
    await gradeParagraph(first.body, q(1, 1), "First try. [met:ad]");
    const again = await start();
    expect(again.body.paragraphState.discussion).toBeUndefined();
    expect(JSON.stringify(again.body)).not.toContain("modelPart");
  });
});

describe("weighting and other units", () => {
  it("never weights the draw, whatever tips are uncleared", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    const first = await start();
    await gradeParagraph(first.body, q(1, 1), "Missed tips. [met:a]"); // lots of uncleared tips
    const second = await start();
    expect(second.body.questions[0].id).toBe(q(1, 1)); // still the same unfinished part: the draw is the next part, not weighted
  });
});

describe("a database that cannot be read", () => {
  it("answers 503 temporarily_unavailable and creates nothing (it must not guess a place)", async () => {
    env = await setupParagraphEnv();
    await signedInStudent(env);
    env.databaseDown();
    const r = await start();
    expect(r.status).toBe(503);
    expect(r.body.error).toBe("temporarily_unavailable");
    env.databaseUp();
    expect(await attemptRows()).toHaveLength(0);
  });
});
