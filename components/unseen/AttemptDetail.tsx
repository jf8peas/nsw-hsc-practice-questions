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

export function UnseenAttemptDetailView({
  detail,
  maxMarks,
  headingOf,
}: {
  detail: UnseenAttemptDetail;
  maxMarks: number;
  /** spec 009: a text's heading as on the paper, to name the pick and the pairing. */
  headingOf?: (textId: string) => string;
}) {
  const name = (id: string) => headingOf?.(id) ?? id;
  return (
    <>
      {detail.pick && detail.pick.length > 0 && <p className="detail-feedback">You wrote about: {detail.pick.map(name).join(" and ")}.</p>}
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
          {detail.pairing && detail.pairing.length > 0 && (
            <p className="un-pairing-note">
              This model answer shows one possible pairing ({detail.pairing.map(name).join(" and ")}). Any allowed pairing can earn full marks.
            </p>
          )}
          <div className="detail-answer">{detail.modelAnswer}</div>
        </div>
      )}
    </>
  );
}
