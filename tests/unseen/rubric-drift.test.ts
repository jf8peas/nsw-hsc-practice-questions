// lib/unseen/rubric.json cannot change without a new promptVersion and a regenerated golden file
// (spec 008 FR-014, research R5). scripts/pilot-unseen-marker.py --write-golden records the hash.

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/openrouter.server", () => ({ chatCompletion: vi.fn() }));

import { rubric } from "@/lib/unseen/marker.server";

const FIXTURES = path.resolve(__dirname, "../fixtures");

/** The same blob scripts/pilot-unseen-marker.py hashes. Line endings in the JSON file do not matter. */
function rubricHash(): string {
  const verbs = Object.entries(rubric.directiveVerbs)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  return createHash("sha256")
    .update([rubric.systemPrompt, rubric.userTemplate, verbs].join("\n---\n"), "utf8")
    .digest("hex");
}

describe("the rubric file and its version", () => {
  it("has not changed without a new promptVersion and a regenerated golden file", () => {
    const recorded = fs.readFileSync(path.join(FIXTURES, "unseen-rubric.hash"), "utf8").trim();
    const [version, sha] = recorded.split(" ");
    if (version === rubric.promptVersion && sha !== rubricHash()) {
      throw new Error("lib/unseen/rubric.json changed but promptVersion did not: bump promptVersion, then run `python scripts/pilot-unseen-marker.py --write-golden`");
    }
    expect(recorded).toBe(`${rubric.promptVersion} ${rubricHash()}`);
  });

  it("starts at the pilot's passing version", () => {
    expect(rubric.promptVersion).toMatch(/^unseen-pilot-\d+/);
  });
});
