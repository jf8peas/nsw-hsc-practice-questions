// The pure half of the pre-release description check (spec 008 FR-017): majority vote over every
// sample answer three times, a fail is recorded, no samples never pass, and the hash follows the
// description.

import { describe, expect, it } from "vitest";

import { REPEATS, checkDescription, hashDescription, renderChecksFile } from "../../scripts/check-unseen-descriptions-lib";

const base = { description: "A drawing of a table.", model: "m", promptVersion: "unseen-pilot-4", now: new Date("2026-11-19T10:00:00Z") };

describe("checkDescription", () => {
  it("passes when most calls say the description was enough, calling the marker samples × 3 times", async () => {
    let calls = 0;
    const r = await checkDescription({ ...base, samples: ["a", "b"], mark: async () => (calls++, true) });
    expect(calls).toBe(2 * REPEATS);
    expect(r).toMatchObject({ adequate: true, samples: 2, checkedAt: "2026-11-19", promptVersion: "unseen-pilot-4", model: "m" });
  });

  it("records a failure instead of hiding it", async () => {
    const r = await checkDescription({ ...base, samples: ["a"], mark: async () => false });
    expect(r.adequate).toBe(false);
  });

  it("counts a failed call as not adequate", async () => {
    const r = await checkDescription({ ...base, samples: ["a"], mark: async () => null });
    expect(r.adequate).toBe(false);
  });

  it("needs a majority of calls on EVERY sample, not just overall", async () => {
    const r = await checkDescription({ ...base, samples: ["good", "bad"], mark: async (a) => a === "good" });
    expect(r.adequate).toBe(false);
    const ok = await checkDescription({ ...base, samples: ["a", "b"], mark: async () => true });
    expect(ok.adequate).toBe(true);
  });

  it("never passes with no samples", async () => {
    const r = await checkDescription({ ...base, samples: [], mark: async () => true });
    expect(r.adequate).toBe(false);
    expect(r.samples).toBe(0);
  });

  it("hashes the description, so an edit changes the hash", async () => {
    const a = await checkDescription({ ...base, samples: ["a"], mark: async () => true });
    const b = await checkDescription({ ...base, description: "A different drawing.", samples: ["a"], mark: async () => true });
    expect(a.descriptionHash).toBe(hashDescription(base.description));
    expect(b.descriptionHash).not.toBe(a.descriptionHash);
  });
});

describe("renderChecksFile", () => {
  it("writes a typed record keyed by text id, deterministically", async () => {
    const c = await checkDescription({ ...base, samples: ["a"], mark: async () => true });
    const file = renderChecksFile({ "z-t1": c, "a-t1": c });
    expect(file).toContain('export const descriptionChecks: Record<string, DescriptionCheck> = {');
    expect(file.indexOf('"a-t1"')).toBeLessThan(file.indexOf('"z-t1"'));
    expect(renderChecksFile({ "z-t1": c, "a-t1": c })).toBe(file);
    expect(renderChecksFile({})).toContain("= {};");
  });
});
