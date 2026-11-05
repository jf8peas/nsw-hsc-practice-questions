import type { ParagraphAttemptDetail, ParagraphAttemptPhase } from "@/lib/db/queries/history.server";
import { PARTS, partKeyOf } from "@/lib/paragraph/parts";
import type { PartNo } from "@/lib/types";

// One paragraph part on the attempt detail page (spec 007 FR-036): each try's text, mark,
// per-criterion verdict with the marker's reason, and the feedback shown. Stored data only; no
// model text, no brief and no marking notes, so a later part's model can never appear here.

function Phase({ title, partNo, phase }: { title: string; partNo: PartNo; phase: ParagraphAttemptPhase }) {
  const info = PARTS[partKeyOf(partNo)];
  return (
    <div className="pg-attempt-phase">
      <div className="pg-label">{title}</div>
      <div className="detail-answer">{phase.text}</div>
      <ul className="pg-criteria" aria-label={`${title} results by criterion`}>
        {phase.criteria.map((c) => (
          <li key={c.key}>
            <span role="img" aria-label={c.met ? "Met" : "Not met"}>
              {c.met ? "✓" : "✕"}
            </span>
            <div>
              <strong>
                ({c.key}) {info.criteria[c.key].short}
              </strong>
              {c.reason && <div className="pg-reason">{c.reason}</div>}
            </div>
          </li>
        ))}
      </ul>
      {phase.feedback && <p className="detail-feedback">{phase.feedback}</p>}
    </div>
  );
}

export function ParagraphAttemptDetailView({ detail, partNo }: { detail: ParagraphAttemptDetail; partNo: PartNo }) {
  return (
    <>
      <Phase title={detail.selfMarked ? `Your text · self-marked ${detail.phase1.mark}/4` : `First try · ${detail.phase1.mark}/4`} partNo={partNo} phase={detail.phase1} />
      {detail.phase2 && <Phase title={`Correction · ${detail.phase2.mark}/3`} partNo={partNo} phase={detail.phase2} />}
      {detail.ending === "no_correction" && (
        <p className="detail-feedback">The correction could not be marked, so the first-try mark stands.</p>
      )}
      {detail.recordedMark !== null && (
        <div className="detail-marks">
          Recorded {detail.recordedMark}/4{detail.flagged ? " · flagged for your teacher" : ""}
        </div>
      )}
    </>
  );
}
