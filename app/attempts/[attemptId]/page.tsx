import Link from "next/link";
import { notFound } from "next/navigation";

import { Formula } from "@/components/Formula";
import { ParagraphAttemptDetailView } from "@/components/paragraph/AttemptDetail";
import { TextPanel } from "@/components/unseen/Text";
import { UnseenAttemptDetailView } from "@/components/unseen/AttemptDetail";
import { paperLabel } from "@/lib/unseen/source";
import { HistoryUnavailable } from "@/components/HistoryUnavailable";
import { Shell } from "@/components/Shell";
import { getQuestion, getUnit } from "@/content";
import { requirePageUser } from "@/lib/auth.server";
import { loadAttemptDetail } from "@/lib/db/queries/history.server";
import { formatWhen } from "@/lib/format";
import { PARTS, partKeyOf } from "@/lib/paragraph/parts";
import { getOptionExplanation, essayPublicView, englishEssayPublicView } from "@/lib/grading.server";
import { EssayAttemptDetail } from "@/components/essay/AttemptDetail";
import { dbCall } from "@/lib/db/index.server";
import { getEssayPhase } from "@/lib/db/queries/essay-phases.server";
import { getRewriteDraft } from "@/lib/db/queries/rewrite-drafts.server";
import { finishedResult } from "@/lib/essay/results.server";
import { ESSAY_UNIT_ID } from "@/lib/essay/types";
import { EnglishEssayAttemptDetail } from "@/components/english-essay/AttemptDetail";
import { getEnglishEssayPhase } from "@/lib/db/queries/english-essay-phases.server";
import { englishFinishedResult } from "@/lib/english-essay/results.server";
import { ENGLISH_ESSAY_UNIT_ID } from "@/lib/english-essay/types";

/**
 * One attempt in full: each question, the student's answer, the marks and the
 * feedback they were shown. Reads public content only, and the answer key only through
 * `getOptionExplanation` (why a wrong multiple-choice option is wrong),
 * never model answers or rubrics. Someone else's attempt id renders
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

  // the English essay unit (spec 011): the student's own result (with the band 1 model essay) once finished; only the public
  // question, the plan and the draft before that. Read through the session user's id, so another student's attempt is not found.
  if (attempt.unitId === ENGLISH_ESSAY_UNIT_ID) {
    const essayId = items[0]?.questionId ?? "";
    const essay = englishEssayPublicView(essayId);
    const row = essay ? await dbCall((db) => getEnglishEssayPhase(db, user.id, attemptId, essayId)).catch(() => null) : null;
    if (!essay || !row) notFound();
    const draft = row.status === "finished" ? "" : ((await dbCall((db) => getRewriteDraft(db, user.id, attemptId, essayId)).catch(() => null))?.phase1Draft ?? "");
    return (
      <Shell backHref={unit ? `/unit/${unit.id}` : "/progress"}>
        <h1 className="page-h1" style={{ fontSize: 24, margin: "4px 0 6px" }}>
          {unit?.title ?? attempt.unitId}
        </h1>
        <p className="page-sub" style={{ marginBottom: 16 }}>
          {formatWhen(attempt.startedAt)}
        </p>
        <EnglishEssayAttemptDetail essay={essay} result={englishFinishedResult(row)} plan={row.scaffold} draft={draft} backHref={`/unit/${ENGLISH_ESSAY_UNIT_ID}`} />
      </Shell>
    );
  }

  // the essay unit (spec 010): the student's own result (with the band 1 model essay) once finished; only the plan
  // and the draft before that. Read through the session user's id, so another student's attempt is not found.
  if (attempt.unitId === ESSAY_UNIT_ID) {
    const essayId = items[0]?.questionId ?? "";
    const essay = essayPublicView(essayId);
    const row = essay ? await dbCall((db) => getEssayPhase(db, user.id, attemptId, essayId)).catch(() => null) : null;
    if (!essay || !row) notFound();
    const draft = row.status === "finished" ? "" : ((await dbCall((db) => getRewriteDraft(db, user.id, attemptId, essayId)).catch(() => null))?.phase1Draft ?? "");
    return (
      <Shell backHref={unit ? `/unit/${unit.id}` : "/progress"}>
        <h1 className="page-h1" style={{ fontSize: 24, margin: "4px 0 6px" }}>
          {unit?.title ?? attempt.unitId}
        </h1>
        <p className="page-sub" style={{ marginBottom: 16 }}>
          {formatWhen(attempt.startedAt)}
        </p>
        <EssayAttemptDetail essay={essay} result={finishedResult(row)} plan={row.scaffold} draft={draft} backHref={`/unit/${ESSAY_UNIT_ID}`} />
      </Shell>
    );
  }

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

            {q?.type === "paragraph" && (
              <div className="pg-label">
                Essay {q.essayNo} · {PARTS[partKeyOf(q.part)].name}
              </div>
            )}
            {q?.type === "unseen" && (
              <>
                <div className="pg-label">{paperLabel(q.paper)}</div>
                {found?.unit.texts?.find((t) => t.id === q.textId) && (
                  <details className="un-collapse">
                    <summary>The text</summary>
                    <TextPanel text={found.unit.texts.find((t) => t.id === q.textId)!} openHref={`/unit/${found.unit.id}/text/${q.textId}?attempt=${attemptId}`} />
                  </details>
                )}
              </>
            )}
            {q?.type === "comparative" && (
              <>
                <div className="pg-label">{paperLabel(q.paper)} · Compare</div>
                {q.textIds.map((id) => {
                  const text = found?.unit.texts?.find((t) => t.id === id);
                  return text ? (
                    <details className="un-collapse" key={id}>
                      <summary>{text.heading}</summary>
                      <TextPanel text={text} openHref={`/unit/${found!.unit.id}/text/${id}?attempt=${attemptId}`} />
                    </details>
                  ) : null;
                })}
              </>
            )}
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

            {!item.answered && item.unseen && (q?.type === "unseen" || q?.type === "comparative") && (
              <UnseenAttemptDetailView detail={item.unseen} maxMarks={q.maxMarks} headingOf={(id) => found?.unit.texts?.find((t) => t.id === id)?.heading ?? id} />
            )}
            {item.answered ? (
              <>
                {!item.paragraph && !item.unseen && <div className="detail-answer">{item.answer}</div>}
                <div className="detail-marks">
                  {item.marks} / {item.max} marks
                  {item.gradedBy === "self" && " · self-marked"}
                  {item.gradedBy === "llm" && " · AI-marked"}
                </div>
                {q?.type === "rewrite" && item.phase1Answer && (
                  <>
                    <div className="detail-answer">Phase 1: {item.phase1Answer}</div>
                    {item.phase2Answer && <div className="detail-answer">Phase 2: {item.phase2Answer}</div>}
                    <div className="detail-marks">
                      Phase 1: {item.phase1Marks}/3
                      {item.phase2Marks != null ? ` · Phase 2: ${item.phase2Marks}/2` : ""} · recorded {item.marks}/3
                    </div>
                  </>
                )}
                {item.paragraph && q?.type === "paragraph" && (
                  <ParagraphAttemptDetailView detail={item.paragraph} partNo={q.part} />
                )}
                {item.unseen && (q?.type === "unseen" || q?.type === "comparative") && (
                  <UnseenAttemptDetailView detail={item.unseen} maxMarks={q.maxMarks} headingOf={(id) => found?.unit.texts?.find((t) => t.id === id)?.heading ?? id} />
                )}
                {!item.paragraph && !item.unseen && item.feedback && <p className="detail-feedback">{item.feedback}</p>}
                {(() => {
                  // shown as the key reads now: nothing is stored per result (spec 002 FR-041)
                  const why =
                    q?.type === "mc" && item.marks === 0 && item.gradedBy === "auto" && item.answer
                      ? getOptionExplanation(item.questionId, item.answer)
                      : undefined;
                  return why ? (
                    <div className="explanation">
                      <div className="label">Why this is wrong</div>
                      {why}
                    </div>
                  ) : null;
                })()}
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
