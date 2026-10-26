import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

/** The `dev:<slug>` account id and a placeholder email for the development login. */
export function devLoginUser(rawName: string) {
  const name = rawName.trim() || "Dev Student";
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "student";
  return { id: `dev:${slug}`, name, email: `${slug}@dev.local` };
}

/** The id Auth.js will use for a provider (credentials providers carry it in `options`). */
export function providerId(provider: unknown): string {
  const p = provider as { id?: string; options?: { id?: string } };
  return p.options?.id ?? p.id ?? "";
}

/**
 * Sign-in providers. Google accepts any Google account. The credentials
 * `dev-login` provider exists ONLY outside production (a documented stand-in
 * for Google in local development).
 */
export function buildProviders(nodeEnv: string | undefined = process.env.NODE_ENV) {
  const providers: Array<ReturnType<typeof Google> | ReturnType<typeof Credentials>> = [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ];
  if (nodeEnv !== "production") {
    providers.push(
      Credentials({
        id: "dev-login",
        name: "Dev login",
        credentials: { name: { label: "Name", type: "text" } },
        authorize: async (credentials) => devLoginUser(String(credentials?.name ?? "")),
      }),
    );
  }
  return providers;
}
