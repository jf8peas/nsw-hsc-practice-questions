import type { UnseenAttemptDetail, UnseenAttemptTry } from "@/lib/db/queries/history.server";

import { GoFurther, SkillList } from "./Results";

// One unseen-text question on the attempt detail page (spec 008, research R13): each try's text, mark,
// seven verdicts with the marker's reasons, the feedback and the biggest gap, and the model answer
// ONLY once the question is final (the student has already seen it at the discussion). Never the
// criteria, the marking notes or a visual's description.

function Try({ title, t, maxMarks }: { title: string; t: UnseenAttemptTry; maxMarks: number }) {
  return (
    <div className="un-attempt-try">
      <div className="un-result-label">{title}</div>
      <div className="detail-answer">{t.text}</div>
      <SkillList skills={t.skills} />
      {t.mark >= maxMarks && t.goFurther && <GoFurther text={t.goFurther} />}
      {t.feedback && <p className="detail-feedback">{t.feedback}</p>}
      {!(t.mark >= maxMarks && t.goFurther) && t.biggestGap && <p className="detail-feedback">Biggest gap: {t.biggestGap}</p>}
    </div>
  );
}

export function UnseenAttemptDetailView({ detail, maxMarks }: { detail: UnseenAttemptDetail; maxMarks: number }) {
  return (
    <>
      <Try title={`First try · ${detail.try1.mark}/${maxMarks}`} t={detail.try1} maxMarks={maxMarks} />
      {detail.try2 && <Try title={`Retry · ${detail.try2.mark}/${maxMarks - 1}`} t={detail.try2} maxMarks={maxMarks} />}
      {detail.ending === "declined" && <p className="detail-feedback">You skipped the retry, so your first try is recorded.</p>}
      {detail.recordedMark !== null && (
        <div className="detail-marks">
          Recorded {detail.recordedMark}/{maxMarks}
        </div>
      )}
      {detail.modelAnswer && (
        <div className="un-attempt-model">
          <div className="un-result-label">Model answer</div>
          <div className="detail-answer">{detail.modelAnswer}</div>
        </div>
      )}
    </>
  );
}
