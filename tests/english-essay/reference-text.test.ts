import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { referenceTexts } from "@/lib/db/schema";
import { sha256Hex } from "@/lib/english-essay/play-index";
import { loadReferenceIndex, ReferenceTextUnavailableError, resetReferenceTextCache } from "@/lib/english-essay/reference-text.server";

import { createTestDb, type TestDb } from "../helpers/db";
import { INVENTED_PLAY, INVENTED_QUOTE_OK, seedReferenceText } from "../helpers/english-essay";

// Only a short invented passage is ever seeded: no real play text is read or committed (tasks.md T010).

let t: TestDb;
beforeEach(async () => {
  resetReferenceTextCache();
  t = await createTestDb();
});
afterEach(async () => {
  await t.close();
});

describe("loadReferenceIndex", () => {
  it("builds the index from the stored text, from the act marker, with its 64-character hash", async () => {
    const hash = await seedReferenceText(t.db);
    const ref = await loadReferenceIndex(t.db);
    expect(ref.hash).toBe(hash);
    expect(ref.hash).toHaveLength(64);
    expect(ref.index.found(INVENTED_QUOTE_OK.split(" "))).toBe(true);
    // the front matter before "ACT ONE" is not indexed
    expect(ref.index.found(["title", "page", "and", "notes"])).toBe(false);
  });

  it("caches the index by content hash and rebuilds when the text changes", async () => {
    await seedReferenceText(t.db);
    const a = await loadReferenceIndex(t.db);
    const b = await loadReferenceIndex(t.db);
    expect(b.index).toBe(a.index);
    const changed = `${INVENTED_PLAY}\nA brand new invented sentence about a quiet harbour.`;
    await seedReferenceText(t.db, changed);
    const c = await loadReferenceIndex(t.db);
    expect(c.hash).toBe(sha256Hex(changed));
    expect(c.index).not.toBe(a.index);
  });

  it("raises the dedicated error when the row is missing, empty or has a bad hash", async () => {
    await expect(loadReferenceIndex(t.db)).rejects.toBeInstanceOf(ReferenceTextUnavailableError);
    await t.db.insert(referenceTexts).values({ id: "away", content: "   ", contentHash: sha256Hex("   ") });
    await expect(loadReferenceIndex(t.db)).rejects.toBeInstanceOf(ReferenceTextUnavailableError);
    await t.db.update(referenceTexts).set({ content: INVENTED_PLAY, contentHash: "short" });
    await expect(loadReferenceIndex(t.db)).rejects.toBeInstanceOf(ReferenceTextUnavailableError);
  });

  it("reports an unreadable database as unavailable, not as a generic failure", async () => {
    await t.close();
    await expect(loadReferenceIndex(t.db)).rejects.toBeInstanceOf(ReferenceTextUnavailableError);
    t = await createTestDb(); // so afterEach closes a live database
  });
});
