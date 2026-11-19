// GET /api/unseen/image/<text id> (spec 008 FR-004, constitution Principle V exception): bytes only,
// signed-in students only. The route reaches the content and the files through lib/unseen/images.server,
// which these tests mock to inject a visual text and a temporary folder.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { signedInStudent } from "../helpers/routes";
import { setupTestEnv, type TestEnv } from "../helpers/env";

let env: TestEnv;
let dir: string;
const BYTES = Buffer.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4]); // "RIFF" + a few bytes: enough for an opaque body

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "unseen-img-"));
  fs.writeFileSync(path.join(dir, "vis-1.webp"), BYTES);
  vi.doMock("@/lib/unseen/images.server", () => ({
    findVisualText: (id: string) => (id === "vis-1" ? { id: "vis-1", body: { kind: "image", image: "vis-1", alt: "A neutral label" } } : null),
    imageDirectory: () => dir,
  }));
});
afterEach(async () => {
  vi.doUnmock("@/lib/unseen/images.server");
  fs.rmSync(dir, { recursive: true, force: true });
  await env?.close();
});

async function get(textId: string) {
  const { GET } = await import("@/app/api/unseen/image/[textId]/route");
  return GET(new Request(`http://localhost/api/unseen/image/${textId}`), { params: Promise.resolve({ textId }) });
}

describe("the image route", () => {
  it("serves the bytes with private caching to a signed-in student, and nothing else", async () => {
    env = await setupTestEnv();
    await signedInStudent(env);
    const res = await get("vis-1");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/webp");
    expect(res.headers.get("cache-control")).toBe("private, max-age=86400");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("vary")).toBe("Cookie");
    expect(Buffer.from(await res.arrayBuffer())).toEqual(BYTES);
  });

  it("is 401 with no session", async () => {
    env = await setupTestEnv();
    env.signedOut();
    const res = await get("vis-1");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthenticated" });
  });

  it("answers one 404 body for an unknown id, a text that is not an image and a malformed id", async () => {
    env = await setupTestEnv();
    await signedInStudent(env);
    const bodies = [];
    for (const id of ["nope", "fs25-t1", "..%2Fsecret", "UPPER", "-x"]) {
      const res = await get(id);
      expect(res.status, id).toBe(404);
      bodies.push(await res.json());
    }
    expect(new Set(bodies.map((b) => JSON.stringify(b))).size).toBe(1);
    expect(bodies[0]).toEqual({ error: "not_found" });
  });

  it("is a 404 (not a crash) when the file is missing", async () => {
    env = await setupTestEnv();
    await signedInStudent(env);
    fs.rmSync(path.join(dir, "vis-1.webp"));
    expect((await get("vis-1")).status).toBe(404);
  });
});
