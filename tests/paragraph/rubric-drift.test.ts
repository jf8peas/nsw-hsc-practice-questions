// The prompt version is bumped on every change (spec 007 FR-030). lib/paragraph/rubric.json is the
// one source of the criteria, conventions, prompts and `promptVersion`, read by the app and by the
// Python regression script. This test fails when the file changes without the version bump and the
// regenerated golden prompt and hash (`python scripts/pilot-paragraph-marker.py --write-golden`).

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PROMPT_VERSION } from "@/lib/paragraph/marker.server";

const root = path.resolve(__dirname, "../..");
const rubricBytes = fs.readFileSync(path.join(root, "lib/paragraph/rubric.json"));
const recorded = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/rubric.hash"), "utf8")) as { sha256: string; promptVersion: string };
const sha = crypto.createHash("sha256").update(rubricBytes.toString("utf8").replace(/\r\n/g, "\n")).digest("hex");

describe("rubric.json and the prompt version", () => {
  it("the app reads the version from the file", () => {
    expect(PROMPT_VERSION).toBe(JSON.parse(rubricBytes.toString("utf8")).promptVersion);
  });

  it("a change to rubric.json comes with a bumped promptVersion", () => {
    if (sha !== recorded.sha256) {
      expect(
        PROMPT_VERSION,
        "rubric.json changed but promptVersion did not: bump promptVersion, then run `python scripts/pilot-paragraph-marker.py --write-golden`",
      ).not.toBe(recorded.promptVersion);
    }
  });

  it("the recorded hash and version match the file (regenerate them after a deliberate change)", () => {
    expect(
      { sha256: sha, promptVersion: PROMPT_VERSION },
      "run `python scripts/pilot-paragraph-marker.py --write-golden` and commit tests/fixtures",
    ).toEqual(recorded);
  });
});
