// The teacher allow-list (spec 002 FR-051; constitution Principle VII): ADMIN_EMAILS is read on the
// server on every call, matches case-insensitively, and only counts a verified email.

import { afterEach, describe, expect, it, vi } from "vitest";

import { asSessionUser, setupTestEnv, type TestEnv } from "./helpers/env";
import { seedUser } from "./helpers/fixtures";

let env: TestEnv | undefined;
afterEach(async () => {
  vi.unstubAllEnvs();
  await env?.close();
  env = undefined;
});

async function admin() {
  env = await setupTestEnv();
  return import("@/lib/admin.server");
}

const verified = (email: string) => ({ email, ev: true });

describe("isAdmin", () => {
  it("splits on commas, trims, and ignores case", async () => {
    const { isAdmin } = await admin();
    vi.stubEnv("ADMIN_EMAILS", "  Teacher@School.test , second@school.test ");
    expect(isAdmin(verified("teacher@school.test"))).toBe(true);
    expect(isAdmin(verified("TEACHER@SCHOOL.TEST"))).toBe(true);
    expect(isAdmin(verified("second@school.test"))).toBe(true);
    expect(isAdmin(verified("third@school.test"))).toBe(false);
  });

  it("admits nobody when the list is empty, unset, or only whitespace and commas", async () => {
    const { isAdmin } = await admin();
    for (const value of ["", "   ", ",, ,"]) {
      vi.stubEnv("ADMIN_EMAILS", value);
      expect(isAdmin(verified(""))).toBe(false);
      expect(isAdmin(verified("a@b.test"))).toBe(false);
    }
    vi.unstubAllEnvs();
    delete process.env.ADMIN_EMAILS;
    expect(isAdmin(verified("a@b.test"))).toBe(false);
  });

  it("refuses a listed email whose verification is missing or false", async () => {
    const { isAdmin } = await admin();
    vi.stubEnv("ADMIN_EMAILS", "t@school.test");
    expect(isAdmin({ email: "t@school.test" })).toBe(false);
    expect(isAdmin({ email: "t@school.test", ev: false })).toBe(false);
    expect(isAdmin({ email: "t@school.test", ev: true })).toBe(true);
  });

  it("refuses a missing identity", async () => {
    const { isAdmin } = await admin();
    vi.stubEnv("ADMIN_EMAILS", "t@school.test");
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("reads the list on every call", async () => {
    const { isAdmin } = await admin();
    vi.stubEnv("ADMIN_EMAILS", "a@x.test");
    expect(isAdmin(verified("b@x.test"))).toBe(false);
    vi.stubEnv("ADMIN_EMAILS", "a@x.test,b@x.test");
    expect(isAdmin(verified("b@x.test"))).toBe(true);
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isAdmin(verified("b@x.test"))).toBe(false);
  });
});

describe("authenticateAdmin", () => {
  it("401 signed out, 403 for a student, 403 unverified, the user for a verified teacher", async () => {
    const { authenticateAdmin } = await admin();
    const row = await seedUser(env!.db, { email: "t@school.test" });
    vi.stubEnv("ADMIN_EMAILS", "t@school.test");

    env!.signedOut();
    expect((await authenticateAdmin()).response?.status).toBe(401);

    env!.signedInAs(asSessionUser(row)); // no verified flag
    const unverified = await authenticateAdmin();
    expect(unverified.response?.status).toBe(403);
    expect(await unverified.response?.json()).toEqual({ error: "forbidden" });

    const student = await seedUser(env!.db, { email: "s@school.test" });
    env!.signedInAs(asSessionUser(student, true));
    expect((await authenticateAdmin()).response?.status).toBe(403);

    env!.signedInAs(asSessionUser(row, true));
    const ok = await authenticateAdmin();
    expect(ok.response).toBeUndefined();
    expect(ok.user?.email).toBe("t@school.test");
  });

  it("503, never 401, when the database is down", async () => {
    const { authenticateAdmin } = await admin();
    const row = await seedUser(env!.db, { email: "t@school.test" });
    vi.stubEnv("ADMIN_EMAILS", "t@school.test");
    env!.signedInAs(asSessionUser(row, true));
    env!.databaseDown();
    expect((await authenticateAdmin()).response?.status).toBe(503);
  });
});

describe("requireAdminPage", () => {
  it("redirects a signed-out visitor, 404s a non-teacher, returns a verified teacher", async () => {
    const { requireAdminPage } = await admin();
    const row = await seedUser(env!.db, { email: "t@school.test" });
    vi.stubEnv("ADMIN_EMAILS", "t@school.test");

    env!.signedOut();
    await expect(requireAdminPage()).rejects.toMatchObject({ digest: expect.stringContaining("/signin") });

    env!.signedInAs(asSessionUser(row)); // unverified
    await expect(requireAdminPage()).rejects.toMatchObject({ digest: expect.stringContaining("404") });

    env!.signedInAs(asSessionUser(row, true));
    await expect(requireAdminPage()).resolves.toMatchObject({ email: "t@school.test" });
  });
});
