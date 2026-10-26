import "server-only";

import { redirect } from "next/navigation";

import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { upsertUserOnSignIn, userExists } from "@/lib/db/queries/users.server";

/**
 * Session logic that does not depend on Auth.js itself, so it can be tested
 * with a plain identity and a test database. lib/auth.server.ts feeds it the
 * identity read from the Auth.js JWT.
 */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

/**
 * - user: the JWT is valid and the student's row exists.
 * - unverified: the JWT is valid but the database could not be reached to check the row.
 * - none: no session (`signed_out`), or the row is gone (`student_missing`: a deleted student).
 */
export type SessionState =
  | { kind: "user"; user: SessionUser }
  | { kind: "unverified"; user: SessionUser }
  | { kind: "none"; reason: "signed_out" | "student_missing" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The claims we keep in the JWT: no profile photo and no provider tokens. */
export interface TokenClaims {
  uid: string;
  name: string;
  email: string;
}

/** Read the identity out of JWT claims (null if the token has no usable uid). */
export function identityFromClaims(
  claims: { uid?: unknown; name?: unknown; email?: unknown } | null | undefined,
): SessionUser | null {
  if (!claims || typeof claims.uid !== "string" || !UUID.test(claims.uid)) return null;
  return {
    id: claims.uid,
    name: typeof claims.name === "string" ? claims.name : "",
    email: typeof claims.email === "string" ? claims.email : "",
  };
}

/** Confirm the student's row still exists (FR-027). A database outage yields `unverified`. */
export async function resolveIdentity(identity: SessionUser | null): Promise<SessionState> {
  if (!identity || !UUID.test(identity.id)) return { kind: "none", reason: "signed_out" };
  try {
    const exists = await dbCall((db) => userExists(db, identity.id));
    return exists
      ? { kind: "user", user: identity }
      : { kind: "none", reason: "student_missing" };
  } catch (error) {
    if (error instanceof DbUnavailableError) return { kind: "unverified", user: identity };
    throw error;
  }
}

/**
 * For API routes with no degraded path: the student, or null when signed out.
 * Throws DbUnavailableError when the session could not be verified because the
 * database is down (the route answers 503, never 401).
 */
export function userFromState(state: SessionState): SessionUser | null {
  if (state.kind === "user") return state.user;
  if (state.kind === "none") return null;
  throw new DbUnavailableError("session could not be verified: database unavailable");
}

/** For pages: redirect to sign-in when signed out; render degraded when unverified. */
export function pageUserFromState(state: SessionState): { user: SessionUser; degraded: boolean } {
  if (state.kind === "none") redirect("/signin");
  return { user: state.user, degraded: state.kind === "unverified" };
}

export async function requireUserFrom(identity: SessionUser | null): Promise<SessionUser | null> {
  return userFromState(await resolveIdentity(identity));
}

export async function requirePageUserFrom(identity: SessionUser | null) {
  return pageUserFromState(await resolveIdentity(identity));
}

/** Sign-in: create/refresh the student row and return the claims to keep in the JWT. */
export async function claimsOnSignIn(
  profile: { sub: string; name?: string | null; email?: string | null },
): Promise<TokenClaims> {
  const name = (profile.name ?? "").trim() || "Student";
  const email = (profile.email ?? "").trim();
  const uid = await dbCall((db) => upsertUserOnSignIn(db, { sub: profile.sub, name, email }));
  return { uid, name, email };
}

/** Reduce an Auth.js token to the claims we keep (drops picture and anything else). */
export function applyClaims<T extends Record<string, unknown>>(
  token: T,
  claims: TokenClaims,
): T & TokenClaims {
  return { ...token, uid: claims.uid, name: claims.name, email: claims.email, picture: undefined };
}
