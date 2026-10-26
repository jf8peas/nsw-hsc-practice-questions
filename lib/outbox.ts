// Client-side retry outbox for result receipts (research R13).
//
// When a result could not be saved, the server hands back a signed receipt.
// The browser keeps unsaved receipts here (a small localStorage cache, scoped by
// user id so a shared school device never sends one student's receipts under
// another) and retries them with backoff. The database stays the source of
// truth. The student is told "a result could not be saved" ONLY when an entry is
// finally lost: rejected for good, or out of retries.

export const OUTBOX_MAX_ENTRIES = 50;
export const MAX_TRIES = 10;
/** Delay after the 1st, 2nd, 3rd, 4th failed try; every later failure waits an hour. */
export const BACKOFF_MS = [5_000, 30_000, 120_000, 600_000] as const;
export const HOURLY_MS = 60 * 60 * 1000;

export interface OutboxEntry {
  receipt: string;
  /** Failed tries so far. */
  tries: number;
  /** Earliest time (ms) to try again. */
  nextAt: number;
  addedAt: number;
}

/** What the server said when a receipt was re-sent. */
export type RetryOutcome =
  /** 2xx: stored (or already stored). */
  | "saved"
  /** 410: the student no longer exists. Drop silently, no notice. */
  | "discarded"
  /** 400 / 403: the receipt is invalid, expired or someone else's. Lost for good. */
  | "rejected"
  /** 503, 5xx, network error, 401 (signed out): keep it and back off. */
  | "transient";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const outboxKey = (uid: string) => `outbox:${uid}`;

/** Delay before the next try, given how many tries have failed (>= 1). */
export function nextDelay(failedTries: number): number {
  return BACKOFF_MS[failedTries - 1] ?? HOURLY_MS;
}

/** Add a receipt. When over the cap the oldest entries are dropped and reported as lost. */
export function addEntry(
  entries: OutboxEntry[],
  receipt: string,
  now: number,
): { entries: OutboxEntry[]; dropped: OutboxEntry[] } {
  if (entries.some((e) => e.receipt === receipt)) return { entries, dropped: [] };
  const next = [...entries, { receipt, tries: 0, nextAt: now, addedAt: now }];
  const overflow = Math.max(0, next.length - OUTBOX_MAX_ENTRIES);
  return { entries: next.slice(overflow), dropped: next.slice(0, overflow) };
}

/** Apply a retry outcome to one entry. `entry: null` means remove it. */
export function applyOutcome(
  entry: OutboxEntry,
  outcome: RetryOutcome,
  now: number,
): { entry: OutboxEntry | null; lost: boolean } {
  switch (outcome) {
    case "saved":
    case "discarded":
      return { entry: null, lost: false };
    case "rejected":
      return { entry: null, lost: true };
    case "transient": {
      const tries = entry.tries + 1;
      if (tries >= MAX_TRIES) return { entry: null, lost: true };
      return { entry: { ...entry, tries, nextAt: now + nextDelay(tries) }, lost: false };
    }
  }
}

export const dueEntries = (entries: OutboxEntry[], now: number) =>
  entries.filter((e) => e.nextAt <= now);

// ---- storage wrapper (every access is try/catch: storage may be unavailable) --

function browserStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadEntries(
  uid: string,
  store: StorageLike | null = browserStorage(),
): OutboxEntry[] {
  if (!store) return [];
  try {
    const parsed = JSON.parse(store.getItem(outboxKey(uid)) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter(
          (e): e is OutboxEntry =>
            e &&
            typeof e.receipt === "string" &&
            typeof e.tries === "number" &&
            typeof e.nextAt === "number",
        )
      : [];
  } catch {
    return [];
  }
}

function saveEntries(uid: string, entries: OutboxEntry[], store: StorageLike | null): void {
  if (!store) return;
  try {
    if (entries.length === 0) store.removeItem(outboxKey(uid));
    else store.setItem(outboxKey(uid), JSON.stringify(entries));
  } catch {
    // storage full or blocked: the receipt is simply not kept
  }
}

/** Queue a receipt. Returns how many entries were pushed out (lost) by the size cap. */
export function enqueueReceipt(
  uid: string,
  receipt: string,
  now: number = Date.now(),
  store: StorageLike | null = browserStorage(),
): { lost: number; pending: number } {
  const { entries, dropped } = addEntry(loadEntries(uid, store), receipt, now);
  saveEntries(uid, entries, store);
  return { lost: dropped.length, pending: entries.length };
}

export const pendingCount = (uid: string, store: StorageLike | null = browserStorage()) =>
  loadEntries(uid, store).length;

/**
 * Re-send every due receipt, in order, through `send`. Returns how many were
 * finally lost and how many are still pending.
 */
export async function flushOutbox(
  uid: string,
  send: (receipt: string) => Promise<RetryOutcome>,
  now: number = Date.now(),
  store: StorageLike | null = browserStorage(),
): Promise<{ lost: number; pending: number; sent: number }> {
  let entries = loadEntries(uid, store);
  let lost = 0;
  let sent = 0;
  for (const due of dueEntries(entries, now)) {
    let outcome: RetryOutcome;
    try {
      outcome = await send(due.receipt);
    } catch {
      outcome = "transient";
    }
    sent += 1;
    const applied = applyOutcome(due, outcome, now);
    if (applied.lost) lost += 1;
    entries = entries.flatMap((e) =>
      e.receipt === due.receipt ? (applied.entry ? [applied.entry] : []) : [e],
    );
  }
  saveEntries(uid, entries, store);
  return { lost, pending: entries.length, sent };
}

/** Map an HTTP status from POST /api/results/retry to an outcome. */
export function outcomeForStatus(status: number): RetryOutcome {
  if (status >= 200 && status < 300) return "saved";
  if (status === 410) return "discarded";
  if (status === 400 || status === 403) return "rejected";
  return "transient";
}

/** Send one receipt to the server (network errors count as transient). */
export async function sendReceipt(receipt: string): Promise<RetryOutcome> {
  try {
    const res = await fetch("/api/results/retry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ receipt }),
    });
    return outcomeForStatus(res.status);
  } catch {
    return "transient";
  }
}
