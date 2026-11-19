"use client";

import type { Ref } from "react";

import { PILL_LABEL, pillFor, retryCap, summaryLines, type Pill } from "@/lib/unseen/scoring";
import { SKILL_IDS, skillById, type SkillId } from "@/lib/unseen/skills";
import type { SkillView, TryView, UnseenDiscussion, UnseenEnding } from "@/lib/unseen/types";

// The result, retry and discussion surfaces of the unseen-text unit (spec 008 FR-018 to FR-021).
// Verdicts and pills are words with an icon, never colour alone. Tip cards are built from the public
// skills file and the ids of the skills missed on the first try; they never hold model-answer text.

function Icon({ kind }: { kind: "met" | "missed" | "fixed" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === "met" || kind === "fixed" ? <path d="M5 12l5 5 9-10" /> : <path d="M6 6l12 12M18 6L6 18" />}
    </svg>
  );
}

export function SkillList({ skills }: { skills: SkillView[] }) {
  return (
    <ul className="un-skills" aria-label="Skill results">
      {skills.map((s) => (
        <li key={s.id} className={`un-skill ${s.met ? "met" : "missed"}`}>
          <span className="un-skill-verdict">
            <Icon kind={s.met ? "met" : "missed"} />
            {s.met ? "Met" : "Missed"}
          </span>
          <span className="un-skill-body">
            <span className="un-skill-name">{skillById(s.id).name}</span>
            {s.reason && <span className="un-skill-reason">{s.reason}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** "To go further": one step beyond the top band for a full-mark first try. Same look as "Biggest gap"; never changes the mark. */
export function GoFurther({ text }: { text: string }) {
  return (
    <div className="un-gap un-go-further">
      <span className="un-gap-label">To go further</span>
      <p>{text}</p>
    </div>
  );
}

/** A marked try: the mark out of the question's value, the feedback, the biggest gap and the seven verdicts. */
export function ResultCard({
  label,
  result,
  maxMarks,
  summaryRef,
}: {
  label: string;
  result: Pick<TryView, "mark" | "feedback" | "biggestGap" | "skills"> & { goFurther?: string | null };
  maxMarks: number;
  summaryRef?: Ref<HTMLDivElement>;
}) {
  return (
    <section className="un-result" aria-labelledby="un-result-title">
      <div ref={summaryRef} className="un-result-top" tabIndex={-1}>
        <p className="un-result-label">{label}</p>
        <h3 id="un-result-title" className="un-result-mark">
          {result.mark} / {maxMarks} marks
        </h3>
        <p className="un-result-feedback">{result.feedback}</p>
      </div>
      {result.mark >= maxMarks && result.goFurther ? <GoFurther text={result.goFurther} /> : (
        <div className="un-gap">
          <span className="un-gap-label">Biggest gap</span>
          <p>{result.biggestGap}</p>
        </div>
      )}
      <SkillList skills={result.skills} />
    </section>
  );
}

export function RetryChoice({
  maxMarks,
  onRetry,
  onDecline,
  busy,
}: {
  maxMarks: number;
  onRetry: () => void;
  onDecline: () => void;
  busy: boolean;
}) {
  return (
    <div className="un-choice">
      <p className="un-choice-text">
        You can try once more. Your retry starts from your first answer, with a tip for each skill you missed, and earns at most {retryCap(maxMarks)} out of {maxMarks}.
      </p>
      <div className="un-choice-actions">
        <button type="button" className="rw-btn" onClick={onRetry} disabled={busy}>
          Try again
        </button>
        <DeclineButton onDecline={onDecline} busy={busy} />
      </div>
    </div>
  );
}

export function DeclineButton({ onDecline, busy }: { onDecline: () => void; busy: boolean }) {
  return (
    <button type="button" className="un-btn-secondary" onClick={onDecline} disabled={busy}>
      Skip the retry and see the model answer
    </button>
  );
}

/** One card per skill missed on the first try: its name and its tip. No model text, ever. */
export function TipCards({ missed }: { missed: SkillId[] }) {
  if (missed.length === 0) return null;
  return (
    <section className="un-tips" aria-labelledby="un-tips-title">
      <h3 id="un-tips-title" className="un-h3">
        Fix these in your retry
      </h3>
      <div className="un-tip-grid">
        {missed.map((id) => (
          <div key={id} className="un-tip">
            <p className="un-tip-name">{skillById(id).name}</p>
            <p className="un-tip-text">{skillById(id).tip}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const PILL_ICON: Record<Pill, "met" | "fixed" | "missed"> = { "first-try": "met", "fixed-in-retry": "fixed", missed: "missed" };

export function SkillPills({ try1, try2 }: { try1: TryView; try2: TryView | null }) {
  const v1 = Object.fromEntries(try1.skills.map((s) => [s.id, { met: s.met, reason: s.reason }])) as never;
  const v2 = try2 ? (Object.fromEntries(try2.skills.map((s) => [s.id, { met: s.met, reason: s.reason }])) as never) : null;
  return (
    <ul className="un-pills" aria-label="Skills, first try and retry">
      {SKILL_IDS.map((id) => {
        const pill = pillFor(id, v1, v2);
        return (
          <li key={id} className="un-pill-row">
            <span className={`un-pill ${pill}`}>
              <Icon kind={PILL_ICON[pill]} />
              {PILL_LABEL[pill]}
            </span>
            <span className="un-pill-name">{skillById(id).name}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** "Added to Things I need to know": the skills missed on the FIRST try, each with its tip (FR-026). */
export function SkillsAdded({ try1 }: { try1: TryView }) {
  const missed = try1.skills.filter((s) => !s.met).map((s) => s.id);
  if (missed.length === 0) return null;
  return (
    <section className="un-added" aria-labelledby="un-added-title">
      <h3 id="un-added-title" className="un-h3">
        Added to Things I need to know
      </h3>
      <ul className="un-added-list">
        {missed.map((id) => (
          <li key={id}>
            <span className="un-added-name">{skillById(id).name}</span>
            <span className="un-added-tip">{skillById(id).tip}</span>
            <span className="un-added-count">2 to go</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FinalVsModel({ answer, answerWords, discussion }: { answer: string; answerWords: number; discussion: UnseenDiscussion }) {
  return (
    <div className="rw-compare un-compare">
      <div className="rw-compare-card">
        <p className="rw-compare-label">Your answer · {answerWords} words</p>
        <p className="rw-compare-text un-compare-text">{answer}</p>
      </div>
      <div className="rw-compare-card model">
        <p className="rw-compare-label">Model answer · {discussion.modelWords} words</p>
        <p className="rw-compare-text un-compare-text">{discussion.modelAnswer}</p>
      </div>
    </div>
  );
}

export function FirstTryCollapsed({ try1, maxMarks }: { try1: TryView; maxMarks: number }) {
  return (
    <details className="un-collapse">
      <summary>
        Your first try · {try1.wordCount} words · {try1.mark} / {maxMarks}
      </summary>
      <p className="un-collapse-text">{try1.text}</p>
    </details>
  );
}

/** The discussion (FR-021): the recorded mark and its summary lines, the pills, the answers side by side. */
export function Discussion({
  maxMarks,
  try1,
  try2,
  ending,
  recorded,
  discussion,
  onFinish,
  summaryRef,
}: {
  maxMarks: number;
  try1: TryView;
  try2: TryView | null;
  ending: UnseenEnding;
  recorded: number;
  discussion: UnseenDiscussion;
  onFinish: () => void;
  summaryRef?: Ref<HTMLDivElement>;
}) {
  const lines = summaryLines({ ending, try1Mark: try1.mark, try2Mark: try2?.mark ?? null, maxMarks });
  const retryDecides = try2 !== null && try2.mark >= try1.mark;
  const final = retryDecides ? try2! : try1;
  const deciding = retryDecides ? try2! : try1;
  return (
    <div className="un-discussion">
      <div ref={summaryRef} className={`rw-summary un-summary${recorded >= maxMarks ? "" : " plain"}`} tabIndex={-1}>
        <h3 className="rw-summary-mark un-summary-mark">
          {recorded} / {maxMarks} marks
        </h3>
        <div>
          {lines.map((l) => (
            <p key={l} className="rw-summary-line1">
              {l}
            </p>
          ))}
          <p className="rw-summary-line2">{deciding.feedback}</p>
        </div>
      </div>
      {deciding.mark >= maxMarks && deciding.goFurther && <GoFurther text={deciding.goFurther} />}
      <SkillPills try1={try1} try2={try2} />
      <FinalVsModel answer={final.text} answerWords={final.wordCount} discussion={discussion} />
      <SkillsAdded try1={try1} />
      {try2 && <FirstTryCollapsed try1={try1} maxMarks={maxMarks} />}
      <div className="un-discussion-foot">
        <button type="button" className="rw-btn" onClick={onFinish}>
          Finish
        </button>
      </div>
    </div>
  );
}
