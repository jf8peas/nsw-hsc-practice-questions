import type { EnglishEssayPhaseRow } from "@/lib/db/queries/english-essay-phases.server";

import { englishFinalMark } from "./scoring";
import type { EnglishEssayResultView, PublicEnglishEssay } from "./types";

// The result view of a finished English essay attempt (spec 011, data-model §10.2, contracts/api.md G). The ONLY place
// that carries the band 1 model essay, and only when the caller passes it: callers pass it only for a finished row owned
// by the session user (lib/grading.server.ts englishEssayModelEssay). A pure module: no I/O, and a type-only import of
// the row. It never carries the raw mark, the marker-selected band, the plan review, the marking notes, the Away notes,
// the key concept tags, the used-well ids or any successful quote result. Only near and not-found quotations become
// `quoteFlags`, and only a near match carries the play's exact words.

/** Only near and not-found quotations are shown; ok and other-source stay in storage for audit. */
function quoteFlagsOf(results: NonNullable<EnglishEssayPhaseRow["quoteResults"]>): EnglishEssayResultView["quoteFlags"] {
  const flags: EnglishEssayResultView["quoteFlags"] = [];
  for (const q of results) {
    if (q.status === "near") {
      flags.push({ quote: q.quote, status: "near", ...(q.correct ? { correct: q.correct } : {}), ...(q.ratio !== undefined ? { ratio: q.ratio } : {}) });
    } else if (q.status === "not-found") {
      flags.push({ quote: q.quote, status: "not-found", ...(q.ratio !== undefined ? { ratio: q.ratio } : {}) });
    }
  }
  return flags;
}

export function englishResultView(
  row: EnglishEssayPhaseRow,
  essay: PublicEnglishEssay,
  options: { modelEssay?: string | null; termOf: (conceptId: string) => string },
): EnglishEssayResultView | null {
  if (
    row.status !== "finished" ||
    row.finalMark === null ||
    row.finalBand === null ||
    row.band === null ||
    !row.criteria ||
    row.essayText === null ||
    row.questionFocus === null ||
    !row.knowledgeErrors ||
    !row.quoteResults
  ) {
    return null;
  }
  const errors = row.knowledgeErrors;
  // the same function the marking used, from the stored inputs, so the display and the mark cannot disagree
  const marked = englishFinalMark({ rawMark: row.rawMark ?? row.finalMark, band: row.band, errorCount: errors.length, focus: row.questionFocus });
  return {
    questionId: row.questionId,
    essay,
    finalMark: row.finalMark,
    finalBand: row.finalBand,
    capped: row.finalMark < marked.clampedMark,
    knowledgeCapApplied: marked.knowledgeCapApplied,
    focusCap: marked.focusCap,
    criteria: row.criteria,
    bandReason: row.bandReason ?? "",
    lift: (row.lift ?? []).slice(0, 2),
    questionFocus: row.questionFocus,
    questionFocusReason: row.questionFocusReason ?? "",
    knowledgeErrors: errors.map((e) => ({ quote: e.quote, why: e.why })),
    quoteFlags: quoteFlagsOf(row.quoteResults),
    gaps: (row.gaps ?? []).slice(0, 5).map((g) => ({ conceptId: g.conceptId, term: options.termOf(g.conceptId), detail: g.detail })),
    essayText: row.essayText,
    plan: row.scaffold,
    words: row.essayWords ?? 0,
    ...(options.modelEssay ? { modelEssay: options.modelEssay } : {}),
  };
}

/** What an unfinished attempt's detail page may show: the public question, the student's own plan and draft. */
export function englishUnfinishedView(
  essay: PublicEnglishEssay,
  row: Pick<EnglishEssayPhaseRow, "scaffold">,
  draft: string | null,
): { essay: PublicEnglishEssay; plan: EnglishEssayPhaseRow["scaffold"]; draft: string | null } {
  return { essay, plan: row.scaffold, draft };
}
