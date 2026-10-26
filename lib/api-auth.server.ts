import "server-only";

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth.server";
import { DbUnavailableError } from "@/lib/db/index.server";
import type { SessionUser } from "@/lib/session.server";

export const UNAUTHENTICATED = () =>
  NextResponse.json({ error: "unauthenticated" }, { status: 401 });

export const TEMPORARILY_UNAVAILABLE = () =>
  NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });

/**
 * For API routes with no degraded path. Returns the signed-in student, or the
 * response to send: 401 when signed out (or the student no longer exists), 503
 * `temporarily_unavailable` (never 401) when the database is down.
 */
export async function authenticate(): Promise<
  { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  try {
    const user = await requireUser();
    if (!user) return { response: UNAUTHENTICATED() };
    return { user };
  } catch (error) {
    if (error instanceof DbUnavailableError) return { response: TEMPORARILY_UNAVAILABLE() };
    throw error;
  }
}
