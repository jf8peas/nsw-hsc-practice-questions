import { afterEach, describe, expect, it } from "vitest";

import { setupTestEnv, type TestEnv } from "../helpers/env";

let env: TestEnv;

afterEach(async () => {
  await env?.close();
});

async function load() {
  env = await setupTestEnv();
  const callbacks = await import("@/lib/auth.callbacks.server");
  const session = await import("@/lib/session.server");
  const { getUser } = await import("@/lib/db/queries/users.server");
  return { callbacks, session, getUser };
}

const google = (sub: string) => ({ provider: "google", providerAccountId: sub });

describe("sign-in creates and refreshes the student", () => {
  it("first sign-in inserts a user with created_at and last_sign_in_at set", async () => {
    const { callbacks, getUser } = await load();
    const token = await callbacks.jwtCallback({
      token: { name: "Ann", email: "ann@x.test", picture: "https://photo", sub: "g-1" },
      user: { id: "g-1", name: "Ann", email: "ann@x.test" },
      account: google("g-1"),
    });
    const row = await getUser(env.db, token.uid as string);
    expect(row).not.toBeNull();
    expect(row!.googleSub).toBe("g-1");
    expect(row!.createdAt).toBeInstanceOf(Date);
    expect(row!.lastSignInAt).toBeInstanceOf(Date);
    expect(row!.lastAnswerAt).toBeNull();
  });

  it("a second sign-in updates name, email and last_sign_in_at but not created_at", async () => {
    const { callbacks, getUser } = await load();
    const first = await callbacks.jwtCallback({
      token: {},
      user: { id: "g-2", name: "Old Name", email: "old@x.test" },
      account: google("g-2"),
    });
    const before = await getUser(env.db, first.uid as string);
    await new Promise((r) => setTimeout(r, 15));
    const second = await callbacks.jwtCallback({
      token: {},
      user: { id: "g-2", name: "New Name", email: "new@x.test" },
      account: google("g-2"),
    });
    expect(second.uid).toBe(first.uid);
    const after = await getUser(env.db, first.uid as string);
    expect(after!.name).toBe("New Name");
    expect(after!.email).toBe("new@x.test");
    expect(after!.createdAt.getTime()).toBe(before!.createdAt.getTime());
    expect(after!.lastSignInAt.getTime()).toBeGreaterThan(before!.lastSignInAt.getTime());
  });

  it("after the row is deleted, signing in again creates a new row with a new id (FR-027)", async () => {
    const { callbacks, getUser } = await load();
    const first = await callbacks.jwtCallback({
      token: {},
      user: { id: "g-3", name: "Ann", email: "ann@x.test" },
      account: google("g-3"),
    });
    await env.testDb.pg.query("delete from users where id = $1", [first.uid]);
    expect(await getUser(env.db, first.uid as string)).toBeNull();
    const again = await callbacks.jwtCallback({
      token: {},
      user: { id: "g-3", name: "Ann", email: "ann@x.test" },
      account: google("g-3"),
    });
    expect(again.uid).not.toBe(first.uid);
    const fresh = await getUser(env.db, again.uid as string);
    expect(fresh!.createdAt.getTime()).toBeGreaterThanOrEqual(Date.now() - 60_000);
  });

  it("the stored user row has only the Principle II columns (no photo, no tokens)", async () => {
    const { callbacks, getUser } = await load();
    const t = await callbacks.jwtCallback({
      token: { picture: "https://photo" },
      user: { id: "g-4", name: "Ann", email: "ann@x.test" },
      account: google("g-4"),
    });
    const row = await getUser(env.db, t.uid as string);
    expect(Object.keys(row!).sort()).toEqual(
      ["createdAt", "email", "googleSub", "id", "lastAnswerAt", "lastSignInAt", "name"].sort(),
    );
  });
});

describe("the JWT keeps only uid, name and email", () => {
  it("drops the picture and never copies provider tokens", async () => {
    const { callbacks } = await load();
    const token = await callbacks.jwtCallback({
      token: { name: "Ann", email: "ann@x.test", picture: "https://photo", sub: "g-5" },
      user: { id: "g-5", name: "Ann", email: "ann@x.test" },
      account: {
        provider: "google",
        providerAccountId: "g-5",
        // @ts-expect-error extra fields a real account carries; they must not reach the token
        access_token: "SECRET-ACCESS",
        id_token: "SECRET-ID",
        refresh_token: "SECRET-REFRESH",
      },
    });
    expect(token.picture).toBeUndefined();
    expect(token.uid).toMatch(/^[0-9a-f-]{36}$/);
    expect(token.name).toBe("Ann");
    expect(token.email).toBe("ann@x.test");
    expect(JSON.stringify(token)).not.toContain("SECRET");
    expect(Object.keys(token).filter((k) => token[k as keyof typeof token] !== undefined).sort()).toEqual(
      ["email", "ev", "name", "sub", "uid"], // ev: the verified-email flag, in the JWT only
    );
  });

  it("returns the token unchanged on later calls (no sign-in event)", async () => {
    const { callbacks } = await load();
    const token = { uid: "x", name: "n", email: "e" };
    await expect(callbacks.jwtCallback({ token })).resolves.toBe(token);
  });

  it("sessionCallback exposes id, name and email from the token", async () => {
    const { callbacks } = await load();
    const uid = "6f0b6a53-3a39-4a3e-8d5b-0b2f6f3c9d11";
    const s = callbacks.sessionCallback({
      session: { user: {}, expires: "x" },
      token: { uid, name: "Ann", email: "ann@x.test" },
    });
    expect(s.user).toEqual({ id: uid, name: "Ann", email: "ann@x.test", ev: false });
  });
});
