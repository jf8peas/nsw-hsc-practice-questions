import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Runs only locally / in CI / at deploy time, never at request time (Principle VII).
loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
