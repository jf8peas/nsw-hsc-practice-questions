import "server-only";

import { after } from "next/server";

// Runs work after the response has been sent, so a student's page never waits for a
// model call (spec 002 FR-021). On Vercel `after()` keeps the function alive until the work
// finishes, within the route's `maxDuration`. Outside a request scope (tests, scripts) it
// falls back to a detached promise, which `settleBackground()` lets a test await.

const detached = new Set<Promise<void>>();

/** Run `work` after the response. A rejection is logged, never thrown. */
export function runInBackground(work: () => Promise<void>): void {
  const safe = async () => {
    try {
      await work();
    } catch (error) {
      console.error("[background] work failed", error);
    }
  };
  try {
    after(safe);
  } catch {
    // no request scope
    const promise: Promise<void> = safe().finally(() => detached.delete(promise));
    detached.add(promise);
  }
}

/** Wait for work started outside a request scope. For tests. */
export async function settleBackground(): Promise<void> {
  while (detached.size > 0) await Promise.all([...detached]);
}
