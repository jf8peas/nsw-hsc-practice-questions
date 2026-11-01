// POST/DELETE /api/units/[unitId]/archive: per-student unit archiving from the home page.
// The server re-checks the unit exists and, for archive, that it is 14+ Sydney days old;
// unarchive is always allowed. Never 401 when the database is down (503 like other routes).

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { unitArchives } from "@/lib/db/schema";
import { sydneyDate } from "@/lib/sydney";
import type { Unit } from "@/lib/types";

import { fixtureContent } from "../helpers/concept-fixtures";
import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";

const OLD = "fx-old";
const FRESH = "fx-fresh";

const unit = (id: string, created: string): Unit => ({
  id,
  year: "Year 12",
  topic: "Fixtures",
  type: "Topic Quiz",
  title: id,
  description: "",
  created,
  order: 0,
  questions: [],
});

let env: TestEnv;
beforeEach(async () => {
  env = await setupTestEnv();
  fixtureContent([
    unit(OLD, sydneyDate(new Date(Date.now() - 30 * 86_400_000))), // 30 days old → archivable
    unit(FRESH, sydneyDate(new Date(Date.now() - 5 * 86_400_000))), // 5 days old → too young
  ]);
});
afterEach(async () => {
  await env.close();
});

async function student() {
  const row = await seedUser(env.db);
  env.signedInAs(asSessionUser(row));
  return row;
}

async function call(method: "POST" | "DELETE", unitId: string) {
  const route = await import("@/app/api/units/[unitId]/archive/route");
  const handler = method === "POST" ? route.POST : route.DELETE;
  const res = await handler(new Request(`http://localhost/api/units/${unitId}/archive`, { method }), {
    params: Promise.resolve({ unitId }),
  });
  return { status: res.status, body: await res.json() };
}

const archivesOf = async (userId: string) =>
  (
    await env.db
      .select({ unitId: unitArchives.unitId })
      .from(unitArchives)
      .where(eq(unitArchives.userId, userId))
  ).map((r) => r.unitId);

describe("POST /api/units/[unitId]/archive", () => {
  it("401 when signed out", async () => {
    env.signedOut();
    expect((await call("POST", OLD)).status).toBe(401);
  });

  it("archives an old unit for the signed-in student", async () => {
    const me = await student();
    const res = await call("POST", OLD);
    expect(res.status).toBe(200);
    expect(await archivesOf(me.id)).toEqual([OLD]);
  });

  it("archiving twice is a no-op", async () => {
    const me = await student();
    await call("POST", OLD);
    await call("POST", OLD);
    expect(await archivesOf(me.id)).toEqual([OLD]);
  });

  it("rejects a unit that is not yet 14 days old", async () => {
    await student();
    const res = await call("POST", FRESH);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "too_young" });
  });

  it("404 for an unknown unit", async () => {
    await student();
    expect((await call("POST", "nope")).status).toBe(404);
  });

  it("503 (never 401) when the database is down", async () => {
    await student();
    env.databaseDown();
    const res = await call("POST", OLD);
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: "temporarily_unavailable" });
  });
});

describe("DELETE /api/units/[unitId]/archive", () => {
  it("unarchives a unit, and unarchive of an unarchived unit is a no-op", async () => {
    const me = await student();
    await call("POST", OLD);
    expect(await archivesOf(me.id)).toEqual([OLD]);

    const res = await call("DELETE", OLD);
    expect(res.status).toBe(200);
    expect(await archivesOf(me.id)).toEqual([]);

    expect((await call("DELETE", FRESH)).status).toBe(200);
  });

  it("always allows unarchive, whatever the unit's age", async () => {
    await student();
    // the 14-day rule is for archiving only; restoring is never blocked
    expect((await call("DELETE", FRESH)).status).toBe(200);
  });

  it("404 for an unknown unit", async () => {
    await student();
    expect((await call("DELETE", "nope")).status).toBe(404);
  });

  it("503 when the database is down", async () => {
    await student();
    env.databaseDown();
    expect((await call("DELETE", OLD)).status).toBe(503);
  });
});

describe("per student", () => {
  it("one student's archives never touch another's rows", async () => {
    const me = await student();
    await call("POST", OLD);

    const bob = await seedUser(env.db);
    expect(await archivesOf(bob.id)).toEqual([]);

    env.signedInAs(asSessionUser(bob));
    await call("DELETE", OLD); // a no-op for bob — and must not delete mine
    expect(await archivesOf(me.id)).toEqual([OLD]);
  });
});
