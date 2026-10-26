import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { PgDatabase } from "drizzle-orm/pg-core";

import * as schema from "./schema";

/**
 * Driver-agnostic database type. Query modules take a `Db` as their first
 * argument so tests can pass an in-process PGlite database instead of Neon.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<any, typeof schema>;

/** Default budget for any database call on a request path (research R19). */
export const DB_TIMEOUT_MS = 1500;

/**
 * Thrown when the database cannot be reached: a timeout or a connection-level
 * error. Callers treat it as "the database is unavailable" and degrade
 * (Principle VI). Every other error propagates unchanged and is an ordinary 500.
 */
export class DbUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "DbUnavailableError";
  }
}

const NETWORK_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "EPIPE",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
  "CERT_HAS_EXPIRED",
]);

const CONNECTION_MESSAGE =
  /fetch failed|failed to connect|connection (terminated|refused|closed|timeout)|socket hang up|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|getaddrinfo/i;

/** True for network/connection-level failures (walks the `cause` chain). */
export function isConnectionError(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  for (let depth = 0; depth < 6 && current && typeof current === "object"; depth++) {
    if (seen.has(current)) break;
    seen.add(current);
    const e = current as { code?: unknown; message?: unknown; cause?: unknown };
    const code = typeof e.code === "string" ? e.code : "";
    if (
      NETWORK_CODES.has(code) ||
      code.startsWith("08") || // PostgreSQL class 08: connection exception
      code === "57P01" || // admin_shutdown
      code === "57P02" || // crash_shutdown
      code === "57P03" || // cannot_connect_now
      code === "53300" // too_many_connections
    ) {
      return true;
    }
    if (typeof e.message === "string" && CONNECTION_MESSAGE.test(e.message)) return true;
    current = e.cause;
  }
  return false;
}

/**
 * Await a database call with a deadline. A timeout or connection-level error
 * becomes a DbUnavailableError; anything else is rethrown untouched.
 */
export async function withDbTimeout<T>(
  work: PromiseLike<T> | (() => PromiseLike<T>),
  ms: number = DB_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new DbUnavailableError(`database call exceeded ${ms} ms`)),
      ms,
    );
  });
  try {
    const promise = Promise.resolve(typeof work === "function" ? work() : work);
    return await Promise.race([promise, timeout]);
  } catch (error) {
    if (error instanceof DbUnavailableError) throw error;
    if (isConnectionError(error)) {
      throw new DbUnavailableError("database connection failed", { cause: error });
    }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

let cached: Db | null = null;

/** The shared Neon + Drizzle client, created on first use. */
export function getDb(): Db {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  cached = drizzle({ client: neon(url), schema }) as unknown as Db;
  return cached;
}

/**
 * Run `fn` against the shared database with the standard request-path timeout.
 * Use this from routes and pages; pure query modules take `db` directly.
 */
export function dbCall<T>(fn: (db: Db) => PromiseLike<T>, ms: number = DB_TIMEOUT_MS): Promise<T> {
  return withDbTimeout(() => fn(getDb()), ms);
}
