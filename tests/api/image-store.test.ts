// The image route's lookup reads the SHARED text store (spec 009 research R2, task T039): one route serves the visual
// texts of both Advanced English units, whichever unit's questions show them. Unmocked: the real store and files.

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { storeTexts } from "@/content/units/y12-english-advanced-unseen-texts/store-texts";
import { findVisualText, imageDirectory } from "@/lib/unseen/images.server";

describe("findVisualText", () => {
  it("finds every visual text of the store, and only visual texts", () => {
    const visuals = storeTexts.filter((t) => t.body.kind === "image");
    expect(visuals.length).toBeGreaterThan(0);
    for (const t of visuals) expect(findVisualText(t.id)?.id).toBe(t.id);
    for (const t of storeTexts.filter((x) => x.body.kind !== "image").slice(0, 5)) expect(findVisualText(t.id)).toBeNull();
    expect(findVisualText("no-such-text")).toBeNull();
  });

  it("has a file in the store's images folder for each visual, so a visual only the comparative unit shows is served too", () => {
    for (const t of storeTexts.filter((x) => x.body.kind === "image")) {
      const body = t.body as { image: string };
      expect(fs.existsSync(path.join(imageDirectory(), `${body.image}.webp`))).toBe(true);
    }
  });
});
