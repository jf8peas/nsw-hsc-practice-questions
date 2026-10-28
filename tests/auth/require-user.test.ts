import { afterEach, describe, expect, it } from "vitest";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";

let env: TestEnv;

afterEach(async () => {
  await env?.close();
});

async function load() {
  env = await setupTestEnv();
  const session = await import("@/lib/session.server");
  const { DbUnavailableError } = await import("@/lib/db/index.server");
  return { session, DbUnavailableError };
}

describe("resolveIdentity / requireUser", () => {
  it("returns the user when the session uid has a row", async () => {
    const { session } = await load();
    const row = await seedUser(env.db);
    const id = asSessionUser(row);
    await expect(session.resolveIdentity(id)).resolves.toEqual({ kind: "user", user: id });
    await expect(session.requireUserFrom(id)).resolves.toEqual(id);
  });

  it("returns none/null when there is no session", async () => {
    const { session } = await load();
    await expect(session.resolveIdentity(null)).resolves.toEqual({ kind: "none", reason: "signed_out" });
    await expect(session.requireUserFrom(null)).resolves.toBeNull();
  });

  it("returns none/null when the uid row has been deleted (FR-027)", async () => {
    const { session } = await load();
    const row = await seedUser(env.db);
    const id = asSessionUser(row);
    await env.testDb.pg.query("delete from users where id = $1", [row.id]);
    await expect(session.resolveIdentity(id)).resolves.toEqual({
      kind: "none",
      reason: "student_missing",
    });
    await expect(session.requireUserFrom(id)).resolves.toBeNull();
  });

  it("treats a malformed uid as signed out without touching the database", async () => {
    const { session } = await load();
    env.databaseDown();
    await expect(
      session.resolveIdentity({ id: "not-a-uuid", name: "n", email: "e" }),
    ).resolves.toEqual({ kind: "none", reason: "signed_out" });
  });

  it("returns unverified when the database is unreachable", async () => {
    const { session } = await load();
    const row = await seedUser(env.db);
    const id = asSessionUser(row);
    env.databaseDown();
    await expect(session.resolveIdentity(id)).resolves.toEqual({ kind: "unverified", user: id });
  });

  it("returns unverified when the lookup exceeds the 1500 ms timeout", async () => {
    const { session } = await load();
    const row = await seedUser(env.db);
    const id = asSessionUser(row);
    env.databaseSlow(1700);
    await expect(session.resolveIdentity(id)).resolves.toEqual({ kind: "unverified", user: id });
  });

  it("propagates a non-connection error as an ordinary failure (a 500)", async () => {
    const { session, DbUnavailableError } = await load();
    const row = await seedUser(env.db);
    await env.testDb.pg.exec("drop table users cascade");
    const err = await session.resolveIdentity(asSessionUser(row)).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(DbUnavailableError);
  });

  it("requireUser throws DbUnavailableError for an unverified session (routes answer 503, never 401)", async () => {
    const { session, DbUnavailableError } = await load();
    const row = await seedUser(env.db);
    env.databaseDown();
    await expect(session.requireUserFrom(asSessionUser(row))).rejects.toBeInstanceOf(
      DbUnavailableError,
    );
  });
});

describe("requirePageUser", () => {
  it("redirects a signed-out visitor to /signin", async () => {
    const { session } = await load();
    await expect(session.requirePageUserFrom(null)).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
    });
  });

  it("returns the identity from the JWT with degraded: true when the database is down", async () => {
    const { session } = await load();
    const row = await seedUser(env.db);
    const id = asSessionUser(row);
    env.databaseDown();
    await expect(session.requirePageUserFrom(id)).resolves.toEqual({ user: id, degraded: true });
  });

  it("returns degraded: false when the row exists", async () => {
    const { session } = await load();
    const row = await seedUser(env.db);
    const id = asSessionUser(row);
    await expect(session.requirePageUserFrom(id)).resolves.toEqual({ user: id, degraded: false });
  });
});

describe("identityFromClaims", () => {
  it("accepts uid/name/email claims and rejects anything without a valid uid", async () => {
    const { session } = await load();
    const uid = "6f0b6a53-3a39-4a3e-8d5b-0b2f6f3c9d11";
    expect(session.identityFromClaims({ uid, name: "A", email: "a@x" })).toEqual({
      id: uid,
      name: "A",
      email: "a@x",
      ev: false, // not verified unless the claim says so
    });
    expect(session.identityFromClaims({ uid, name: "A", email: "a@x", ev: true })?.ev).toBe(true);
    expect(session.identityFromClaims({ uid: "nope" })).toBeNull();
    expect(session.identityFromClaims({})).toBeNull();
    expect(session.identityFromClaims(null)).toBeNull();
  });
});
