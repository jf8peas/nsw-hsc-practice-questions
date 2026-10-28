import "server-only";

import type { ConceptModels } from "@/lib/config.server";
import type { Db } from "@/lib/db/index.server";
import type { ConceptSlotRow, ConceptVersionRow } from "@/lib/db/schema";
import { pipelineAction } from "@/lib/concepts/pipeline.server";
import type { ConceptState } from "@/lib/concepts/progress";
import { getVersionsByIds, listSlots, type ConceptKind } from "@/lib/concepts/store.server";

// Which concept items a student's visit should start work on (spec 002 research R5). Work is only
// ever started for the student's OWN uncleared concepts, and only in the cases the constitution
// allows (nothing stored, a pending review to retry, the single owed regeneration). A version
// that failed review twice is never picked: it is terminal until a teacher acts.

export interface PlannedWork {
  conceptId: string;
  kind: ConceptKind;
}

/** At most this many concepts are started per visit. */
export const MAX_PER_VISIT = 3;

const heldOrBackedOff = (slot: ConceptSlotRow | undefined, now: Date) =>
  Boolean(
    slot &&
      ((slot.leaseUntil && slot.leaseUntil.getTime() > now.getTime()) ||
        (slot.retryAfter && slot.retryAfter.getTime() > now.getTime())),
  );

/**
 * The work to start, highest-count concept first. A concept needs its summary first; once the
 * live summary asked for a picture (and an illustration model is set) it may need its picture.
 */
export async function planConceptWork(
  db: Db,
  states: ConceptState[],
  models: Pick<ConceptModels, "illustration">,
  now: Date,
  max: number = MAX_PER_VISIT,
): Promise<PlannedWork[]> {
  const ids = states.map((s) => s.conceptId);
  const slots = await listSlots(db, ids);
  const slotOf = new Map(slots.map((s) => [`${s.conceptId}|${s.kind}`, s]));
  const versionIds = slots.flatMap((s) => [s.liveVersionId, s.replacementVersionId]).filter((x): x is string => Boolean(x));
  const versions = await getVersionsByIds(db, versionIds);
  const versionOf = (id: string | null | undefined): ConceptVersionRow | null => (id ? (versions.get(id) ?? null) : null);

  const work: PlannedWork[] = [];
  for (const { conceptId } of states) {
    if (work.length >= max) break;

    const summary = slotOf.get(`${conceptId}|summary`);
    if (heldOrBackedOff(summary, now)) continue;
    if (pipelineAction(summary ?? null, versionOf(summary?.replacementVersionId), "first") !== "none") {
      work.push({ conceptId, kind: "summary" });
      continue;
    }

    // the summary is settled; does the live one want a picture that has not been made yet?
    if (!models.illustration || !summary?.liveVersionId) continue;
    if (!versionOf(summary.liveVersionId)?.illustrationBrief) continue;
    const picture = slotOf.get(`${conceptId}|illustration`);
    if (heldOrBackedOff(picture, now)) continue;
    if (pipelineAction(picture ?? null, versionOf(picture?.replacementVersionId), "first") !== "none") {
      work.push({ conceptId, kind: "illustration" });
    }
  }
  return work;
}
