// The verified-email flag that admin access depends on (spec 002 FR-051; constitution
// Principle VII): carried in the JWT only, never stored.

import { afterEach, describe, expect, it, vi } from "vitest";

import { setupTestEnv, type TestEnv } from "../helpers/env";

let env: TestEnv;
afterEach(async () => {
  vi.unstubAllEnvs();
  await env?.close();
});

async function load() {
  env = await setupTestEnv();
  const callbacks = await import("@/lib/auth.callbacks.server");
  const session = await import("@/lib/session.server");
  return { callbacks, session };
}

const google = (sub: string) => ({ provider: "google", providerAccountId: sub });
const dev = (sub: string) => ({ provider: "dev-login", providerAccountId: sub });

describe("the ev claim", () => {
  it("is true when Google says the email is verified", async () => {
    const { callbacks } = await load();
    const t = await callbacks.jwtCallback({
      token: {},
      user: { id: "g-1", name: "Ann", email: "ann@x.test" },
      account: google("g-1"),
      profile: { email_verified: true },
    });
    expect(t.ev).toBe(true);
  });

  it("is false when the email is not verified, or the profile does not say", async () => {
    const { callbacks } = await load();
    for (const [i, profile] of [{ email_verified: false }, {}, { email_verified: "true" }, undefined].entries()) {
      const t = await callbacks.jwtCallback({
        token: {},
        user: { id: `g-${i}`, name: "Ann", email: "ann@x.test" },
        account: google(`g-${i}`),
        profile,
      });
      expect(t.ev, JSON.stringify(profile)).toBe(false);
    }
  });

  it("counts the dev login as verified only outside production", async () => {
    const { callbacks } = await load();
    vi.stubEnv("NODE_ENV", "development");
    const dev1 = await callbacks.jwtCallback({ token: {}, user: { id: "dev:ann", name: "Ann", email: "ann@dev.local" }, account: dev("dev:ann") });
    expect(dev1.ev).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    const dev2 = await callbacks.jwtCallback({ token: {}, user: { id: "dev:bob", name: "Bob", email: "bob@dev.local" }, account: dev("dev:bob") });
    expect(dev2.ev).toBe(false);
  });

  it("is kept on later calls without a sign-in", async () => {
    const { callbacks } = await load();
    const later = await callbacks.jwtCallback({ token: { uid: "u", ev: true } });
    expect(later.ev).toBe(true);
  });

  it("reaches the session as a boolean, with no other new field", async () => {
    const { callbacks } = await load();
    const t = await callbacks.jwtCallback({
      token: {},
      user: { id: "g-s", name: "Ann", email: "ann@x.test" },
      account: google("g-s"),
      profile: { email_verified: true },
    });
    const s = callbacks.sessionCallback({ session: { user: { name: "Ann" } }, token: t }) as { user: Record<string, unknown> };
    expect(s.user.ev).toBe(true);
    expect(Object.keys(s.user).sort()).toEqual(["email", "ev", "id", "name"]);
    const none = callbacks.sessionCallback({ session: { user: {} }, token: { ...t, ev: undefined } }) as { user: Record<string, unknown> };
    expect(none.user.ev).toBe(false);
  });

  it("is not written to the database", async () => {
    const { callbacks } = await load();
    const t = await callbacks.jwtCallback({
      token: {},
      user: { id: "g-d", name: "Ann", email: "ann@x.test" },
      account: google("g-d"),
      profile: { email_verified: true },
    });
    const { getUser } = await import("@/lib/db/queries/users.server");
    const row = await getUser(env.db, t.uid as string);
    expect(Object.keys(row!)).not.toContain("ev");
    expect(Object.keys(row!).sort()).toEqual(["createdAt", "email", "googleSub", "id", "lastAnswerAt", "lastSignInAt", "name"].sort());
  });
});
