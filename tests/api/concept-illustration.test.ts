// GET /api/concepts/[conceptId]/illustration: a concept's live approved picture, for <img> only
// (spec 002 FR-019; constitution Principle VII; contracts/api.md).

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { asSessionUser, setupTestEnv, type TestEnv } from "../helpers/env";
import { seedUser } from "../helpers/fixtures";
import { GOOD_SVG, READY, conceptId, fixtureContent } from "../helpers/concept-fixtures";

const A = conceptId("a");
const B = conceptId("b");
let env: TestEnv;

beforeEach(async () => {
  env = await setupTestEnv();
  fixtureContent();
  env.signedInAs(asSessionUser(await seedUser(env.db)));
});
afterEach(async () => {
  await env.close();
});

const NOW = new Date("2026-10-28T10:00:00Z");

async function store() {
  return import("@/lib/concepts/store.server");
}
async function makePicture(conceptIdValue: string, svg = GOOD_SVG) {
  const s = await store();
  return s.insertReplacement(env.db, {
    conceptId: conceptIdValue, kind: "illustration", unitId: READY, origin: "first", attemptNo: 1,
    illustrationSvg: svg, illustrationBrief: "brief", illustrationAlt: "alt text", generatorModel: "vendor/draw", generatedAt: NOW,
  });
}
async function approve(conceptIdValue: string, versionId: string) {
  const s = await store();
  await s.promote(env.db, conceptIdValue, "illustration", versionId, "reviewer", { reviewerModel: "vendor/rev", reason: null, at: NOW });
}
async function get(id: string, v?: string) {
  const { GET } = await import("@/app/api/concepts/[conceptId]/illustration/route");
  const url = `http://localhost/api/concepts/${id}/illustration${v === undefined ? "" : `?v=${v}`}`;
  const res = await GET(new Request(url), { params: Promise.resolve({ conceptId: id }) });
  return res;
}

describe("access", () => {
  it("401 when signed out", async () => {
    env.signedOut();
    expect((await get(A, "00000000-0000-4000-8000-000000000000")).status).toBe(401);
  });

  it("503 (never 401) when the database is down", async () => {
    const v = await makePicture(A);
    await approve(A, v.id);
    env.databaseDown();
    expect((await get(A, v.id)).status).toBe(503);
  });
});

describe("what it serves", () => {
  it("the live approved illustration, with the security headers and a long cache", async () => {
    const v = await makePicture(A);
    await approve(A, v.id);
    const res = await get(A, v.id);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(GOOD_SVG);
    expect(res.headers.get("content-type")).toContain("image/svg+xml");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    const csp = res.headers.get("content-security-policy") ?? "";
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("sandbox");
    expect(res.headers.get("cache-control")).toBe("private, max-age=31536000, immutable");
  });

  it("404 for an unknown concept, and for a missing, malformed or unknown version", async () => {
    const v = await makePicture(A);
    await approve(A, v.id);
    expect((await get("fx-ready.c-nope", v.id)).status).toBe(404);
    expect((await get(A)).status).toBe(404);
    expect((await get(A, "not-a-uuid")).status).toBe(404);
    expect((await get(A, "00000000-0000-4000-8000-000000000000")).status).toBe(404);
  });

  it("404 for a pending version and for a version that failed review", async () => {
    const pending = await makePicture(A);
    expect((await get(A, pending.id)).status).toBe(404);
    const s = await store();
    await s.markReviewed(env.db, pending.id, { status: "failed_review", reviewerModel: "vendor/rev", reason: "wrong axes", at: NOW });
    expect((await get(A, pending.id)).status).toBe(404);
  });

  it("404 for a superseded version once a newer one is live", async () => {
    const old = await makePicture(A, GOOD_SVG);
    await approve(A, old.id);
    const newer = await makePicture(A, GOOD_SVG.replace("Quantity", "Qty"));
    await approve(A, newer.id);
    expect((await get(A, newer.id)).status).toBe(200);
    expect((await get(A, old.id)).status).toBe(404);
  });

  it("404 when the version belongs to another concept, or is a summary", async () => {
    const pictureB = await makePicture(B);
    await approve(B, pictureB.id);
    expect((await get(A, pictureB.id)).status).toBe(404); // another concept's picture, asked for under A
    const s = await store();
    const summary = await s.insertReplacement(env.db, {
      conceptId: A, kind: "summary", unitId: READY, origin: "first", attemptNo: 1,
      summaryBullets: ["a", "b", "c"], generatorModel: "vendor/gen", generatedAt: NOW,
    });
    await s.promote(env.db, A, "summary", summary.id, "reviewer", { reviewerModel: "vendor/rev", reason: null, at: NOW });
    expect((await get(A, summary.id)).status).toBe(404);
  });
});
