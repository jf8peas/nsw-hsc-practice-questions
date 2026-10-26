import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const APP = path.resolve(__dirname, "../../app");

/** Routes that are deliberately reachable without a session. Reviewed list: keep it short. */
const PUBLIC_ALLOWLIST = new Set([
  "app/signin/page.tsx",
  "app/api/auth/[...nextauth]/route.ts",
  "app/api/cron/retention/route.ts",
]);

/**
 * Routes that need the session STATE (not just a user), so they call resolveSession:
 * the degraded-capable ones accept an unverified session when the database is down;
 * /api/results/retry needs the database but must tell a deleted student (410) from
 * a signed-out one (401).
 */
const DEGRADED_CAPABLE = new Set([
  "app/api/attempts/route.ts",
  "app/api/grade/route.ts",
  "app/api/results/self-mark/route.ts",
  "app/api/results/retry/route.ts",
]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name === "page.tsx" || entry.name === "route.ts") out.push(full);
  }
  return out;
}

const files = walk(APP).map((f) => ({
  rel: path.relative(path.resolve(__dirname, "../.."), f).split(path.sep).join("/"),
  src: fs.readFileSync(f, "utf8"),
}));

describe("every page and route requires a session (R2, FR-001)", () => {
  it("finds the app's pages and routes", () => {
    expect(files.length).toBeGreaterThan(3);
  });

  for (const { rel, src } of files) {
    it(`${rel} is guarded or on the reviewed public allowlist`, () => {
      if (PUBLIC_ALLOWLIST.has(rel)) return;
      // `authenticate()` (lib/api-auth.server.ts) wraps requireUser and maps 401/503 for API routes
      const guarded = /\brequireUser\b|\brequirePageUser\b|\bauthenticate\(/.test(src);
      const degraded = DEGRADED_CAPABLE.has(rel) && /\bresolveSession\b/.test(src);
      expect(guarded || degraded, `${rel} must call requireUser / requirePageUser / authenticate() (or resolveSession if degraded-capable)`).toBe(true);
    });
  }

  it("the public allowlist only contains files that exist", () => {
    const rels = new Set(files.map((f) => f.rel));
    for (const p of PUBLIC_ALLOWLIST) {
      // routes added by later stories may not exist yet; the sign-in and auth files must
      if (p === "app/api/cron/retention/route.ts") continue;
      expect(rels.has(p), p).toBe(true);
    }
  });
});
