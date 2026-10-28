import "server-only";

import NextAuth from "next-auth";
import { cache } from "react";

import { jwtCallback, sessionCallback } from "@/lib/auth.callbacks.server";
import { authConfig } from "@/lib/auth.config";
import { buildProviders } from "@/lib/auth.providers";
import {
  identityFromClaims,
  pageUserFromState,
  resolveIdentity,
  userFromState,
  type SessionState,
} from "@/lib/session.server";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: buildProviders(),
  callbacks: {
    jwt: ({ token, user, account, profile }) => jwtCallback({ token, user, account, profile }),
    session: ({ session, token }) => sessionCallback({ session, token }),
  },
});

/** The identity in the Auth.js JWT (no database access). */
async function currentIdentity() {
  const session = await auth();
  const u = session?.user as
    | { id?: string; name?: string | null; email?: string | null; ev?: boolean }
    | undefined;
  return identityFromClaims(u ? { uid: u.id, name: u.name, email: u.email, ev: u.ev } : null);
}

/**
 * The session state for this request: `user` (row confirmed), `unverified`
 * (valid JWT, database unreachable) or `none`. One database lookup per request
 * render (React `cache`).
 */
export const resolveSession = cache(
  async (): Promise<SessionState> => resolveIdentity(await currentIdentity()),
);

/**
 * For API routes with no degraded path: the student, or null when signed out.
 * Throws DbUnavailableError when the session cannot be verified because the
 * database is down (answer 503, never 401).
 */
export async function requireUser() {
  return userFromState(await resolveSession());
}

/** For pages: redirects to /signin when signed out; `degraded` when the database is down. */
export async function requirePageUser() {
  return pageUserFromState(await resolveSession());
}
