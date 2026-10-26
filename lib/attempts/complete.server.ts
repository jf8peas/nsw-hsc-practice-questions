import "server-only";

import { getQuestion } from "@/content";
import type { Db } from "@/lib/db/index.server";
import { markAttemptCompleted } from "@/lib/db/queries/attempts.server";
import { getAnsweredMarks } from "@/lib/db/queries/results.server";

/**
 * Decide, on the server, whether an attempt is complete: every drawn question
 * that still exists in content has a result. A drawn question that has since
 * been retired is skipped; an attempt whose questions were all retired
 * completes with nothing to answer. The client can never complete an attempt.
 */
export async function finalizeIfComplete(
  db: Db,
  attempt: { id: string; userId: string; questionIds: string[]; completedAt: Date | null },
): Promise<{ completed: boolean }> {
  if (attempt.completedAt) return { completed: true };

  const remaining = attempt.questionIds.filter((id) => getQuestion(id) !== undefined);
  if (remaining.length > 0) {
    const answered = await getAnsweredMarks(db, attempt.userId, attempt.id);
    if (!remaining.every((id) => id in answered)) return { completed: false };
  }
  await markAttemptCompleted(db, attempt.userId, attempt.id);
  return { completed: true };
}
