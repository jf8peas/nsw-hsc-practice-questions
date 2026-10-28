// POST /api/attempts draws weighted toward the student's weak concepts (spec 002 US4; FR-033 to
// FR-038, FR-046), without changing the response or token shape.

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedUser } from "../helpers/fixtures";
import { post } from "../helpers/routes";
import { PLAIN, READY, conceptId, fixtureContent, seedResultAt } from "../helpers/concept-fixtures";

let env: TestEnv;

beforeEach(async () => {
  env = await setupTestEnv();
  fixtureContent();
});
afterEach(async () => {
  await env.close();
});

async function student() {
  const row = await seedUser(env.db);
  env.signedInAs(asSessionUser(row));
  const attempt = await seedAttempt(env.db, row.id, { unitId: READY });
  return { row, base: { attemptId: attempt.id, userId: row.id } };
}

async function start(unitId = READY) {
  const { POST } = await import("@/app/api/attempts/route");
  const res = await POST(post("/api/attempts", { unitId }));
  return { res, body: await res.json() };
}

const conceptOf = (id: string) => readyConceptOf.get(id);
const readyConceptOf = new Map<string, string | undefined>();

describe("a student with weak concepts", () => {
  it("gets at least half the places on those concepts, with the usual response shape", async () => {
    const s = await student();
    // miss one question on each of concepts a, b and c
    for (const q of ["m01", "m02", "m03"]) await seedResultAt(env.db, s.base, READY, `${READY}.${q}`, 0, 1, new Date());
    const { getUnit } = await import("@/content");
    for (const q of getUnit(READY)!.questions) readyConceptOf.set(q.id, q.concept);

    for (let i = 0; i < 8; i++) {
      const { res, body } = await start();
      expect(res.status).toBe(201);
      expect(Object.keys(body).sort()).toEqual(
        ["answered", "attemptId", "attemptToken", "passMark", "persisted", "questions", "unitId"].sort(),
      );
      expect(body.questions).toHaveLength(8);
      const weak = body.questions.filter((q: { id: string }) =>
        [conceptId("a"), conceptId("b"), conceptId("c")].includes(conceptOf(q.id)!),
      );
      expect(weak.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("never lets the weighting out to the client", async () => {
    const s = await student();
    await seedResultAt(env.db, s.base, READY, `${READY}.m01`, 0, 1, new Date());
    const { body } = await start();
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/weight|uncleared|lastMissed|"count"/i);
  });
});

describe("when there is nothing to weight", () => {
  it("a student with no weak concepts gets an ordinary draw", async () => {
    await student();
    const { res, body } = await start();
    expect(res.status).toBe(201);
    expect(body.questions).toHaveLength(8);
  });

  it("a unit that has not adopted concepts is drawn as before", async () => {
    await student();
    const { res, body } = await start(PLAIN);
    expect(res.status).toBe(201);
    expect(body.questions).toHaveLength(3);
  });

  it("a student whose results cannot be read still gets a quiz", async () => {
    const s = await student();
    await seedResultAt(env.db, s.base, READY, `${READY}.m01`, 0, 1, new Date());
    env.databaseDown();
    const { res, body } = await start();
    expect(res.status).toBe(201);
    expect(body.persisted).toBe(false);
    expect(body.questions).toHaveLength(8);
  });
});
