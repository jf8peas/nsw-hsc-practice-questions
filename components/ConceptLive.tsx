"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Keeps the unit page up to date while concept content is being prepared (spec 002 FR-021).
// It asks the server to start the work once, then checks cheaply until nothing is running any
// more, and refreshes the page once each time the approved content changes. It draws nothing.

const FIRST_DELAY_MS = 5_000;
const MAX_DELAY_MS = 15_000;
const GIVE_UP_AFTER_MS = 3 * 60_000;

interface SyncState {
  pending: boolean;
  version: string;
}

export function ConceptLive({
  unitId,
  needsContent,
  initialPending,
  initialVersion,
}: {
  unitId: string;
  /** Some listed concept has no approved summary yet. */
  needsContent: boolean;
  /** A worker was already busy when the page was built. */
  initialPending: boolean;
  /** The hash of the approved content the page was built with. */
  initialVersion: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!needsContent && !initialPending) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let known = initialVersion;
    const startedAt = Date.now();
    let delay = FIRST_DELAY_MS;

    const read = async (res: Response): Promise<SyncState | null> => {
      if (!res.ok) return null;
      const body = (await res.json()) as Partial<SyncState>;
      return typeof body.pending === "boolean" && typeof body.version === "string"
        ? { pending: body.pending, version: body.version }
        : null;
    };

    const apply = (state: SyncState) => {
      if (state.version !== known) {
        known = state.version;
        router.refresh();
      }
    };

    const poll = async () => {
      if (cancelled) return;
      if (Date.now() - startedAt >= GIVE_UP_AFTER_MS) return;
      if (typeof document !== "undefined" && document.hidden) {
        timer = setTimeout(poll, delay); // paused while the tab is hidden
        return;
      }
      let state: SyncState | null = null;
      try {
        state = await read(await fetch(`/api/units/${unitId}/concepts/status`));
      } catch {
        // a network blip: try again on the next tick
      }
      if (cancelled) return;
      if (state) {
        apply(state);
        if (!state.pending) return; // nothing is running any more
      }
      delay = Math.min(Math.round(delay * 1.5), MAX_DELAY_MS);
      timer = setTimeout(poll, delay);
    };

    const start = async () => {
      let pending = initialPending;
      if (needsContent) {
        try {
          const state = await read(await fetch(`/api/units/${unitId}/concepts/ensure`, { method: "POST" }));
          if (state) {
            pending = state.pending;
            apply(state);
          }
        } catch {
          // the page still shows every concept's description; nothing to do
        }
      }
      if (!cancelled && pending) timer = setTimeout(poll, delay);
    };
    void start();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [unitId, needsContent, initialPending, initialVersion, router]);

  return null;
}
