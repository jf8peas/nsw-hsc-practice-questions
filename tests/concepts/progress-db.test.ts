// Loading a student's results for concept progress (spec 002 FR-007, FR-014; Principle IX).

import { afterEach, describe, expect, it } from "vitest";

import { conceptProgress } from "@/lib/concepts/progress";
import { listUnitResultsForProgress } from "@/lib/db/queries/results.server";

import { createTestDb, type TestDb } from "../helpers/db";
import { setupTestEnv, type TestEnv } from "../helpers/env";
import { seedAttempt, seedUser } from "../helpers/fixtures";
import { PLAIN, READY, conceptId, readyUnit, plainUnit, seedResultAt } from "../helpers/concept-fixtures";

const A = conceptId("a");
const at = (minute: number) => new Date(Date.UTC(2026, 9, 1, 9, minute, 0));

describe("listUnitResultsForProgress", () => {
  let t: TestDb | undefined;
  afterEach(async () => {
    await t?.close();
    t = undefined;
  });

  it("returns only this student's results for this unit, in answer order", async () => {
    t = await createTestDb();
    const alice = await seedUser(t.db);
    const bob = await seedUser(t.db);
    const aAttempt = await seedAttempt(t.db, alice.id, { unitId: READY });
    const bAttempt = await seedAttempt(t.db, bob.id, { unitId: READY });
    const otherUnit = await seedAttempt(t.db, alice.id, { unitId: PLAIN });

    await seedResultAt(t.db, { attemptId: aAttempt.id, userId: alice.id }, READY, `${READY}.m01`, 0, 1, at(5));
    await seedResultAt(t.db, { attemptId: aAttempt.id, userId: alice.id }, READY, `${READY}.m02`, 1, 1, at(1));
    await seedResultAt(t.db, { attemptId: bAttempt.id, userId: bob.id }, READY, `${READY}.m01`, 0, 1, at(2));
    await seedResultAt(t.db, { attemptId: otherUnit.id, userId: alice.id }, PLAIN, `${PLAIN}.m01`, 0, 1, at(3));

    const rows = await listUnitResultsForProgress(t.db, alice.id, READY);
    expect(rows.map((r) => r.questionId)).toEqual([`${READY}.m02`, `${READY}.m01`]); // by time, not insert order
    expect(rows.every((r) => r.answeredAt instanceof Date)).toBe(true);
    expect(rows[0]).toMatchObject({ marks: 1, max: 1 });
    expect(await listUnitResultsForProgress(t.db, bob.id, READY)).toHaveLength(1);
    expect(await listUnitResultsForProgress(t.db, alice.id, "no-such-unit")).toEqual([]);
  });

  it("orders results with equal times by id", async () => {
    t = await createTestDb();
    const u = await seedUser(t.db);
    const a = await seedAttempt(t.db, u.id, { unitId: READY });
    const same = at(7);
    const one = await seedResultAt(t.db, { attemptId: a.id, userId: u.id }, READY, `${READY}.m01`, 0, 1, same);
    const two = await seedResultAt(t.db, { attemptId: a.id, userId: u.id }, READY, `${READY}.m07`, 1, 1, same);
    const rows = await listUnitResultsForProgress(t.db, u.id, READY);
    expect(rows.map((r) => r.id)).toEqual([one.id, two.id].sort());
  });

  it("a result saved late with an earlier answer time is replayed before a newer answer", async () => {
    t = await createTestDb();
    const u = await seedUser(t.db);
    const a = await seedAttempt(t.db, u.id, { unitId: READY });
    // saved first, answered later:
    await seedResultAt(t.db, { attemptId: a.id, userId: u.id }, READY, `${READY}.m07`, 1, 1, at(30));
    // saved second (a queued save), answered earlier:
    await seedResultAt(t.db, { attemptId: a.id, userId: u.id }, READY, `${READY}.m01`, 0, 1, at(10));
    const rows = await listUnitResultsForProgress(t.db, u.id, READY);
    // wrong at 10 (count 3) then right at 30 (count 2); save order would have given 3
    expect(conceptProgress(readyUnit, rows).map((s) => [s.conceptId, s.count])).toEqual([[A, 2]]);
  });

  it("is served by results_user_unit_created_idx", async () => {
    t = await createTestDb();
    const u = await seedUser(t.db);
    await t.pg.exec("set enable_seqscan = off");
    const plan = await t.pg.query<{ "QUERY PLAN": string }>(
      `explain select id, question_id, marks_awarded, max_marks, created_at
       from results where user_id = $1 and unit_id = $2 order by created_at, id`,
      [u.id, READY],
    );
    expect(plan.rows.map((r) => r["QUERY PLAN"]).join("\n")).toContain("results_user_unit_created_idx");
  });
});

describe("loadUnitConceptProgress", () => {
  let env: TestEnv | undefined;
  afterEach(async () => {
    await env?.close();
    env = undefined;
  });

  async function setup() {
    env = await setupTestEnv();
    const alice = await seedUser(env.db);
    const bob = await seedUser(env.db);
    const aAttempt = await seedAttempt(env.db, alice.id, { unitId: READY });
    const bAttempt = await seedAttempt(env.db, bob.id, { unitId: READY });
    const { loadUnitConceptProgress } = await import("@/lib/db/queries/concepts.server");
    return { alice, bob, aAttempt, bAttempt, loadUnitConceptProgress };
  }

  it("lists the signed-in student's own uncleared concepts and never another student's", async () => {
    const { alice, bob, aAttempt, bAttempt, loadUnitConceptProgress } = await setup();
    await seedResultAt(env!.db, { attemptId: aAttempt.id, userId: alice.id }, READY, `${READY}.m01`, 0, 1, at(1));
    await seedResultAt(env!.db, { attemptId: bAttempt.id, userId: bob.id }, READY, `${READY}.m02`, 0, 1, at(2));

    const mine = await loadUnitConceptProgress(alice.id, readyUnit);
    expect(mine.status).toBe("ok");
    if (mine.status === "ok") expect(mine.data.map((s) => [s.conceptId, s.count])).toEqual([[A, 3]]);
    const his = await loadUnitConceptProgress(bob.id, readyUnit);
    if (his.status === "ok") expect(his.data.map((s) => s.conceptId)).toEqual([conceptId("b")]);
  });

  it("returns an empty list for a student with no results and for a unit that is not concept-ready", async () => {
    const { alice, loadUnitConceptProgress } = await setup();
    expect(await loadUnitConceptProgress(alice.id, readyUnit)).toEqual({ status: "ok", data: [] });
    expect(await loadUnitConceptProgress(alice.id, plainUnit)).toEqual({ status: "ok", data: [] });
  });

  it("reports the database as unavailable instead of throwing", async () => {
    const { alice, loadUnitConceptProgress } = await setup();
    env!.databaseDown();
    expect(await loadUnitConceptProgress(alice.id, readyUnit)).toEqual({ status: "unavailable" });
  });
});
