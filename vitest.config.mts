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
    // The default threads/forks pools crash with "Cannot read properties of undefined
    // (reading 'config')" in this vitest/vite combination (the collector's runner module
    // state is not shared). The vm pools execute each file in an isolated context, which
    // keeps the vitest runtime single-evaluated, so tests run correctly. The worker count
    // is capped because every file carries its own V8 context and in-memory PGlite: full
    // parallelism exhausts the heap and makes timing-sensitive tests flake.
    pool: "vmThreads",
    maxWorkers: 2,
    minWorkers: 1,
  },
});
