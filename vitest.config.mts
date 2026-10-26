import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  // tsconfig has `jsx: preserve` for Next; tests need real JSX compilation
  // Vite 8 transforms with oxc
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: [
      // `server-only` throws outside a React server environment; tests run in plain Node.
      { find: "server-only", replacement: `${root}tests/stubs/server-only.ts` },
      { find: /^@\//, replacement: root },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
