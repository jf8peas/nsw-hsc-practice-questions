import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config: no database, no providers. middleware.ts uses this
 * (it reads only AUTH_SECRET, via Auth.js). Providers and callbacks that touch
 * the database live in lib/auth.server.ts.
 */
export const authConfig = {
  pages: { signIn: "/signin" },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  providers: [],
} satisfies NextAuthConfig;
