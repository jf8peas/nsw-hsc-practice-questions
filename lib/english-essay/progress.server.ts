import "server-only";

import type { Db } from "@/lib/db/index.server";
import { getLatestIncompleteAttempt } from "@/lib/db/queries/attempts.server";
import { getEnglishEssayPhase, latestEnglishEssayMarks, latestEnglishGapDetails } from "@/lib/db/queries/english-essay-phases.server";
import { englishEssayPublicView } from "@/lib/grading.server";
import { signAttemptToken } from "@/lib/tokens.server";
import type { Unit } from "@/lib/types";

import { repairFinishedEnglishAttempts } from "./results.server";
import { ENGLISH_ESSAY_UNIT_ID, type PublicEnglishEssay } from "./types";

// What the English essay unit's page shows (spec 011 FR-001 to FR-005, contracts/api.md A): the live essays in offer order,
// each with the student's latest final mark and final band, whether it has the open attempt, and which one is "next up".
// Every query is scoped to the session user. A finished essay whose result row was never saved is repaired first, so it
// cannot leave an attempt open. No key field and no play text.

export interface EnglishEssayListItem {
  question: PublicEnglishEssay;
  /** `band` is the FINAL band, never the marker-selected one. */
  latest: { mark: number; band: number | null; attemptId: string; at: string } | null;
  /** This essay has the student's open attempt. */
  open: boolean;
  nextUp: boolean;
}

export interface EnglishEssayUnitData {
  essays: EnglishEssayListItem[];
  /** The open attempt, with the signed attempt token the discard route needs (the page signs it; the client never makes one). */
  openAttempt: { essayId: string; attemptId: string; stage: "scaffold" | "write"; attemptToken: string } | null;
  /** The missing-piece sentence for each concept, from the latest finished essay that listed it. */
  gapDetails: Record<string, string>;
}

export async function loadEnglishEssayUnitData(db: Db, userId: string, unit: Unit): Promise<EnglishEssayUnitData> {
  let open = await getLatestIncompleteAttempt(db, userId, ENGLISH_ESSAY_UNIT_ID);
  if (open) {
    await repairFinishedEnglishAttempts(userId, open);
    open = await getLatestIncompleteAttempt(db, userId, ENGLISH_ESSAY_UNIT_ID);
  }
  const latest = await latestEnglishEssayMarks(db, userId, ENGLISH_ESSAY_UNIT_ID);
  const details = await latestEnglishGapDetails(db, userId, ENGLISH_ESSAY_UNIT_ID);

  let openAttempt: EnglishEssayUnitData["openAttempt"] = null;
  if (open) {
    const essayId = open.questionIds[0]!;
    const row = await getEnglishEssayPhase(db, userId, open.id, essayId);
    openAttempt = {
      essayId,
      attemptId: open.id,
      stage: row && row.status !== "planning" ? "write" : "scaffold",
      attemptToken: signAttemptToken({ uid: userId, attemptId: open.id, unitId: open.unitId, questionIds: open.questionIds, mcOptionOrder: open.mcOptionOrder }),
    };
  }

  const live = unit.questions
    .flatMap((q) => (q.type === "englishEssay" && q.live ? [q] : []))
    .sort((a, b) => a.offer - b.offer);
  const essays: EnglishEssayListItem[] = [];
  let nextUp = true;
  for (const q of live) {
    const view = englishEssayPublicView(q.id);
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
