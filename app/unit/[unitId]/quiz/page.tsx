import { notFound, redirect } from "next/navigation";

import { Quiz } from "@/components/Quiz";
import { Shell } from "@/components/Shell";
import { getUnit } from "@/content";
import { requirePageUser } from "@/lib/auth.server";
import { DEFAULT_PASS_MARK, toPublicQuestions } from "@/lib/attempts/draw.server";
import { finalizeIfComplete } from "@/lib/attempts/complete.server";
import { rewriteResumeState } from "@/lib/grading.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { getAttemptForUser } from "@/lib/db/queries/attempts.server";
import { listRewriteDrafts } from "@/lib/db/queries/rewrite-drafts.server";
import { listRewritePhases } from "@/lib/db/queries/rewrite-phases.server";
import { getAnsweredMarks } from "@/lib/db/queries/results.server";
import type { AttemptPayload } from "@/lib/drafts";
import { signAttemptToken } from "@/lib/tokens.server";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ unitId: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { user } = await requirePageUser();
  const { unitId } = await params;
  const { attempt: attemptId } = await searchParams;
  const unit = getUnit(unitId);
  if (!unit) notFound();
  if (!attemptId) redirect(`/unit/${unit.id}`);

  // Load the student's own attempt. If the database is unavailable the quiz still
  // runs: the client reads the attempt it saved in sessionStorage when it started
  // (research R19). Never a 500.
  let payload: AttemptPayload | null = null;
  let found = true;
  try {
    const row = await dbCall((db) => getAttemptForUser(db, user.id, attemptId));
    if (!row || row.unitId !== unit.id) {
      found = false;
    } else {
      const answered = await dbCall((db) => getAnsweredMarks(db, user.id, row.id));
      await dbCall((db) => finalizeIfComplete(db, row));
      // spec 005 + spec 006: rebuild the rewrite state (hint/discussion per FR-023, the display
      // data and the per-phase drafts per FR-053/FR-054) for resume. The phase rows and the draft
      // rows are each read once for the whole attempt (not per question). The answer key is read
      // only inside lib/grading.server.ts (no-key-leak rule).
      const rewriteState: AttemptPayload["rewriteState"] = {};
      const phases = await dbCall((db) => listRewritePhases(db, user.id, row.id));
      const drafts = await dbCall((db) => listRewriteDrafts(db, user.id, row.id));
      const phaseByQ = new Map(phases.map((p) => [p.questionId, p]));
      const draftByQ = new Map(drafts.map((d) => [d.questionId, d]));
      for (const qid of row.questionIds) {
        const ph = phaseByQ.get(qid);
        const dr = draftByQ.get(qid);
        if (ph) {
          rewriteState[qid] = rewriteResumeState(qid, {
            status: ph.status as "phase1" | "phase2" | "final",
            phase1Answer: ph.phase1Answer,
            phase1Marks: ph.phase1Marks,
            phase1Feedback: ph.phase1Feedback,
            phase1TermOutcomes: ph.phase1TermOutcomes ?? null,
            phase2Answer: ph.phase2Answer,
            phase2Marks: ph.phase2Marks,
            phase2Feedback: ph.phase2Feedback,
            recordedMark: ph.recordedMark,
            displayData: ph.displayData ?? null,
            drafts: dr ? { phase1Draft: dr.phase1Draft, phase2Draft: dr.phase2Draft } : null,
          });
        } else if (dr && dr.phase1Draft) {
          // no phase row yet (phase 1 not graded): restore only the phase-1 draft so the writing
          // box is not empty on another device (FR-038, FR-053). No key fields (stage discipline).
          rewriteState[qid] = { phase: "draft", phase1Draft: dr.phase1Draft };
        }
      }
      payload = {
        attemptToken: signAttemptToken({
          uid: user.id,
          attemptId: row.id,
          unitId: row.unitId,
          questionIds: row.questionIds,
          mcOptionOrder: row.mcOptionOrder,
        }),
        unitId: row.unitId,
        passMark: unit.quiz?.passMark ?? DEFAULT_PASS_MARK,
        // retired questions are dropped; MC options are in the stored display order
        questions: toPublicQuestions(row.questionIds, row.mcOptionOrder),
        answered,
        rewriteState,
      };
    }
  } catch (error) {
    if (!(error instanceof DbUnavailableError)) throw error;
    payload = null; // offline mode
  }
  if (!found) notFound();

  return (
    <Shell backHref={`/unit/${unit.id}`}>
      <Quiz uid={user.id} attemptId={attemptId} unitId={unit.id} initial={payload} />
    </Shell>
  );
}
