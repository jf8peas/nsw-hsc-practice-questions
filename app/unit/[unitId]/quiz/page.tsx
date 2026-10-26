import { notFound, redirect } from "next/navigation";

import { Quiz } from "@/components/Quiz";
import { Shell } from "@/components/Shell";
import { getUnit } from "@/content";
import { requirePageUser } from "@/lib/auth.server";
import { DEFAULT_PASS_MARK, toPublicQuestions } from "@/lib/attempts/draw.server";
import { finalizeIfComplete } from "@/lib/attempts/complete.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { getAttemptForUser } from "@/lib/db/queries/attempts.server";
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
