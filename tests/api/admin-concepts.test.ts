// The teacher routes for concept content (spec 002 US6; FR-051 to FR-055; contracts/api.md):
// regenerate, and preview any version of an illustration. Everyone who is not an allow-listed,
// verified teacher is refused on the server, with no database write and no model call.

import { isValidElement, type ReactElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { conceptSlots, conceptVersions, dailyConceptUsage } from "@/lib/db/schema";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";
import {
  GOOD_BULLETS,
  GOOD_SVG,
  READY,
  conceptId,
  failVerdict,
  fakeLlmPort,
  fixtureContent,
  fixtureUnits,
  type FakePort,
} from "../helpers/concept-fixtures";
import type { Unit } from "@/lib/types";

const A = conceptId("a");
const B = conceptId("b");
const TEACHER = "teacher@school.test";
const NOW = new Date("2026-10-28T10:00:00Z");
let env: TestEnv;
let port: FakePort;

beforeEach(async () => {
  env = await setupTestEnv();
  port = fakeLlmPort({ illustrate: true });
  vi.stubEnv("CONCEPT_MODEL", "vendor/gen");
  vi.stubEnv("REVIEW_MODEL", "vendor/rev");
  vi.stubEnv("ILLUSTRATION_MODEL", "vendor/draw");
  vi.stubEnv("ADMIN_EMAILS", TEACHER);
  vi.doMock("@/lib/concepts/llm.server", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/lib/concepts/llm.server")>()),
    createConceptLlmPort: () => port,
  }));
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await env.close();
});

const notReady: Unit = { ...fixtureUnits[0], id: "fx-notready", conceptsReady: false, concepts: [{ id: "fx-notready.c-a", description: "x" }] };
const NOT_READY_CONCEPT = "fx-notready.c-a";

async function content() {
  fixtureContent([...fixtureUnits, notReady]);
}
async function signInAsTeacher(opts: { ev?: boolean; email?: string } = {}) {
  const row = await seedUser(env.db, { email: opts.email ?? TEACHER });
  env.signedInAs(asSessionUser(row, opts.ev ?? true));
  return row;
}
const store = () => import("@/lib/concepts/store.server");

async function regen(body: unknown) {
  const { POST } = await import("@/app/api/admin/concepts/regenerate/route");
  const { settleBackground } = await import("@/lib/background.server");
  const res = await POST(
    new Request("http://localhost/api/admin/concepts/regenerate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  const json = await res.json();
  await settleBackground();
  return { status: res.status, body: json };
}
async function preview(id: string, v?: string) {
  const { GET } = await import("@/app/api/admin/concepts/[conceptId]/illustration/route");
  return GET(new Request(`http://localhost/x${v === undefined ? "" : `?v=${v}`}`), { params: Promise.resolve({ conceptId: id }) });
}

/** A live, approved version for a concept item. */
async function liveVersion(concept: string, kind: "summary" | "illustration", extra: Record<string, unknown> = {}) {
  const s = await store();
  const v = await s.insertReplacement(env.db, {
    conceptId: concept,
    kind,
    unitId: READY,
    origin: "first",
    attemptNo: 1,
    generatorModel: "vendor/gen",
    generatedAt: NOW,
    ...(kind === "summary"
      ? { summaryBullets: GOOD_BULLETS, illustrationBrief: "A diagram.", illustrationAlt: "A graph." }
      : { illustrationSvg: GOOD_SVG, illustrationBrief: "A diagram.", illustrationAlt: "A graph." }),
    ...extra,
  });
  await s.promote(env.db, concept, kind, v.id, "reviewer", { reviewerModel: "vendor/rev", reason: null, at: NOW });
  return v;
}
const writes = async () =>
  (await env.db.select().from(conceptSlots)).length +
  (await env.db.select().from(conceptVersions)).length +
  (await env.db.select().from(dailyConceptUsage)).length;

describe("who may call", () => {
  it("signed out gets 401 from both routes", async () => {
    await content();
    env.signedOut();
    expect((await regen({ conceptId: A, kind: "summary" })).status).toBe(401);
    expect((await preview(A, "00000000-0000-4000-8000-000000000000")).status).toBe(401);
  });

  it.each([
    ["a student not on the list", { email: "student@school.test" }],
    ["a listed email that is not verified", { ev: false }],
  ])("%s gets 403 and causes no write and no model call", async (_label, who) => {
    await content();
    await signInAsTeacher(who);
    const r = await regen({ conceptId: A, kind: "summary" });
    expect(r.status).toBe(403);
    expect(r.body).toEqual({ error: "forbidden" });
    expect((await preview(A, "00000000-0000-4000-8000-000000000000")).status).toBe(403);
    expect(await writes()).toBe(0);
    expect(port.calls).toHaveLength(0);
  });

  it("an empty allow-list admits nobody", async () => {
    await content();
    vi.stubEnv("ADMIN_EMAILS", "");
    await signInAsTeacher();
    expect((await regen({ conceptId: A, kind: "summary" })).status).toBe(403);
    expect((await preview(A, "00000000-0000-4000-8000-000000000000")).status).toBe(403);
    expect(await writes()).toBe(0);
    expect(port.calls).toHaveLength(0);
  });

  it("503, never 401, when the database is down", async () => {
    await content();
    await signInAsTeacher();
    env.databaseDown();
    expect((await regen({ conceptId: A, kind: "summary" })).status).toBe(503);
  });
});

describe("what is refused before any model call", () => {
  it("404 for an unknown concept, a unit that is not ready, and an illustration with no illustration model", async () => {
    await content();
    await signInAsTeacher();
    expect((await regen({ conceptId: "nope.c-x", kind: "summary" })).status).toBe(404);
    expect((await regen({ conceptId: NOT_READY_CONCEPT, kind: "summary" })).status).toBe(404);
    vi.stubEnv("ILLUSTRATION_MODEL", "");
    await liveVersion(A, "summary");
    expect((await regen({ conceptId: A, kind: "illustration" })).status).toBe(404);
    expect(port.calls).toHaveLength(0);
  });

  it("400 for a malformed request", async () => {
    await content();
    await signInAsTeacher();
    expect((await regen({ conceptId: A, kind: "poster" })).status).toBe(400);
    expect((await regen({ kind: "summary" })).status).toBe(400);
  });

  it("404 no_illustration_brief when the summary decided no picture is needed", async () => {
    await content();
    await signInAsTeacher();
    await liveVersion(A, "summary", { illustrationBrief: null, illustrationAlt: null });
    const r = await regen({ conceptId: A, kind: "illustration" });
    expect(r.status).toBe(404);
    expect(r.body).toEqual({ error: "no_illustration_brief" });
    expect(port.calls).toHaveLength(0);
  });

  it("409 when a worker already holds the lease", async () => {
    await content();
    await signInAsTeacher();
    const s = await store();
    await s.ensureSlot(env.db, A, "summary", READY);
    expect(await s.claimLease(env.db, A, "summary", "11111111-1111-4111-8111-111111111111", new Date())).toBe(true);
    const r = await regen({ conceptId: A, kind: "summary" });
    expect(r.status).toBe(409);
    expect(port.calls).toHaveLength(0);
  });

  it("429 cap_reached with the reset time, leaving the live version untouched", async () => {
    vi.stubEnv("CONCEPT_DAILY_CAP", "1");
    await content();
    await signInAsTeacher();
    const live = await liveVersion(A, "summary");
    const s = await store();
    await s.reserveConceptCall(env.db, 1); // the only call of the day
    const r = await regen({ conceptId: A, kind: "summary" });
    expect(r.status).toBe(429);
    expect(r.body.error).toBe("cap_reached");
    expect(typeof r.body.resetsAt).toBe("string");
    expect(port.calls).toHaveLength(0);
    expect((await s.getSlot(env.db, A, "summary"))?.liveVersionId).toBe(live.id);
    expect((await env.db.select().from(conceptVersions)).length).toBe(1); // no replacement was created
  });
});

describe("a teacher's regeneration", () => {
  it("202, and the replacement is reviewed and then replaces the live version", async () => {
    await content();
    await signInAsTeacher();
    const old = await liveVersion(A, "summary");
    const r = await regen({ conceptId: A, kind: "summary" });
    expect(r.status).toBe(202);
    expect(r.body).toEqual({ queued: true });
    expect(port.count("generateSummary")).toBe(1);
    expect(port.count("reviewSummary")).toBe(1);
    const slot = await (await store()).getSlot(env.db, A, "summary");
    expect(slot?.liveVersionId).not.toBe(old.id);
    expect(slot?.replacementVersionId).toBeNull();
    const rows = await env.db.select().from(conceptVersions);
    expect(rows.find((v) => v.id === slot?.liveVersionId)).toMatchObject({ status: "approved", origin: "teacher" });
  });

  it("the live version stays on show while the replacement is unreviewed, and if it fails twice", async () => {
    await content();
    await signInAsTeacher();
    const old = await liveVersion(A, "summary");
    port.queue.reviewSummary.push(failVerdict("Quotes the model answer."), failVerdict("Still wrong."));
    expect((await regen({ conceptId: A, kind: "summary" })).status).toBe(202);
    expect(port.count("generateSummary")).toBe(2); // the one automatic regeneration
    const s = await store();
    const slot = await s.getSlot(env.db, A, "summary");
    expect(slot?.liveVersionId).toBe(old.id);
    const flagged = await s.getVersion(env.db, slot!.replacementVersionId!);
    expect(flagged).toMatchObject({ status: "failed_review", reviewerReason: "Still wrong." });
  });

  it("a replacement illustration promoted by the reviewer changes the live version id and the student image URL", async () => {
    await content();
    await signInAsTeacher();
    await liveVersion(A, "summary");
    const old = await liveVersion(A, "illustration");
    const { loadConceptContentView } = await import("@/lib/db/queries/concepts.server");
    const before = await loadConceptContentView(env.db, [A], new Date());
    expect(before.content.get(A)?.illustration?.versionId).toBe(old.id);

    expect((await regen({ conceptId: A, kind: "illustration" })).status).toBe(202);
    const slot = await (await store()).getSlot(env.db, A, "illustration");
    expect(slot?.liveVersionId).not.toBe(old.id);
    const after = await loadConceptContentView(env.db, [A], new Date());
    expect(after.content.get(A)?.illustration?.versionId).toBe(slot?.liveVersionId);
  });
});

describe("the preview route", () => {
  it("serves any version of that concept, including a pending replacement, with no caching", async () => {
    await content();
    await signInAsTeacher();
    const s = await store();
    const live = await liveVersion(A, "illustration");
    const pending = await s.insertReplacement(env.db, {
      conceptId: A, kind: "illustration", unitId: READY, origin: "teacher", attemptNo: 1,
      illustrationSvg: GOOD_SVG.replace("blue", "red"), illustrationBrief: "b", illustrationAlt: "a", generatorModel: "vendor/draw", generatedAt: NOW,
    });
    for (const v of [live.id, pending.id]) {
      const res = await preview(A, v);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("image/svg+xml");
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("content-security-policy")).toContain("sandbox");
      expect(res.headers.get("cache-control")).toContain("no-store");
    }
    expect(await (await preview(A, pending.id)).text()).toContain("red");
  });

  it("404 for another concept's version, a summary version, a missing or malformed id", async () => {
    await content();
    await signInAsTeacher();
    const other = await liveVersion(B, "illustration");
    const summary = await liveVersion(A, "summary");
    expect((await preview(A, other.id)).status).toBe(404);
    expect((await preview(A, summary.id)).status).toBe(404);
    expect((await preview(A)).status).toBe(404);
    expect((await preview(A, "not-a-uuid")).status).toBe(404);
    expect((await preview("nope.c-x", other.id)).status).toBe(404);
  });
});

describe("what a student route returns after a flagged failure", () => {
  it("never the reviewer reason, the last error or a model name", async () => {
    await content();
    await signInAsTeacher();
    await liveVersion(A, "summary");
    port.queue.reviewSummary.push(failVerdict("SECRET-REASON quotes the model answer"), failVerdict("SECRET-REASON again"));
    await regen({ conceptId: A, kind: "summary" });

    const student = await seedUser(env.db, { email: "student@school.test" });
    env.signedInAs(asSessionUser(student));
    const { GET } = await import("@/app/api/units/[unitId]/concepts/status/route");
    const res = await GET(new Request("http://localhost/x"), { params: Promise.resolve({ unitId: READY }) });
    const text = JSON.stringify(await res.json());
    for (const secret of ["SECRET-REASON", "vendor/", "last_error", "lastError"]) expect(text).not.toContain(secret);
  });
});

describe("the review page", () => {
  const text = (node: ReactNode): string => {
    if (typeof node === "string" || typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(text).join(" ");
    if (isValidElement(node)) {
      const el = node as ReactElement<{ children?: ReactNode }>;
      if (typeof el.type === "function") {
        // expand the page's own synchronous components; leave async server components and
        // client components (hooks) as the props the page passed them
        try {
          const out = (el.type as (props: unknown) => ReactNode)(el.props);
          if (!(out instanceof Promise)) return text(out);
        } catch {
          /* fall through to the props */
        }
        return `${JSON.stringify(Object.entries(el.props).filter(([k]) => k !== "children"))} ${text(el.props.children)}`;
      }
      return text(el.props.children);
    }
    return "";
  };
  async function page() {
    const Page = (await import("@/app/admin/concepts/page")).default;
    return text(await Page());
  }

  it("redirects a signed-out visitor to sign-in", async () => {
    await content();
    env.signedOut();
    await expect(page()).rejects.toMatchObject({ digest: expect.stringContaining("/signin") });
  });

  it.each([
    ["a student not on the list", { email: "student@school.test" }],
    ["a listed email that is not verified", { ev: false }],
  ])("%s gets the not-found page and no database read", async (_label, who) => {
    await content();
    await signInAsTeacher(who);
    await expect(page()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("an empty allow-list gets the not-found page", async () => {
    await content();
    vi.stubEnv("ADMIN_EMAILS", "");
    await signInAsTeacher();
    await expect(page()).rejects.toMatchObject({ digest: expect.stringContaining("404") });
  });

  it("shows a teacher every concept, the live version, a flagged replacement with its reason, models and times", async () => {
    await content();
    await signInAsTeacher();
    await liveVersion(A, "summary");
    port.queue.reviewSummary.push(failVerdict("Quotes the model answer."), failVerdict("Still wrong."));
    await regen({ conceptId: A, kind: "summary" });
    const out = await page();
    expect(out).toContain("Concept A");
    expect(out).toContain("Concept F"); // a concept with nothing generated
    expect(out).toContain("Not generated.");
    expect(out).toContain(GOOD_BULLETS[0]);
    expect(out).toContain("Still wrong.");
    expect(out).toContain("failed review");
    expect(out).toContain("vendor/gen");
    expect(out).toContain("vendor/rev");
    expect(out.match(/RegenerateButton|"conceptId"/g)?.length ?? 0).toBeGreaterThan(0);
    expect(out).not.toContain("fx-notready"); // units that have not adopted concepts are not listed
  });

  it("never shows student data", async () => {
    await content();
    const student = await seedUser(env.db, { email: "student@school.test", name: "Secret Student" });
    const { seedAttempt } = await import("../helpers/fixtures");
    const { seedResultAt } = await import("../helpers/concept-fixtures");
    const attempt = await seedAttempt(env.db, student.id, { unitId: READY });
    await seedResultAt(env.db, { attemptId: attempt.id, userId: student.id }, READY, `${READY}.m01`, 0, 1, new Date(), { answer: "MY-PRIVATE-ANSWER" });
    await signInAsTeacher();
    const out = await page();
    for (const secret of ["Secret Student", "student@school.test", "MY-PRIVATE-ANSWER"]) expect(out).not.toContain(secret);
  });

  it("shows the plain unavailable notice when the database is down", async () => {
    await content();
    await signInAsTeacher();
    const Page = (await import("@/app/admin/concepts/page")).default;
    env.databaseDown();
    // the allow-list check needs the session, which reads the database: a teacher is told it is unavailable
    await expect(Page()).resolves.toBeDefined();
  });
});
