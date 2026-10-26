import { vi } from "vitest";

import type { Db } from "@/lib/db/index.server";
import type { SessionUser } from "@/lib/session.server";

import { createTestDb, type TestDb } from "./db";

export interface TestEnv {
  db: Db;
  testDb: TestDb;
  state: {
    down: boolean;
    delayMs: number;
    identity: SessionUser | null;
    /** Number of database calls made so far (through dbCall). */
    calls: number;
    /** After this many calls, every further call fails with a connection error. */
    failAfter: number | null;
    /** After this many calls, every further call is slow by `ms`. */
    slowAfter: { n: number; ms: number } | null;
    /** Every call fails with an ordinary (non-connection) error. */
    genericError: boolean;
  };
  /** Act as this signed-in student (the JWT is valid; the real user-row lookup still runs). */
  signedInAs(user: SessionUser): void;
  signedOut(): void;
  /** Database fully unreachable: every call fails with a connection error. */
  databaseDown(): void;
  databaseUp(): void;
  /** Every database call takes this long (to exercise the timeout). */
  databaseSlow(ms: number): void;
  /** Let `n` more calls succeed, then fail every call with a connection error. */
  failAfterCalls(n: number): void;
  /** Let `n` more calls succeed, then make every call take `ms`. */
  slowAfterCalls(n: number, ms: number): void;
  /** Reset the call counter and any failAfter / slowAfter rules. */
  resetCalls(): void;
  close(): Promise<void>;
}

/** Make a SessionUser from a seeded users row. */
export function asSessionUser(row: { id: string; name: string; email: string }): SessionUser {
  return { id: row.id, name: row.name, email: row.email };
}

/**
 * Build an isolated environment for route/page tests:
 *  - a PGlite database with the real migrations,
 *  - `@/lib/db/index.server` mocked so `getDb`/`dbCall` use it (and can be made to fail or stall),
 *  - `@/lib/auth.server` mocked to a controllable identity while the REAL
 *    user-row lookup (lib/session.server.ts) still runs.
 *
 * Call this first, then `await import(...)` the module under test.
 */
export async function setupTestEnv(): Promise<TestEnv> {
  vi.resetModules();
  process.env.AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
  const testDb = await createTestDb();
  const state: TestEnv["state"] = {
    down: false,
    delayMs: 0,
    identity: null,
    calls: 0,
    failAfter: null,
    slowAfter: null,
    genericError: false,
  };

  const connectionError = () =>
    Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } });
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  vi.doMock("@/lib/db/index.server", async () => {
    const actual = await vi.importActual<typeof import("@/lib/db/index.server")>(
      "@/lib/db/index.server",
    );
    return {
      ...actual,
      getDb: () => {
        if (state.down) throw connectionError();
        return testDb.db;
      },
      dbCall: <T>(fn: (db: Db) => PromiseLike<T>, ms: number = actual.DB_TIMEOUT_MS) =>
        actual.withDbTimeout(async () => {
          const index = ++state.calls;
          if (state.genericError) throw new Error("boom: not a connection error");
          if (state.down || (state.failAfter !== null && index > state.failAfter)) {
            throw connectionError();
          }
          if (state.delayMs) await sleep(state.delayMs);
          if (state.slowAfter && index > state.slowAfter.n) await sleep(state.slowAfter.ms);
          return fn(testDb.db);
        }, ms),
    };
  });

  vi.doMock("@/lib/auth.server", async () => {
    const session = await import("@/lib/session.server");
    return {
      resolveSession: () => session.resolveIdentity(state.identity),
      requireUser: () => session.requireUserFrom(state.identity),
      requirePageUser: () => session.requirePageUserFrom(state.identity),
    };
  });

  return {
    db: testDb.db,
    testDb,
    state,
    signedInAs: (user) => {
      state.identity = user;
    },
    signedOut: () => {
      state.identity = null;
    },
    databaseDown: () => {
      state.down = true;
    },
    databaseUp: () => {
      state.down = false;
      state.delayMs = 0;
      state.failAfter = null;
      state.slowAfter = null;
    },
    databaseSlow: (ms) => {
      state.delayMs = ms;
    },
    failAfterCalls: (n) => {
      state.failAfter = state.calls + n;
    },
    slowAfterCalls: (n, ms) => {
      state.slowAfter = { n: state.calls + n, ms };
    },
    resetCalls: () => {
      state.calls = 0;
      state.failAfter = null;
      state.slowAfter = null;
    },
    close: () => testDb.close(),
  };
}
