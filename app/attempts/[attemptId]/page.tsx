import Link from "next/link";
import { notFound } from "next/navigation";

import { Formula } from "@/components/Formula";
import { HistoryUnavailable } from "@/components/HistoryUnavailable";
import { Shell } from "@/components/Shell";
import { getQuestion, getUnit } from "@/content";
import { requirePageUser } from "@/lib/auth.server";
import { loadAttemptDetail } from "@/lib/db/queries/history.server";
import { formatWhen } from "@/lib/format";

/**
 * One attempt in full: each question, the student's answer, the marks and the
 * feedback they were shown. Reads public content only (never content/answers),
 * and never shows model answers or rubrics. Someone else's attempt id renders
 * not-found, identical to an unknown id.
 */
export default async function AttemptDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { user, degraded } = await requirePageUser();
  const { attemptId } = await params;

  const loaded = degraded
    ? ({ status: "unavailable" } as const)
    : await loadAttemptDetail(user.id, attemptId);

  if (loaded.status === "unavailable") {
    return (
      <Shell backHref="/progress">
        <h1 className="page-h1" style={{ fontSize: 24, margin: "4px 0 16px" }}>
          Attempt
        </h1>
        <HistoryUnavailable />
      </Shell>
    );
  }
  if (!loaded.data) notFound();

  const { attempt, items } = loaded.data;
  const unit = getUnit(attempt.unitId);

  return (
    <Shell backHref={unit ? `/unit/${unit.id}` : "/progress"}>
      <h1 className="page-h1" style={{ fontSize: 24, margin: "4px 0 6px" }}>
        {unit?.title ?? attempt.unitId}
      </h1>
      <p className="page-sub" style={{ marginBottom: 16 }}>
        {formatWhen(attempt.startedAt)} · {attempt.marks}/{attempt.max} marks · {attempt.percent}%{" "}
        {attempt.completedAt === null && <span className="rd-pill warn">incomplete</span>}
      </p>

      {items.map((item, idx) => {
        const found = getQuestion(item.questionId);
        const q = found?.question;
        return (
          <div className="rd-card detail-item" key={item.questionId}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Question {idx + 1}
              {item.retired && (
                <>
                  {" "}
                  <span className="rd-pill">retired</span>
                </>
              )}
            </div>

            <div className="detail-q">
              {q ? (
                q.formula ? (
                  <Formula tex={q.formulaTex}>{q.formula}</Formula>
                ) : (
                  q.prompt
                )
              ) : (
                <span style={{ color: "var(--rd-mute-600)" }}>
                  This question has been removed from the unit ({item.questionId}).
                </span>
              )}
            </div>

            {item.answered ? (
              <>
                <div className="detail-answer">{item.answer}</div>
                <div className="detail-marks">
                  {item.marks} / {item.max} marks
                  {item.gradedBy === "self" && " · self-marked"}
                  {item.gradedBy === "llm" && " · AI-marked"}
                </div>
                {item.feedback && <p className="detail-feedback">{item.feedback}</p>}
                {item.hits && item.hits.length > 0 && (
                  <ul>
                    {item.hits.map((h, i) => (
                      <li key={`h${i}`} className="hit">
                        ✓ {h}
                      </li>
                    ))}
                  </ul>
                )}
                {item.misses && item.misses.length > 0 && (
                  <ul>
                    {item.misses.map((m, i) => (
                      <li key={`m${i}`} className="miss">
                        ✕ {m}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="detail-feedback">Not answered.</div>
            )}
          </div>
        );
      })}

      <div className="row-actions">
        {unit && (
          <Link href={`/unit/${unit.id}`} className="rd-btn">
            Back to unit
          </Link>
        )}
        <Link href="/progress" className="rd-btn">
          My progress
        </Link>
      </div>
    </Shell>
  );
}
