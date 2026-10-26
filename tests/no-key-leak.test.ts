// Principle I: the answer key never reaches the browser. Checks the attempt
// payload for every unit, the stored result shape, and the public content module.

import fs from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { UNITS } from "@/content";
import { getAnswer } from "@/content/answers";
import { results } from "@/lib/db/schema";

import { allKeys, post, setupRouteEnv, signedInStudent, type RouteEnv } from "./helpers/routes";

let env: RouteEnv | undefined;
afterEach(async () => {
  await env?.close();
  env = undefined;
});

const BANNED_KEYS = ["correctText", "correctIndex", "modelAnswer", "rubric", "notes", "answers"];

describe("POST /api/attempts exposes no answer key, for every unit", () => {
  for (const unit of UNITS) {
    it(unit.id, async () => {
      env = await setupRouteEnv();
      await signedInStudent(env);
      const { POST } = await import("@/app/api/attempts/route");
      const res = await POST(post("/api/attempts", { unitId: unit.id }));
      expect(res.status).toBe(201);
      const body = await res.json();
      const text = JSON.stringify(body);

      const keys = allKeys(body);
      for (const banned of BANNED_KEYS) expect(keys.has(banned), banned).toBe(false);

      for (const q of body.questions as Array<{ id: string }>) {
        const key = getAnswer(q.id)!;
        if (key.modelAnswer && key.modelAnswer.length > 20) expect(text).not.toContain(key.modelAnswer);
        for (const point of key.rubric) if (point.length > 20) expect(text).not.toContain(point);
        if (key.notes && key.notes.length > 20) expect(text).not.toContain(key.notes);
      }
    });
  }
});

describe("stored results have no field that could hold the answer key", () => {
  it("results columns", () => {
    const columns = Object.keys(results).filter((k) => !k.startsWith("_") && k !== "enableRLS");
    for (const banned of ["modelAnswer", "rubric", "notes", "correctText", "correctIndex"]) {
      expect(columns).not.toContain(banned);
    }
  });
});

describe("the answer-key registry stays server-only", () => {
  it("content/answers/index.ts imports server-only", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../content/answers/index.ts"), "utf8");
    expect(src).toMatch(/^import "server-only";/m);
  });

  it("only lib/grading.server.ts imports content/answers (outside content/ itself and tests)", () => {
    const root = path.resolve(__dirname, "..");
    const offenders: string[] = [];
    const skip = new Set(["node_modules", ".next", "content", "tests", ".git", "specs", ".specify", "resources"]);
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (skip.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) {
          const rel = path.relative(root, full).split(path.sep).join("/");
          if (rel === "lib/grading.server.ts") continue;
          if (/from\s+["']@\/content\/answers|from\s+["'][./]*content\/answers/.test(fs.readFileSync(full, "utf8"))) {
            offenders.push(rel);
          }
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});
