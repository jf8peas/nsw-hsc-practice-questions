import { afterEach, describe, expect, it } from "vitest";

import { attempts, users } from "@/lib/db/schema";

import { seedAttempt, seedUser } from "../helpers/fixtures";
import { setupTestEnv, type TestEnv } from "../helpers/env";

let env: TestEnv | undefined;
afterEach(async () => {
  delete process.env.CRON_SECRET;
  await env?.close();
  env = undefined;
});

const SECRET = "cron-secret-value-0123456789";

async function call(headers: Record<string, string> = {}) {
  const { GET } = await import("@/app/api/cron/retention/route");
  const res = await GET(new Request("http://localhost/api/cron/retention", { headers }));
  return { status: res.status, body: await res.json() };
}

describe("GET /api/cron/retention", () => {
  it("answers 503 when CRON_SECRET is not set, even for a request with a header", async () => {
    env = await setupTestEnv();
    const r = await call({ authorization: "Bearer anything" });
    expect(r.status).toBe(503);
    expect((await call()).status).toBe(503);
  });

  it("rejects no header, a wrong token, a wrong scheme and a token of a different length with 401", async () => {
    process.env.CRON_SECRET = SECRET;
    env = await setupTestEnv();
    process.env.CRON_SECRET = SECRET;
    const old = await seedUser(env!.db, { createdAt: new Date("2020-01-01T00:00:00Z"), lastSignInAt: new Date("2020-01-01T00:00:00Z") });
    for (const headers of [
      {},
      { authorization: "" },
      { authorization: "Bearer wrong" },
      { authorization: `Bearer ${SECRET}x` },
      { authorization: `Bearer ${SECRET.slice(0, -1)}` },
      { authorization: `Basic ${SECRET}` },
      { authorization: SECRET },
      { authorization: `bearer ${SECRET}` },
      { authorization: "Bearer " },
    ] as Array<Record<string, string>>) {
      const r = await call(headers);
      expect(r.status, JSON.stringify(headers)).toBe(401);
      expect(r.body).toEqual({ error: "unauthorized" });
    }
    // nothing was deleted by the rejected calls
    expect(await env!.db.select().from(users)).toHaveLength(1);
    expect(old.id).toBeTruthy();
  });

  it("with the correct bearer token runs retention and returns only the two counts", async () => {
    env = await setupTestEnv();
    process.env.CRON_SECRET = SECRET;
    const old = await seedUser(env!.db, { name: "Old Student", email: "old@example.com", createdAt: new Date("2020-01-01T00:00:00Z"), lastSignInAt: new Date("2020-01-01T00:00:00Z") });
    await seedAttempt(env!.db, old.id);
    const fresh = await seedUser(env!.db);
    const r = await call({ authorization: `Bearer ${SECRET}` });
    expect(r.status).toBe(200);
    expect(Object.keys(r.body).sort()).toEqual(["deletedStudents", "prunedUsageRows"]);
    expect(r.body.deletedStudents).toBe(1);
    // no student data in the response
    const text = JSON.stringify(r.body);
    for (const leaked of ["Old Student", "old@example.com", old.id, fresh.id]) expect(text).not.toContain(leaked);
    // and only the retention deletion happened
    const left = await env!.db.select().from(users);
    expect(left.map((u) => u.id)).toEqual([fresh.id]);
    expect(await env!.db.select().from(attempts)).toHaveLength(0);
  });

  it("answers 503 when the database is unavailable (nothing is lost; it runs again tomorrow)", async () => {
    env = await setupTestEnv();
    process.env.CRON_SECRET = SECRET;
    env!.databaseDown();
    const r = await call({ authorization: `Bearer ${SECRET}` });
    expect(r.status).toBe(503);
    expect(r.body).toEqual({ error: "temporarily_unavailable" });
  });

  it("does not use a session: it needs no sign-in and ignores cookies", async () => {
    env = await setupTestEnv();
    process.env.CRON_SECRET = SECRET;
    const r = await call({ authorization: `Bearer ${SECRET}`, cookie: "authjs.session-token=nonsense" });
    expect(r.status).toBe(200);
  });

  it("the route file has no other side effects: it imports only retention, db and crypto helpers", async () => {
    const fs = await import("node:fs");
    const src = fs.readFileSync(new URL("../../app/api/cron/retention/route.ts", import.meta.url), "utf8");
    const imports = [...src.matchAll(/from "([^"]+)"/g)].map((m) => m[1]).sort();
    expect(imports).toEqual(["@/lib/db/index.server", "@/lib/retention.server", "next/server", "node:crypto"].sort());
    expect(src).toContain("timingSafeEqual");
  });
});
