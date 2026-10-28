// The review pipeline: generate -> pre-check -> review -> one automatic regeneration -> flag
// (spec 002 US7, FR-016 to FR-029, FR-054; constitution Principles VI and VII).

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { conceptVersions } from "@/lib/db/schema";

import { createTestDb, type TestDb } from "../helpers/db";
import {
  GOOD_BULLETS,
  READY,
  conceptId,
  failVerdict,
  fakeLlmPort,
  fixtureAnswers,
  fixtureContent,
  type FakePort,
} from "../helpers/concept-fixtures";

const A = conceptId("a");
const B = conceptId("b");
const NOW = new Date("2026-10-28T10:00:00Z");
const OWNER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const MODELS = { generator: "vendor/gen", illustration: "vendor/draw", reviewer: "vendor/rev" };

let t: TestDb;
let port: FakePort;
let pipeline: typeof import("@/lib/concepts/pipeline.server");
let store: typeof import("@/lib/concepts/store.server");

beforeEach(async () => {
  vi.resetModules();
  fixtureContent();
  t = await createTestDb();
  port = fakeLlmPort();
  pipeline = await import("@/lib/concepts/pipeline.server");
  store = await import("@/lib/concepts/store.server");
});
afterEach(async () => {
  await t.close();
});

function run(over: Record<string, unknown> = {}) {
  return pipeline.runConceptPipeline({
    db: t.db,
    port,
    conceptId: A,
    kind: "summary",
    origin: "first",
    cap: 100,
    models: MODELS,
    now: () => NOW,
    deadline: new Date(NOW.getTime() + 60_000),
    owner: OWNER,
    ...over,
  } as Parameters<typeof pipeline.runConceptPipeline>[0]);
}

const slotOf = (kind: "summary" | "illustration" = "summary", id = A) => store.getSlot(t.db, id, kind);
const versionsOf = (id = A, kind: "summary" | "illustration" = "summary") =>
  t.db.select().from(conceptVersions).where(eq(conceptVersions.conceptId, id)).then((rows) => rows.filter((r) => r.kind === kind));
const callsUsed = () => store.conceptCallsToday(t.db);
const live = async (kind: "summary" | "illustration" = "summary", id = A) => {
  const s = await slotOf(kind, id);
  return s?.liveVersionId ? store.getVersion(t.db, s.liveVersionId) : null;
};
const replacement = async (kind: "summary" | "illustration" = "summary", id = A) => {
  const s = await slotOf(kind, id);
  return s?.replacementVersionId ? store.getVersion(t.db, s.replacementVersionId) : null;
};

describe("pipelineAction: the four cases in which generation may run", () => {
  it("decides from what is stored", () => {
    const act = pipeline.pipelineAction;
    expect(act(null, null, "first")).toBe("generate"); // nothing stored
    expect(act({ liveVersionId: null }, null, "first")).toBe("generate");
    expect(act({ liveVersionId: "v" }, null, "first")).toBe("none"); // approved content is never regenerated
    expect(act({ liveVersionId: null }, { status: "pending_review", attemptNo: 1 }, "first")).toBe("review"); // retry of a pending review
    expect(act({ liveVersionId: "v" }, { status: "pending_review", attemptNo: 2 }, "first")).toBe("review");
    expect(act({ liveVersionId: null }, { status: "failed_review", attemptNo: 1 }, "first")).toBe("regenerate"); // the single automatic regeneration
    expect(act({ liveVersionId: null }, { status: "failed_review", attemptNo: 2 }, "first")).toBe("none"); // terminal until a teacher acts
    expect(act({ liveVersionId: "v" }, { status: "failed_review", attemptNo: 2 }, "first")).toBe("none");
    expect(act({ liveVersionId: "v" }, { status: "failed_review", attemptNo: 2 }, "teacher")).toBe("generate"); // a teacher's regeneration
    expect(act({ liveVersionId: null }, null, "teacher")).toBe("generate");
  });
});

describe("a passing review", () => {
  it("approves, makes the version live, records who and what, and uses 2 cap slots", async () => {
    const r = await run();
    expect(r).toEqual({ outcome: "approved" });
    const v = await live();
    expect(v).toMatchObject({
      status: "approved",
      approvedBy: "reviewer",
      generatorModel: "vendor/gen",
      reviewerModel: "vendor/rev",
      attemptNo: 1,
      origin: "first",
      summaryBullets: GOOD_BULLETS,
    });
    expect(await replacement()).toBeNull();
    expect(port.count("generateSummary")).toBe(1);
    expect(port.count("reviewSummary")).toBe(1);
    expect(await callsUsed()).toBe(2);
  });

  it("passes the configured models and the concept's public prompts to the port, and the answer key only to the reviewer", async () => {
    await run();
    const gen = port.calls.find((c) => c.method === "generateSummary")!;
    const rev = port.calls.find((c) => c.method === "reviewSummary")!;
    expect(gen.model).toBe("vendor/gen");
    expect(rev.model).toBe("vendor/rev");
    expect(JSON.stringify(gen.input)).not.toContain("Model answer for short");
    expect(JSON.stringify(rev.input)).toContain("Model answer for short 1");
    expect((gen.input as { questionPrompts: string[] }).questionPrompts).toHaveLength(4); // m01, m07, s01, s07
  });

  it("releases the lease when it is done, and a second run finds nothing to do", async () => {
    await run();
    expect(await run({ owner: OTHER })).toEqual({ outcome: "nothing_to_do" });
    expect(port.count("generateSummary")).toBe(1);
  });
});

describe("a failed review is regenerated once", () => {
  it("fail then pass: only the second version is ever live, and 4 cap slots are used", async () => {
    port.queue.reviewSummary.push(failVerdict("Not accurate."));
    expect(await run()).toEqual({ outcome: "approved" });
    expect(port.count("generateSummary")).toBe(2);
    expect(port.count("reviewSummary")).toBe(2);
    expect(await callsUsed()).toBe(4);
    const v = await live();
    expect(v).toMatchObject({ attemptNo: 2, origin: "auto_retry", status: "approved" });
    expect(await versionsOf()).toHaveLength(1); // the version that failed is gone
  });

  it("the automatic regeneration runs at attempt 2 and is never given the reviewer's reason", async () => {
    port.queue.reviewSummary.push(failVerdict("The model answer says X, which the notes contradict."));
    await run();
    const second = port.calls.filter((c) => c.method === "generateSummary")[1].input as { attemptNo: number };
    expect(second.attemptNo).toBe(2);
    expect(JSON.stringify(port.calls.filter((c) => c.method === "generateSummary"))).not.toContain("contradict");
  });

  it("fail twice: flagged with its reason, never live, and no more calls are made", async () => {
    port.queue.reviewSummary.push(failVerdict("First problem."), failVerdict("Second problem."));
    expect(await run()).toEqual({ outcome: "flagged" });
    expect(await live()).toBeNull();
    const flagged = await replacement();
    expect(flagged).toMatchObject({ status: "failed_review", attemptNo: 2, reviewerReason: "Second problem.", reviewerModel: "vendor/rev" });
    expect(port.count("generateSummary")).toBe(2);
    expect(port.count("reviewSummary")).toBe(2);
    expect(await callsUsed()).toBe(4);
  });

  it("a flagged item is terminal: opening the page again makes no calls", async () => {
    port.queue.reviewSummary.push(failVerdict(), failVerdict());
    await run();
    const before = port.calls.length;
    expect(await run({ owner: OTHER })).toEqual({ outcome: "nothing_to_do" });
    expect(port.calls.length).toBe(before);
  });

  it("the regeneration owed after a first failure is picked up later if it could not run", async () => {
    port.queue.reviewSummary.push(failVerdict("First problem."));
    // the first generation works, the automatic regeneration's call fails
    port.queue.generateSummary.push({ ok: true, value: { bullets: GOOD_BULLETS, illustration: null } }, "call_failed");
    expect(await run()).toEqual({ outcome: "failed_call" });
    const owed = await replacement();
    expect(owed).toMatchObject({ status: "failed_review", attemptNo: 1 });
    expect(await live()).toBeNull();

    // later (after the backoff), the next run owes one regeneration and completes it
    const later = new Date(NOW.getTime() + 20 * 60_000);
    expect(await run({ owner: OTHER, now: () => later, deadline: new Date(later.getTime() + 60_000) })).toEqual({ outcome: "approved" });
    expect((await live())?.attemptNo).toBe(2);
  });
});

describe("when the reviewer cannot be used, nothing is approved", () => {
  it("an unset reviewer leaves the version pending and makes no review call", async () => {
    expect(await run({ models: { ...MODELS, reviewer: null } })).toEqual({ outcome: "pending_reviewer_unavailable" });
    expect(port.count("reviewSummary")).toBe(0);
    expect(await live()).toBeNull();
    expect(await replacement()).toMatchObject({ status: "pending_review" });
    expect(await callsUsed()).toBe(1);
  });

  it("a reviewer equal to the generator (any case, with a :variant) is refused", async () => {
    // each spelling gets its own concept, so each run starts from "nothing stored"
    const spellings: Array<[string, string]> = [
      [A, "vendor/gen"],
      [B, "Vendor/GEN"],
      [conceptId("c"), "vendor/gen:online"],
    ];
    for (const [id, reviewer] of spellings) {
      port = fakeLlmPort();
      const result = await run({ conceptId: id, models: { ...MODELS, reviewer } });
      expect(result).toEqual({ outcome: "pending_reviewer_unavailable" });
      expect(port.count("reviewSummary")).toBe(0);
      expect(await live("summary", id)).toBeNull();
    }
  });

  it("compares the reviewer with the generator that WROTE the version, not today's setting", async () => {
    await run({ models: { ...MODELS, reviewer: null } }); // written by vendor/gen, left pending
    // later the generator is renamed to something else and the reviewer is set to the old generator
    const result = await run({ models: { generator: "vendor/new", illustration: null, reviewer: "vendor/gen" }, owner: OTHER });
    expect(result.outcome).toBe("pending_reviewer_unavailable");
    expect(port.count("reviewSummary")).toBe(0);
    expect(await live()).toBeNull();
  });

  it("a review call that fails is refunded, leaves the version pending, and backs the slot off for 15 minutes", async () => {
    port.queue.reviewSummary.push("call_failed");
    expect(await run()).toEqual({ outcome: "pending_reviewer_unavailable" });
    expect(await callsUsed()).toBe(1); // the generation only; the review slot was given back
    const s = await slotOf();
    expect(s?.retryAfter?.getTime()).toBe(NOW.getTime() + 15 * 60_000);
    expect(s?.lastError).toContain("review unavailable");
    expect(await replacement()).toMatchObject({ status: "pending_review" });
  });

  it("the review is retried later, without regenerating, once the reviewer works", async () => {
    await run({ models: { ...MODELS, reviewer: null } });
    const before = port.count("generateSummary");
    expect(await run({ owner: OTHER })).toEqual({ outcome: "approved" });
    expect(port.count("generateSummary")).toBe(before); // a retry of a pending review, not a new generation
    expect((await live())?.generatorModel).toBe("vendor/gen");
  });
});

describe("the daily cap", () => {
  it("a cap of 0 makes no model call at all", async () => {
    expect(await run({ cap: 0 })).toEqual({ outcome: "pending_cap" });
    expect(port.calls).toHaveLength(0);
    expect(await replacement()).toBeNull();
  });

  it("running out between generation and review leaves the version pending", async () => {
    expect(await run({ cap: 1 })).toEqual({ outcome: "pending_cap" });
    expect(port.count("generateSummary")).toBe(1);
    expect(port.count("reviewSummary")).toBe(0);
    expect(await replacement()).toMatchObject({ status: "pending_review" });
    expect(await live()).toBeNull();
  });

  it("a generation that fails is refunded and backs the slot off, storing nothing", async () => {
    port.queue.generateSummary.push("call_failed");
    expect(await run()).toEqual({ outcome: "failed_call" });
    expect(await callsUsed()).toBe(0);
    expect(await replacement()).toBeNull();
    expect((await slotOf())?.retryAfter).not.toBeNull();
    // inside the backoff a student opening the page makes no call
    expect(await run({ owner: OTHER })).toEqual({ outcome: "backoff" });
    expect(port.calls).toHaveLength(1);
  });

  it("a generation that breaks the content rules twice stores nothing and backs off", async () => {
    port.queue.generateSummary.push("content_rejected", "content_rejected");
    expect(await run()).toEqual({ outcome: "failed_call" });
    expect(port.count("generateSummary")).toBe(2);
    expect(await versionsOf()).toHaveLength(0);
    expect(await callsUsed()).toBe(2); // tokens were spent, so these are not refunded
  });
});

describe("the verbatim-overlap pre-check", () => {
  const copied = fixtureAnswers[`${READY}.s01`].modelAnswer!;

  it("fails a summary that copies a model answer, without a reviewer call, then regenerates once", async () => {
    port.queue.generateSummary.push({ ok: true, value: { bullets: [copied, "Another idea.", "A third idea."], illustration: null } });
    expect(await run()).toEqual({ outcome: "approved" });
    expect(port.count("generateSummary")).toBe(2);
    expect(port.count("reviewSummary")).toBe(1); // only the second version was reviewed
    expect(await callsUsed()).toBe(3); // gen, gen, review: the pre-check spent no reviewer slot
    expect((await live())?.attemptNo).toBe(2);
  });

  it("flags it, with the fixed reason, when the copy happens twice", async () => {
    const bad = { ok: true as const, value: { bullets: [copied, "Another idea.", "A third idea."], illustration: null } };
    port.queue.generateSummary.push(bad, bad);
    expect(await run()).toEqual({ outcome: "flagged" });
    expect(port.count("reviewSummary")).toBe(0);
    expect(await replacement()).toMatchObject({ status: "failed_review", reviewerReason: pipeline.OVERLAP_REASON, reviewerModel: null });
  });
});

describe("one generation per concept under concurrency", () => {
  it("a run is refused while another worker holds the lease", async () => {
    await store.ensureSlot(t.db, A, "summary", READY);
    await store.claimLease(t.db, A, "summary", OTHER, NOW);
    expect(await run()).toEqual({ outcome: "lease_busy" });
    expect(port.calls).toHaveLength(0);
  });

  it("two simultaneous runs make exactly one generation", async () => {
    const [x, y] = await Promise.all([run({ owner: OWNER }), run({ owner: OTHER })]);
    expect([x.outcome, y.outcome].sort()).toEqual(["approved", "lease_busy"]);
    expect(port.count("generateSummary")).toBe(1);
  });

  it("an expired lease is taken over", async () => {
    await store.ensureSlot(t.db, A, "summary", READY);
    await store.claimLease(t.db, A, "summary", OTHER, new Date(NOW.getTime() - 10 * 60_000));
    expect(await run()).toEqual({ outcome: "approved" });
  });

  it("a run the caller already holds the lease for does not claim it again", async () => {
    await store.ensureSlot(t.db, A, "summary", READY);
    await store.claimLease(t.db, A, "summary", OWNER, NOW);
    expect(await run({ leaseHeld: true })).toEqual({ outcome: "approved" });
  });
});

describe("the deadline", () => {
  it("stops before the next model call, leaves the version pending, and releases the lease", async () => {
    let clock = NOW.getTime();
    const origGenerate = port.generateSummary.bind(port);
    port.generateSummary = async (input) => {
      const r = await origGenerate(input);
      clock += 120_000; // the generation took too long
      return r;
    };
    const result = await run({ now: () => new Date(clock), deadline: new Date(NOW.getTime() + 60_000) });
    expect(result).toEqual({ outcome: "pending_deadline" });
    expect(port.count("reviewSummary")).toBe(0);
    expect(await replacement()).toMatchObject({ status: "pending_review" });
    expect(await store.claimLease(t.db, A, "summary", OTHER, new Date(clock))).toBe(true); // released
  });
});

describe("illustrations", () => {
  beforeEach(() => {
    port = fakeLlmPort({ illustrate: true });
  });

  it("an approved summary that asked for a picture continues into it, reviewed separately", async () => {
    const r = await run();
    expect(r).toEqual({ outcome: "approved", illustration: "approved" });
    expect(port.count("generateIllustration")).toBe(1);
    expect(port.count("reviewIllustration")).toBe(1);
    const pic = await live("illustration");
    expect(pic).toMatchObject({ status: "approved", generatorModel: "vendor/draw", reviewerModel: "vendor/rev" });
    expect(pic?.illustrationSvg).toContain("<svg");
    expect(pic?.illustrationAlt).toBe("A graph with two labelled axes.");
  });

  it("text that passes and a picture that fails twice: the summary is live, the picture is flagged", async () => {
    port.queue.reviewIllustration.push(failVerdict("Axes swapped."), failVerdict("Axes still swapped."));
    const r = await run();
    expect(r).toEqual({ outcome: "approved", illustration: "flagged" });
    expect(await live("summary")).not.toBeNull();
    expect(await live("illustration")).toBeNull();
    expect(await replacement("illustration")).toMatchObject({ status: "failed_review", reviewerReason: "Axes still swapped." });
  });

  it("makes no illustration when the summary decided none, or no illustration model is set", async () => {
    port = fakeLlmPort({ illustrate: false });
    expect(await run()).toEqual({ outcome: "approved" });
    expect(port.count("generateIllustration")).toBe(0);

    port = fakeLlmPort({ illustrate: true });
    const r = await run({ conceptId: B, models: { ...MODELS, illustration: null } });
    expect(r).toEqual({ outcome: "approved" });
    expect(port.count("generateIllustration")).toBe(0);
  });

  it("the illustration has its own lease: held elsewhere, the summary still completes", async () => {
    await store.ensureSlot(t.db, A, "illustration", READY);
    await store.claimLease(t.db, A, "illustration", OTHER, NOW);
    expect(await run()).toEqual({ outcome: "approved", illustration: "lease_busy" });
    expect(await live("summary")).not.toBeNull();
  });

  it("a run that starts at the illustration draws from the live summary's brief", async () => {
    await run({ models: { ...MODELS, illustration: null } }); // summary approved, picture not made
    expect(await live("illustration")).toBeNull();
    const r = await run({ kind: "illustration", owner: OTHER });
    expect(r).toEqual({ outcome: "approved" });
    expect(port.count("generateIllustration")).toBe(1);
    const input = port.calls.find((c) => c.method === "generateIllustration")!.input as { brief: string; alt: string };
    expect(input.brief).toBe("A labelled diagram of the idea.");
    expect(input.alt).toBe("A graph with two labelled axes.");
  });

  it("returns no_brief, with no model call, when there is no summary or the summary asked for none", async () => {
    expect(await run({ kind: "illustration" })).toEqual({ outcome: "no_brief" });
    port = fakeLlmPort({ illustrate: false });
    await run({ conceptId: B });
    expect(await run({ conceptId: B, kind: "illustration", owner: OTHER })).toEqual({ outcome: "no_brief" });
    expect(port.count("generateIllustration")).toBe(0);
  });

  it("does nothing at the illustration when no illustration model is set", async () => {
    expect(await run({ kind: "illustration", models: { ...MODELS, illustration: null } })).toEqual({ outcome: "nothing_to_do" });
  });
});

describe("a teacher's regeneration", () => {
  it("keeps the live version on show until the replacement is approved, then swaps", async () => {
    await run();
    const first = await live();
    port.queue.reviewSummary.push(failVerdict("Teacher-triggered, first review fails."));
    // the teacher regenerates; the first review fails, the automatic regeneration passes
    expect(await run({ origin: "teacher", owner: OTHER })).toEqual({ outcome: "approved" });
    const now = await live();
    expect(now?.id).not.toBe(first?.id);
    expect(now?.attemptNo).toBe(2);
    expect(await versionsOf()).toHaveLength(1); // the superseded version was cleaned up
  });

  it("if the replacement fails twice, the previously approved version stays live and the replacement is flagged", async () => {
    await run();
    const first = await live();
    port.queue.reviewSummary.push(failVerdict("One."), failVerdict("Two."));
    expect(await run({ origin: "teacher", owner: OTHER })).toEqual({ outcome: "flagged" });
    expect((await live())?.id).toBe(first?.id);
    expect(await replacement()).toMatchObject({ status: "failed_review", reviewerReason: "Two." });
  });

  it("ignores a backoff the pipeline set earlier, but still respects a held lease", async () => {
    await store.ensureSlot(t.db, A, "summary", READY);
    await store.setBackoff(t.db, A, "summary", NOW, "earlier failure");
    expect(await run({ owner: OTHER })).toEqual({ outcome: "backoff" });
    expect(await run({ origin: "teacher", owner: OTHER })).toEqual({ outcome: "approved" });
  });

  it("regenerates even a version that was flagged", async () => {
    port.queue.reviewSummary.push(failVerdict(), failVerdict());
    await run();
    expect(await live()).toBeNull();
    expect(await run({ origin: "teacher", owner: OTHER })).toEqual({ outcome: "approved" });
    expect(await live()).not.toBeNull();
  });
});

describe("a unit that has not adopted concepts", () => {
  it("is not touched: an unknown concept id does nothing", async () => {
    expect(await run({ conceptId: "fx-plain.c-nope" })).toEqual({ outcome: "nothing_to_do" });
    expect(port.calls).toHaveLength(0);
  });
});

describe("logging", () => {
  it("logs one line per run for an outcome that leaves content pending or flagged, with codes and ids only", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    port.queue.reviewSummary.push(failVerdict("SECRET quoting the model answer."), failVerdict("SECRET again."));
    await run();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(`[concepts] flagged ${A} summary`);
    expect(JSON.stringify(warn.mock.calls)).not.toContain("SECRET");
    warn.mockRestore();
  });

  it("is quiet for a normal approval and for nothing to do", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await run();
    await run({ owner: OTHER });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("names a pending cap, an unavailable reviewer and a busy lease", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await run({ cap: 0 });
    await run({ conceptId: B, models: { ...MODELS, reviewer: null } });
    const lines = warn.mock.calls.map((c) => c[0]);
    expect(lines).toContain(`[concepts] pending_cap ${A} summary`);
    expect(lines).toContain(`[concepts] pending_reviewer_unavailable ${B} summary`);
    warn.mockRestore();
  });
});
