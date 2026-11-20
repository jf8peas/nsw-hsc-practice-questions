// Where a student's highlights live (spec 008 FR-006a, research R12): only in this browser's localStorage,
// keyed by user, attempt and text, and shared between the quiz and any open text-only tab through a
// BroadcastChannel (falling back to the window "storage" event). Nothing is sent to the server. Every
// storage access is wrapped: if storage is unavailable highlighting still works for the page's lifetime
// (and still syncs between views through the channel).

import { parseRanges, type HlRange } from "@/lib/unseen/highlights";

export const CHANNEL = "unseen-highlights";
export const KEY_PREFIX = "unseen-hl:v1:";
/** Highlights of an attempt are removed once it has been final for this long. */
export const FINAL_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export interface HlScope {
  userId: string;
  attemptId: string;
  textId: string;
}

interface Stored {
  items: HlRange[];
  /** When the attempt was first seen final (the discussion shown); the clean-up counts from here. */
  finalAt?: number;
}

export const storageKey = (s: HlScope) => `${KEY_PREFIX}${s.userId}:${s.attemptId}:${s.textId}`;

function store(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readStored(key: string): Stored | null {
  try {
    const raw = store()?.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw) as { items?: unknown; finalAt?: unknown };
    return { items: Array.isArray(v.items) ? (v.items as HlRange[]) : [], finalAt: typeof v.finalAt === "number" ? v.finalAt : undefined };
  } catch {
    return null;
  }
}

function writeStored(key: string, value: Stored) {
  try {
    store()?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full: the page keeps its highlights in memory */
  }
}

export function loadHighlights(scope: HlScope, lengths: number[]): HlRange[] {
  return parseRanges(readStored(storageKey(scope))?.items, lengths);
}

function channel(): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL) : null;
  } catch {
    return null;
  }
}

/** Saves the set and tells every other open view of the same attempt and text. */
export function saveHighlights(scope: HlScope, items: HlRange[]) {
  const key = storageKey(scope);
  const prev = readStored(key);
  writeStored(key, { items, ...(prev?.finalAt ? { finalAt: prev.finalAt } : {}) });
  const ch = channel();
  try {
    ch?.postMessage({ key, items });
  } catch {
    /* ignore */
  } finally {
    ch?.close();
  }
}

/**
 * Calls `onChange` with the new set when another view changes this attempt's highlights of this text.
 * Uses the BroadcastChannel and the window "storage" event (the fallback for browsers without a channel,
 * and a second route that costs nothing). Returns the unsubscribe function.
 */
export function subscribeHighlights(scope: HlScope, lengths: number[], onChange: (items: HlRange[]) => void): () => void {
  const key = storageKey(scope);
  const ch = channel();
  const onMessage = (e: MessageEvent) => {
    const d = e.data as { key?: string; items?: unknown } | null;
    if (d && d.key === key) onChange(parseRanges(d.items, lengths));
  };
  ch?.addEventListener("message", onMessage);
  const onStorage = (e: StorageEvent) => {
    if (e.key === key) onChange(loadHighlights(scope, lengths));
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    ch?.removeEventListener("message", onMessage);
    ch?.close();
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/** Notes that the attempt is final (the discussion is on screen), so its highlights can be cleaned up later. */
export function markFinal(scope: HlScope, now = Date.now()) {
  const key = storageKey(scope);
  const cur = readStored(key);
  if (cur && !cur.finalAt) writeStored(key, { items: cur.items, finalAt: now });
}

/** Removes the stored highlights of every attempt that has been final for 30 days. Returns how many were removed. */
export function sweepFinalHighlights(now = Date.now()): number {
  let removed = 0;
  const s = store();
  if (!s) return 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && k.startsWith(KEY_PREFIX)) keys.push(k);
    }
    for (const k of keys) {
      const v = readStored(k);
      if (v?.finalAt && now - v.finalAt > FINAL_RETENTION_MS) {
        s.removeItem(k);
        removed += 1;
      }
    }
  } catch {
    /* ignore */
  }
  return removed;
}
