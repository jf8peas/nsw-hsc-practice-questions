// POST /api/attempts for a unit that opts into the unseen-first draw (spec 012 US2): the same response, five questions
// in group order, no repeat while an unseen question is left, and a quiz that starts even when history cannot be read.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildCaseFactsFixture } from "../helpers/case-facts-fixtures";
import { fixtureContent, seedResultAt } from "../helpers/concept-fixtures";
import { seedAttempt, seedUser } from "../helpers/fixtures";
import { asSessionUser } from "../helpers/env";
import { post, setupRouteEnv, type RouteEnv } from "../helpers/routes";

const { unit, answers } = buildCaseFactsFixture();
const GROUPS = ["mc-china", "mc-nepal", "sa-china", "sa-nepal", "sa-both"];
const KEYS = ["answered", "attemptId", "attemptToken", "passMark", "persisted", "questions", "unitId"];

let env: RouteEnv;
beforeEach(async () => {
  env = await setupRouteEnv();
  fixtureContent([unit], answers);
});
afterEach(async () => {
  vi.doUnmock("@/lib/db/queries/results.server");
  await env.close();
});

async function student() {
  const row = await seedUser(env.db);
  env.signedInAs(asSessionUser(row));
  const attempt = await seedAttempt(env.db, row.id, { unitId: unit.id });
  return { row, base: { attemptId: attempt.id, userId: row.id } };
}

interface Started {
  attemptId: string;
  attemptToken: string;
  persisted: boolean;
  questions: Array<{ id: string; group: string; type: string }>;
}

async function start(): Promise<{ status: number; body: Started }> {
  const { POST } = await import("@/app/api/attempts/route");
  const res = await POST(post("/api/attempts", { unitId: unit.id }));
  return { status: res.status, body: await res.json() };
}

const ids = (body: Started) => body.questions.map((q) => q.id);
const shape = (body: Started) => body.questions.map((q) => q.group);

let minute = 0;
async function answerAll(base: { attemptId: string; userId: string }, questionIds: string[]) {
  for (const id of questionIds) {
    await seedResultAt(env.db, base, unit.id, id, 1, 1, new Date(Date.UTC(2026, 10, 1, 0, (minute += 1))));
  }
}

/** Every question answered except the ones listed. */
async function answerAllBut(base: { attemptId: string; userId: string }, unseen: string[]) {
  await answerAll(base, unit.questions.map((q) => q.id).filter((id) => !unseen.includes(id)));
}
const oneOfEachGroup = GROUPS.map((g) => unit.questions.filter((q) => q.group === g)[5].id);

describe("POST /api/attempts for an unseen-first unit", () => {
  it("keeps the usual response and the five groups in order", async () => {
    await student();
    const { status, body } = await start();
    expect(status).toBe(201);
    expect(Object.keys(body).sort()).toEqual(KEYS);
    expect(body.persisted).toBe(true);
    expect(shape(body)).toEqual(GROUPS);
  });

  it("gives 40 different questions over 8 attempts, then the first attempt's set again", async () => {
    const s = await student();
    const drawn: string[][] = [];
    for (let i = 0; i < 9; i++) {
      const { body } = await start();
      expect(shape(body)).toEqual(GROUPS);
      drawn.push(ids(body));
      await answerAll({ ...s.base, attemptId: body.attemptId }, ids(body)); // one result per question per attempt
    }
    expect(new Set(drawn.slice(0, 8).flat()).size).toBe(40);
    expect(new Set(drawn[8])).toEqual(new Set(drawn[0]));
  });

  it("does not repeat a question answered through the grade route", async () => {
    await student();
    const { POST: grade } = await import("@/app/api/grade/route");
    const first = (await start()).body;
    for (const q of first.questions) {
      const res = await grade(
        post("/api/grade", {
          attemptId: first.attemptId,
          attemptToken: first.attemptToken,
          questionId: q.id,
          answer: q.type === "mc" ? "0" : "An answer.",
        }),
      );
      expect(res.status).toBe(200);
    }
    const second = (await start()).body;
    expect(ids(second).filter((id) => ids(first).includes(id))).toEqual([]);
  });

  it("draws an unanswered question again when it is the only unseen one", async () => {
    const s = await student();
    await answerAllBut(s.base, oneOfEachGroup);
    expect(ids((await start()).body)).toEqual(oneOfEachGroup);
    // drawn but not answered: still unseen
    expect(ids((await start()).body)).toEqual(oneOfEachGroup);
  });

  it("ignores another student's results", async () => {
    const other = await student();
    await answerAllBut(other.base, oneOfEachGroup);
    await student();
    const draws = new Set<string>();
    for (let i = 0; i < 6; i++) draws.add(ids((await start()).body).join());
    expect(draws.size).toBeGreaterThan(1);
  });

  it("starts a quiz, not saved, when the database is down", async () => {
    const s = await student();
    await answerAllBut(s.base, oneOfEachGroup);
    env.databaseDown();
    const { status, body } = await start();
    expect(status).toBe(201);
    expect(body.persisted).toBe(false);
    expect(shape(body)).toEqual(GROUPS);
  });

  it("starts a saved quiz when only the history cannot be read", async () => {
    const { DbUnavailableError } = await import("@/lib/db/index.server");
    vi.doMock("@/lib/db/queries/results.server", async () => ({
      ...(await vi.importActual<typeof import("@/lib/db/queries/results.server")>("@/lib/db/queries/results.server")),
      listUnitResultsForProgress: async () => {
        throw new DbUnavailableError("history unreadable");
      },
    }));
    await student();
    const { status, body } = await start();
    expect(status).toBe(201);
    expect(body.persisted).toBe(true);
    expect(shape(body)).toEqual(GROUPS);
  });
});
