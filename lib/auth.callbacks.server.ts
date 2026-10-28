import "server-only";

import {
  applyClaims,
  claimsOnSignIn,
  identityFromClaims,
  type SessionUser,
  type TokenClaims,
} from "@/lib/session.server";

type TokenLike = Record<string, unknown>;

interface SignInUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
}

interface SignInAccount {
  provider: string;
  providerAccountId: string;
}

/**
 * JWT callback. On sign-in it creates/refreshes the student row and keeps only
 * `uid`, `name`, `email` and the verified-email flag `ev` in the token — no profile photo and no provider
 * tokens — so the header and pages still show the identity during an outage.
 * On later calls the token is returned unchanged.
 */
export async function jwtCallback<T extends TokenLike>({
  token,
  user,
  account,
  profile,
}: {
  token: T;
  user?: SignInUser | null;
  account?: SignInAccount | null;
  profile?: { email_verified?: unknown } | null;
}): Promise<T & Partial<TokenClaims>> {
  if (account && user) {
    // Google: the stable account id. Dev login: the `dev:<name>` id from authorize().
    const sub = account.provider === "google" ? account.providerAccountId : String(user.id ?? "");
    if (!sub) throw new Error("sign-in without a stable account id");
    // Google says whether it verified the email; the dev login (which exists only outside
    // production) stands in for a verified teacher so the admin pages can be tried locally.
    const emailVerified =
      account.provider === "google" ? profile?.email_verified === true : process.env.NODE_ENV !== "production";
    const claims = await claimsOnSignIn({ sub, name: user.name, email: user.email, emailVerified });
    return applyClaims(token, claims);
  }
  return token;
}

/** Session callback: expose the student's id, name and email from the token. */
export function sessionCallback<S extends { user?: unknown }>({
  session,
  token,
}: {
  session: S;
  token: TokenLike;
}): S {
  const identity: SessionUser | null = identityFromClaims(token);
  if (!identity) return session;
  return { ...session, user: { ...(session.user as object), ...identity } };
}
