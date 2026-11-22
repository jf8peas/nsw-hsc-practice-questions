import "server-only";

import type { Db } from "@/lib/db/index.server";
import { getLatestIncompleteAttempt } from "@/lib/db/queries/attempts.server";
import { getEssayPhase, latestEssayMarks, latestGapDetails } from "@/lib/db/queries/essay-phases.server";
import { essayPublicView } from "@/lib/grading.server";
import { signAttemptToken } from "@/lib/tokens.server";
import type { Unit } from "@/lib/types";

import { repairFinishedAttempts } from "./results.server";
import { ESSAY_UNIT_ID, type PublicEssay } from "./types";

// What the essay unit's page shows (spec 010 FR-001 to FR-005, research R10): the live essays in the offered
// order, each with the student's latest mark, whether it has the open attempt, and which one is "next up". Every
// query is scoped to the session user. A finished essay whose result row was never saved is repaired first, so it
// cannot leave an attempt open (analysis C2).

export interface EssayListItem {
  question: PublicEssay;
  latest: { mark: number; band: number | null; attemptId: string; at: string } | null;
  /** This essay has the student's open attempt. */
  open: boolean;
  nextUp: boolean;
}

export interface EssayUnitData {
  essays: EssayListItem[];
  /** The open attempt, with the signed attempt token the discard route needs (the page signs it; the client never makes one). */
  openAttempt: { essayId: string; attemptId: string; stage: "scaffold" | "write"; attemptToken: string } | null;
  /** The missing-piece sentence for each concept, from the latest finished essay that listed it. */
  gapDetails: Record<string, string>;
}

export async function loadEssayUnitData(db: Db, userId: string, unit: Unit): Promise<EssayUnitData> {
  let open = await getLatestIncompleteAttempt(db, userId, ESSAY_UNIT_ID);
  if (open) {
    await repairFinishedAttempts(userId, open);
    open = await getLatestIncompleteAttempt(db, userId, ESSAY_UNIT_ID);
  }
  const latest = await latestEssayMarks(db, userId, ESSAY_UNIT_ID);
  const details = await latestGapDetails(db, userId, ESSAY_UNIT_ID);

  let openAttempt: EssayUnitData["openAttempt"] = null;
  if (open) {
    const essayId = open.questionIds[0]!;
    const row = await getEssayPhase(db, userId, open.id, essayId);
    openAttempt = {
      essayId,
      attemptId: open.id,
      stage: row && row.status !== "planning" ? "write" : "scaffold",
      attemptToken: signAttemptToken({ uid: userId, attemptId: open.id, unitId: open.unitId, questionIds: open.questionIds, mcOptionOrder: open.mcOptionOrder }),
    };
  }

  const live = unit.questions.filter((q) => q.type === "essay" && q.live).sort((a, b) => (a.type === "essay" && b.type === "essay" ? a.offer - b.offer : 0));
  const essays: EssayListItem[] = [];
  let nextUp = true;
  for (const q of live) {
    const view = essayPublicView(q.id);
    if (!view) continue;
    const l = latest.get(q.id);
    essays.push({
      question: view,
      latest: l ? { mark: l.mark, band: l.band, attemptId: l.attemptId, at: l.at.toISOString() } : null,
      open: openAttempt?.essayId === q.id,
      nextUp: !l && nextUp,
    });
    if (!l) nextUp = false;
  }
  return { essays, openAttempt, gapDetails: Object.fromEntries(details) };
}
