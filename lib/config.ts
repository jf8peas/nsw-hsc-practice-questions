// Plain module: no `server-only`, because the edge middleware imports it.
// It reads only the NAMES of required environment variables, never their values.

/** Environment variables that must be set for the site to serve in production. */
export const REQUIRED_ENV = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "DATABASE_URL",
] as const;

/** Names of required variables that are missing or blank. */
export function configProblems(
  env: Record<string, string | undefined> = process.env,
): string[] {
  return REQUIRED_ENV.filter((name) => !env[name] || !env[name]!.trim());
}
