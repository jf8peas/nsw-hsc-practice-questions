import "server-only";

import { NextResponse } from "next/server";
import { notFound } from "next/navigation";

import { authenticate } from "@/lib/api-auth.server";
import { requirePageUser } from "@/lib/auth.server";
import type { SessionUser } from "@/lib/session.server";

/**
 * Who may review and regenerate shared concept content (spec 002 FR-051; constitution
 * Principle VII). The only file that reads `ADMIN_EMAILS`: a comma-separated list, read on
 * every call so a change takes effect at once. An empty or unset list admits nobody, and a
 * listed email counts only when the sign-in provider verified it (`ev`), so an unverified
 * address cannot be claimed.
 */
export function isAdmin(user: { email: string; ev?: boolean } | null | undefined): boolean {
  if (!user || user.ev !== true) return false;
  const email = user.email.trim().toLowerCase();
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email);
}

/**
 * For teacher pages: sign-in redirect when signed out, the not-found page for anyone who is
 * not an allow-listed, verified teacher (a student learns nothing about the page).
 */
export async function requireAdminPage(): Promise<SessionUser> {
  const { user } = await requirePageUser();
  if (!isAdmin(user)) notFound();
  return user;
}

/**
 * For teacher API routes: 401 signed out, 503 when the database is down, 403 `forbidden` for
 * anyone who is not an allow-listed, verified teacher.
 */
export async function authenticateAdmin(): Promise<
  { user: SessionUser; response?: undefined } | { user?: undefined; response: NextResponse }
> {
  const auth = await authenticate();
  if (auth.response) return auth;
  if (!isAdmin(auth.user)) return { response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  return { user: auth.user };
}
