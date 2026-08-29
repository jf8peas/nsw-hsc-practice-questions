import "server-only";

import { createHmac } from "node:crypto";

import { cookies } from "next/headers";

/**
 * Access gate for the paid grading path (short answers / LLM).
 *
 *   CLASS_CODE unset .......... gate off, everything open
 *   CLASS_CODE set ............ students must enter the code once
 *   CLASS_CODE set +
 *     SKIP_CLASS_CODE=true .... gate off again (bypass switch)
 *
 * MC grading is never gated — it costs nothing.
 */

const COOKIE = "pp_access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

function truthy(v: string | undefined): boolean {
  return v === "true" || v === "1" || v === "yes";
}

export function gateEnabled(): boolean {
  if (truthy(process.env.SKIP_CLASS_CODE)) return false;
  return Boolean(process.env.CLASS_CODE);
}

/** Opaque cookie value derived from the code — not reversible, and rotating
 *  CLASS_CODE invalidates every previously issued cookie. */
function accessToken(): string {
  return createHmac("sha256", process.env.CLASS_CODE ?? "")
    .update("physics-practice/access/v1")
    .digest("hex");
}

export function codeMatches(input: string): boolean {
  const code = process.env.CLASS_CODE ?? "";
  return code.length > 0 && input.trim() === code;
}

export async function hasAccess(): Promise<boolean> {
  if (!gateEnabled()) return true;
  const jar = await cookies();
  return jar.get(COOKIE)?.value === accessToken();
}

export async function grantAccess(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, accessToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}
