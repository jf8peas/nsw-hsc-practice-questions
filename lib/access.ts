// Edge-safe access decisions for middleware.ts. Plain module: no `server-only`,
// no database, no secrets (it reads only the names of required env variables
// through lib/config.ts).

import { configProblems } from "@/lib/config";

/** Paths reachable without a session. */
const PUBLIC_EXACT = ["/signin", "/api/cron/retention"];
const PUBLIC_PREFIXES = ["/api/auth/"];

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_EXACT.includes(pathname) ||
    pathname === "/api/auth" ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  );
}

/**
 * Only same-origin relative paths are honoured after sign-in. Anything else
 * (absolute URLs, protocol-relative `//host`, backslash tricks) becomes `/`.
 */
export function safeCallbackUrl(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  if (/[\r\n]/.test(raw)) return "/";
  return raw;
}

/** Body of the 503 served when production config is missing. Never names variables. */
export const UNCONFIGURED_BODY = "Service not configured";

export type AccessDecision =
  | { type: "next" }
  | { type: "unconfigured"; missing: string[] }
  | { type: "unauthenticated-api" }
  | { type: "redirect-signin"; callbackUrl: string };

/**
 * Decide what to do with a request.
 *  - In production, missing auth/database config refuses everything (fail closed).
 *  - Public paths pass; otherwise a session is required: pages redirect to
 *    sign-in, API requests get 401.
 */
export function decideAccess(input: {
  pathname: string;
  search?: string;
  authed: boolean;
  nodeEnv?: string;
  env?: Record<string, string | undefined>;
}): AccessDecision {
  const { pathname, search = "", authed, nodeEnv = process.env.NODE_ENV, env = process.env } = input;

  if (nodeEnv === "production") {
    const missing = configProblems(env);
    if (missing.length > 0) return { type: "unconfigured", missing };
  }
  if (isPublicPath(pathname)) return { type: "next" };
  if (authed) return { type: "next" };
  if (pathname.startsWith("/api/")) return { type: "unauthenticated-api" };
  return { type: "redirect-signin", callbackUrl: safeCallbackUrl(pathname + search) };
}
