// The backend approval of a held-back concept item (spec 002 FR-053; research R10):
// `npm run concept:approve` — the logic lives in lib/concepts/approve.server.ts.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { conceptVersions } from "@/lib/db/schema";

import { setupTestEnv, type TestEnv } from "../helpers/env";
import { GOOD_BULLETS, GOOD_SVG, READY, conceptId, fixtureContent } from "../helpers/concept-fixtures";

const A = conceptId("a");
const NOW = new Date("2026-10-28T10:00:00Z");
let env: TestEnv;

beforeEach(async () => {
  env = await setupTestEnv();
  fixtureContent();
});
afterEach(async () => {
  await env.close();
});

const store = () => import("@/lib/concepts/store.server");
const approve = () => import("@/lib/concepts/approve.server");

/** A summary or illustration that failed review twice and sits in the slot's replacement pointer. */
async function flagged(kind: "summary" | "illustration" = "summary", extra: Record<string, unknown> = {}) {
  const s = await store();
  const v = await s.insertReplacement(env.db, {
    conceptId: A,
    kind,
    unitId: READY,
    origin: "auto_retry",
    attemptNo: 2,
    generatorModel: "vendor/gen",
    generatedAt: NOW,
    ...(kind === "summary"
      ? { summaryBullets: GOOD_BULLETS }
      : { illustrationSvg: GOOD_SVG, illustrationBrief: "b", illustrationAlt: "a" }),
    ...extra,
  });
  await s.markReviewed(env.db, v.id, { status: "failed_review", reviewerModel: "vendor/rev", reason: "Still wrong.", at: NOW });
  return v;
}
const row = async (id: string) => (await env.db.select().from(conceptVersions).where(eq(conceptVersions.id, id)))[0];

describe("approving a flagged item", () => {
  it("makes it live, approved by the teacher, clears the pointer and keeps the reviewer's fields", async () => {
    const v = await flagged();
    const { approveConcept } = await approve();
    const result = await approveConcept(env.db, { conceptId: A, kind: "summary" });
    expect(result.status).toBe("approved");

    const s = await store();
    const slot = await s.getSlot(env.db, A, "summary");
    expect(slot?.liveVersionId).toBe(v.id);
    expect(slot?.replacementVersionId).toBeNull();
    expect(await row(v.id)).toMatchObject({
      status: "approved",
      approvedBy: "teacher",
      reviewerModel: "vendor/rev",
      reviewerReason: "Still wrong.",
    });
  });

  it("is idempotent: a second run changes nothing and says so", async () => {
    const v = await flagged();
    const { approveConcept } = await approve();
    await approveConcept(env.db, { conceptId: A, kind: "summary" });
    const before = await row(v.id);
    const again = await approveConcept(env.db, { conceptId: A, kind: "summary" });
    expect(again.status).toBe("already_live");
    expect(await row(v.id)).toEqual(before);
  });

  it("refuses a concept with nothing waiting and nothing live", async () => {
    const { approveConcept } = await approve();
    expect((await approveConcept(env.db, { conceptId: A, kind: "summary" })).status).toBe("no_replacement");
    expect((await approveConcept(env.db, { conceptId: "nope.c-x", kind: "summary" })).status).toBe("not_found");
  });
});

describe("--bullets-file", () => {
  it("replaces the bullets before approving", async () => {
    const v = await flagged();
    const { approveConcept } = await approve();
    const bullets = ["Corrected first.", "Corrected second.", "Corrected third."];
    const result = await approveConcept(env.db, { conceptId: A, kind: "summary", bullets });
    expect(result.status).toBe("approved");
    expect((await row(v.id)).summaryBullets).toEqual(bullets);
  });

  it("rejects fewer than 3, more than 6, a blank or an over-long bullet, and changes nothing", async () => {
    const v = await flagged();
    const { approveConcept } = await approve();
    const bad = [
      ["one", "two"],
      ["1", "2", "3", "4", "5", "6", "7"],
      ["fine", "fine too", "   "],
      ["fine", "fine too", "x".repeat(241)],
    ];
    for (const bullets of bad) {
      const r = await approveConcept(env.db, { conceptId: A, kind: "summary", bullets });
      expect(r.status).toBe("invalid");
    }
    expect((await row(v.id)).status).toBe("failed_review");
    expect((await row(v.id)).summaryBullets).toEqual(GOOD_BULLETS);
  });

  it("is only for summaries", async () => {
    await flagged("illustration");
    const { approveConcept } = await approve();
    expect((await approveConcept(env.db, { conceptId: A, kind: "illustration", bullets: ["a", "b", "c"] })).status).toBe("invalid");
  });
});

describe("a hand-edited picture", () => {
  it("is checked against the SVG rules before it goes live", async () => {
    const v = await flagged("illustration", { illustrationSvg: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>' });
    const { approveConcept } = await approve();
    expect((await approveConcept(env.db, { conceptId: A, kind: "illustration" })).status).toBe("invalid");
    expect((await row(v.id)).status).toBe("failed_review");
  });

  it("an edited picture that passes the rules goes live", async () => {
    const v = await flagged("illustration");
    const { approveConcept } = await approve();
    expect((await approveConcept(env.db, { conceptId: A, kind: "illustration" })).status).toBe("approved");
    expect((await row(v.id)).status).toBe("approved");
  });
});

describe("the command", () => {
  const script = path.resolve(__dirname, "../../scripts/approve-concept.ts");
  const run = (args: string[], env: Record<string, string>) =>
    spawnSync("npx", ["tsx", "--conditions=react-server", script, ...args], {
      cwd: path.resolve(__dirname, "../.."),
      env: { ...process.env, ...env },
      encoding: "utf8",
      shell: true,
      timeout: 60_000,
    });

  it("refuses to run without DATABASE_URL", () => {
    const r = run(["--concept", A, "--kind", "summary"], { DATABASE_URL: "" });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("DATABASE_URL");
  });

  it("explains its arguments when they are missing or wrong", () => {
    const missing = run([], { DATABASE_URL: "" });
    expect(missing.status).toBe(2);
    expect(missing.stderr).toContain("Usage");
    const badKind = run(["--concept", A, "--kind", "poster"], { DATABASE_URL: "" });
    expect(badKind.status).toBe(2);
    expect(badKind.stderr).toContain("Usage");
  });

  it("reads a bullets file with one bullet per line, ignoring blank lines", async () => {
    const { parseBulletsFile } = await approve();
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "bullets-")), "b.txt");
    fs.writeFileSync(file, "First\n\n  Second  \r\nThird\n");
    expect(parseBulletsFile(file)).toEqual(["First", "Second", "Third"]);
  });
});
