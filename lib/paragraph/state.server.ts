import "server-only";

import { paragraphDiscussion, paragraphQuestionView } from "@/lib/grading.server";
import type { Db } from "@/lib/db/index.server";
import { getRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import { getParagraphPhase } from "@/lib/db/queries/paragraph-phases.server";
import type { Attempt, ParagraphPhaseRow, ParagraphVerdicts, RewriteDraftRow } from "@/lib/db/schema";
import type { EssayProgress } from "@/lib/attempts/sequence.server";
import type {
  CriterionView,
  EssayBar,
  ParagraphPhaseView,
  ParagraphState,
} from "@/lib/paragraph/types";
import { countWords } from "@/lib/wordcount";

// Builds what the quiz may show for a paragraph attempt (spec 007, data-model.md §4.2), for the
// attempt-start response and the resume page. The stage decides what is released (Principle I):
// `view` (brief, earlier models) at every stage; the verdicts once phase 1 is marked; the
// `discussion` (current model, labels for later parts) only for a FINAL row. There is no marking
// stage: marking is never restored.

export function criteriaOf(v: ParagraphVerdicts): CriterionView[] {
  return (["a", "b", "c", "d"] as const).map((key) => ({
    key,
    met: v[key].met,
    reason: v[key].reason,
    ...(v[key].subs ? { subs: v[key].subs } : {}),
  }));
}

export function phaseView(text: string, mark: number, verdicts: ParagraphVerdicts, feedback: string | null): ParagraphPhaseView {
  return { text, mark, criteria: criteriaOf(verdicts), feedback: feedback ?? "", wordCount: countWords(text) };
}

/** Pure: the state for one question from its phase row and draft row (either may be absent). */
export function paragraphStateFrom(
  questionId: string,
  row: ParagraphPhaseRow | null,
  draft: Pick<RewriteDraftRow, "phase1Draft" | "phase2Draft"> | null,
): ParagraphState | null {
  const view = paragraphQuestionView(questionId);
  if (!view) return null;
  if (!row) {
    return { stage: "write", view, ...(draft?.phase1Draft ? { draft1: draft.phase1Draft } : {}) };
  }
  const phase1 = phaseView(row.phase1Text, row.phase1Mark, row.phase1Verdicts, row.phase1Feedback);
  if (row.status === "phase1") {
    return { stage: "correct", view, phase1, ...(draft?.phase2Draft ? { draft2: draft.phase2Draft } : {}) };
  }
  const discussion = paragraphDiscussion(questionId);
  return {
    stage: "discussion",
    view,
    phase1,
    ...(row.phase2Text && row.phase2Verdicts && row.phase2Mark !== null
      ? { phase2: phaseView(row.phase2Text, row.phase2Mark, row.phase2Verdicts, row.phase2Feedback) }
      : {}),
    ending: row.ending as ParagraphState["ending"],
    recordedMark: row.recordedMark ?? row.phase1Mark,
    flagged: row.flaggedAt !== null,
    mode: row.mode as "marker" | "self_mark",
    ...(discussion ? { discussion } : {}),
  };
}

/** Reads the rows (scoped to the session user) and builds the state for an attempt's one question. */
export async function loadParagraphState(db: Db, userId: string, attempt: Attempt): Promise<ParagraphState | null> {
  const questionId = attempt.questionIds[0];
  if (!questionId) return null;
  const [row, draft] = await Promise.all([
    getParagraphPhase(db, userId, attempt.id, questionId),
    getRewriteDraft(db, userId, attempt.id, questionId),
  ]);
  return paragraphStateFrom(questionId, row, draft);
}

/** The essay bar for the unit page and the quiz header, from the derived progress. */
export function essayBarFrom(p: Extract<EssayProgress, { finished: false }>): EssayBar {
  return { essayNo: p.essayNo, essayTotal: p.essayTotal, question: p.question, economy: p.economy, parts: p.parts };
}
