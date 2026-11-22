import type { EssayPhaseRow } from "@/lib/db/schema";

import type { EssayResultView, PublicEssay } from "./types";

// The result view of a finished essay attempt (spec 010 FR-032, contracts/api.md F). The ONLY place that
// carries the band 1 model essay, and only when the caller passes it: callers pass it only for a finished
// row owned by the session user (lib/grading.server.ts essayModelEssay). A pure module: no I/O. It never
// carries the raw mark, the plan review, the marking notes, the school's criteria or the concept tags.

export function resultView(
  row: EssayPhaseRow,
  essay: PublicEssay,
  options: { modelEssay?: string | null; termOf: (conceptId: string) => string },
): EssayResultView | null {
  if (row.status !== "finished" || row.finalMark === null || row.band === null || !row.criteria || row.essayText === null) {
    return null;
  }
  const clamped = (() => {
    // the mark the band alone would give; the cap lowered the mark when the recorded one is below it
    const raw = row.rawMark ?? row.finalMark;
    const ranges: Record<number, [number, number]> = { 1: [17, 20], 2: [13, 16], 3: [9, 12], 4: [5, 8], 5: [1, 4] };
    const [lo, hi] = ranges[row.band] ?? [1, 20];
    return Math.min(Math.max(raw, lo), hi);
  })();
  return {
    questionId: row.questionId,
    essay,
    finalMark: row.finalMark,
    band: row.band as EssayResultView["band"],
    capped: row.finalMark < clamped,
    criteria: row.criteria,
    bandReason: row.bandReason ?? "",
    lift: (row.lift ?? []).slice(0, 2),
    flags: row.flags ?? [],
    gaps: (row.gaps ?? []).map((g) => ({ conceptId: g.conceptId, term: options.termOf(g.conceptId), detail: g.detail })),
    essayText: row.essayText,
    plan: row.scaffold,
    words: row.essayWords ?? 0,
    ...(options.modelEssay ? { modelEssay: options.modelEssay } : {}),
  };
}
