import "server-only";

import { eq } from "drizzle-orm";

import type { Db } from "@/lib/db/index.server";
import { referenceTexts } from "@/lib/db/schema";

import { PlayIndex } from "./play-index";

// The only reader of the shared `reference_texts` table (spec 011, data-model §4; constitution Principles I and V).
// The full play is server-only: this module loads it, builds the normalised quote index once per content hash and
// hands the index to the quote checker. No browser route calls it, and it makes no model call and takes no daily slot.

export const AWAY_REFERENCE_ID = "away";

/** The reference text is missing, empty or unreadable. Marking refuses before any model call or daily slot. */
export class ReferenceTextUnavailableError extends Error {
  constructor(message = "reference text unavailable", options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ReferenceTextUnavailableError";
  }
}

export interface ReferenceIndex {
  id: string;
  hash: string;
  index: PlayIndex;
}

const cache = new Map<string, ReferenceIndex>();

/** Clears the cached index (tests). */
export function resetReferenceTextCache(): void {
  cache.clear();
}

/** The play's index for quote checking, cached by content hash. Throws ReferenceTextUnavailableError when unusable. */
export async function loadReferenceIndex(db: Db, id: string = AWAY_REFERENCE_ID): Promise<ReferenceIndex> {
  let row: { content: string; contentHash: string } | undefined;
  try {
    const rows = await db
      .select({ content: referenceTexts.content, contentHash: referenceTexts.contentHash })
      .from(referenceTexts)
      .where(eq(referenceTexts.id, id))
      .limit(1);
    row = rows[0];
  } catch (error) {
    throw new ReferenceTextUnavailableError("reference text could not be read", { cause: error });
  }
  if (!row || !row.content.trim() || row.contentHash.length !== 64) throw new ReferenceTextUnavailableError();
  const cached = cache.get(id);
  if (cached && cached.hash === row.contentHash) return cached;
  const index = new PlayIndex(row.content);
  if (index.words.length === 0) throw new ReferenceTextUnavailableError("reference text is empty");
  const built: ReferenceIndex = { id, hash: row.contentHash, index };
  cache.set(id, built);
  return built;
}
