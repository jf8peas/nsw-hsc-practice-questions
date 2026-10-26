import { describe, expect, it } from "vitest";

import {
  BACKOFF_MS,
  HOURLY_MS,
  MAX_TRIES,
  OUTBOX_MAX_ENTRIES,
  addEntry,
  applyOutcome,
  dueEntries,
  enqueueReceipt,
  flushOutbox,
  loadEntries,
  nextDelay,
  outboxKey,
  outcomeForStatus,
  pendingCount,
  type OutboxEntry,
  type RetryOutcome,
  type StorageLike,
} from "@/lib/outbox";

function fakeStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const T0 = 1_000_000;

describe("scoping and the size cap", () => {
  it("entries are scoped by user id", () => {
    const store = fakeStorage();
    enqueueReceipt("alice", "r1", T0, store);
    enqueueReceipt("bob", "r2", T0, store);
    expect(loadEntries("alice", store).map((e) => e.receipt)).toEqual(["r1"]);
    expect(loadEntries("bob", store).map((e) => e.receipt)).toEqual(["r2"]);
    expect(store.data.has(outboxKey("alice"))).toBe(true);
  });

  it("is capped at 50, dropping (and reporting) the oldest", () => {
    let entries = addEntry([], "r0", T0).entries;
    let dropped = 0;
    for (let i = 1; i <= OUTBOX_MAX_ENTRIES + 4; i++) {
      const r = addEntry(entries, `r${i}`, T0 + i);
      entries = r.entries;
      dropped += r.dropped.length;
    }
    expect(entries).toHaveLength(OUTBOX_MAX_ENTRIES);
    expect(dropped).toBe(5);
    expect(entries[0].receipt).toBe("r5");
  });

  it("does not add the same receipt twice", () => {
    const once = addEntry([], "r1", T0).entries;
    expect(addEntry(once, "r1", T0 + 5).entries).toHaveLength(1);
  });
});

describe("backoff schedule: 5 s, 30 s, 2 min, 10 min, then hourly", () => {
  it("returns the right delay after each failed try", () => {
    expect([1, 2, 3, 4].map(nextDelay)).toEqual([...BACKOFF_MS]);
    expect(BACKOFF_MS).toEqual([5_000, 30_000, 120_000, 600_000]);
    expect(nextDelay(5)).toBe(HOURLY_MS);
    expect(nextDelay(9)).toBe(HOURLY_MS);
  });

  it("schedules nextAt from the outcome time", () => {
    const e = addEntry([], "r", T0).entries[0];
    const a = applyOutcome(e, "transient", T0);
    expect(a.lost).toBe(false);
    expect(a.entry).toMatchObject({ tries: 1, nextAt: T0 + 5_000 });
    const b = applyOutcome(a.entry!, "transient", T0 + 5_000);
    expect(b.entry).toMatchObject({ tries: 2, nextAt: T0 + 5_000 + 30_000 });
  });

  it("only due entries are retried", () => {
    const e = applyOutcome(addEntry([], "r", T0).entries[0], "transient", T0).entry!;
    expect(dueEntries([e], T0 + 4_999)).toHaveLength(0);
    expect(dueEntries([e], T0 + 5_000)).toHaveLength(1);
  });
});

describe("when an entry is lost (and not before)", () => {
  it("a 2xx removes it without a notice", () => {
    const e = addEntry([], "r", T0).entries[0];
    expect(applyOutcome(e, "saved", T0)).toEqual({ entry: null, lost: false });
  });

  it("a 410 (student gone) drops it silently", () => {
    const e = addEntry([], "r", T0).entries[0];
    expect(applyOutcome(e, "discarded", T0)).toEqual({ entry: null, lost: false });
  });

  it("a definitive rejection is reported lost", () => {
    const e = addEntry([], "r", T0).entries[0];
    expect(applyOutcome(e, "rejected", T0)).toEqual({ entry: null, lost: true });
  });

  it("is reported lost only after 10 failed tries, never before", () => {
    let entry: OutboxEntry | null = addEntry([], "r", T0).entries[0];
    let now = T0;
    for (let i = 1; i < MAX_TRIES; i++) {
      const r = applyOutcome(entry!, "transient", now);
      expect(r.lost, `try ${i}`).toBe(false);
      entry = r.entry;
      expect(entry).not.toBeNull();
      now = entry!.nextAt;
    }
    const final = applyOutcome(entry!, "transient", now);
    expect(final).toEqual({ entry: null, lost: true });
  });
});

describe("status mapping", () => {
  it("maps HTTP statuses to outcomes", () => {
    expect(outcomeForStatus(200)).toBe("saved");
    expect(outcomeForStatus(410)).toBe("discarded");
    expect(outcomeForStatus(400)).toBe("rejected");
    expect(outcomeForStatus(403)).toBe("rejected");
    for (const s of [401, 500, 502, 503]) expect(outcomeForStatus(s)).toBe("transient");
  });
});

describe("flushOutbox", () => {
  it("sends due receipts in order, removes saved ones, keeps transient ones, counts losses", async () => {
    const store = fakeStorage();
    for (const r of ["a", "b", "c", "d"]) enqueueReceipt("u", r, T0, store);
    const outcomes: Record<string, RetryOutcome> = {
      a: "saved",
      b: "transient",
      c: "rejected",
      d: "discarded",
    };
    const sent: string[] = [];
    const res = await flushOutbox(
      "u",
      async (r) => {
        sent.push(r);
        return outcomes[r];
      },
      T0,
      store,
    );
    expect(sent).toEqual(["a", "b", "c", "d"]);
    expect(res).toMatchObject({ lost: 1, pending: 1, sent: 4 });
    expect(loadEntries("u", store).map((e) => e.receipt)).toEqual(["b"]);
    // not due yet: nothing is sent
    const again = await flushOutbox("u", async () => "saved", T0 + 1_000, store);
    expect(again.sent).toBe(0);
    // due later
    const later = await flushOutbox("u", async () => "saved", T0 + 5_000, store);
    expect(later).toMatchObject({ sent: 1, pending: 0, lost: 0 });
    expect(pendingCount("u", store)).toBe(0);
    expect(store.data.has(outboxKey("u"))).toBe(false);
  });

  it("treats a thrown send as transient", async () => {
    const store = fakeStorage();
    enqueueReceipt("u", "a", T0, store);
    const res = await flushOutbox(
      "u",
      async () => {
        throw new Error("offline");
      },
      T0,
      store,
    );
    expect(res).toMatchObject({ lost: 0, pending: 1 });
  });

  it("works without storage (nothing kept, nothing thrown)", async () => {
    expect(enqueueReceipt("u", "a", T0, null)).toEqual({ lost: 0, pending: 1 });
    await expect(flushOutbox("u", async () => "saved", T0, null)).resolves.toMatchObject({
      pending: 0,
    });
  });

  it("survives corrupt stored data", () => {
    const store = fakeStorage();
    store.setItem(outboxKey("u"), "{not json");
    expect(loadEntries("u", store)).toEqual([]);
    store.setItem(
      outboxKey("u"),
      JSON.stringify([{ receipt: 1 }, null, { receipt: "x", tries: 0, nextAt: 0, addedAt: 0 }]),
    );
    expect(loadEntries("u", store).map((e) => e.receipt)).toEqual(["x"]);
  });
});
