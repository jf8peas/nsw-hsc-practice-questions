"use client";

import type { Ref } from "react";

import type { UnseenQuestion } from "@/lib/types";
import { lengthNote, lengthState, limitsFor } from "@/lib/unseen/limits";
import type { NotMarked } from "@/lib/unseen/types";
import { countWords } from "@/lib/wordcount";

import { shortLabel } from "./Text";

// The writing surfaces of the unseen-text unit (spec 008): the question, the answer box with its
// meter and length rules, the locked block while marking, and the two plain notices for a try that
// could not be marked. The meter and the server count words with the same function.

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 2 20h20L12 3z" />
      <path d="M12 10v5" />
      <path d="M12 18h.01" />
    </svg>
  );
}

export function SpinnerIcon() {
  return (
    <svg className="rw-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

/** The question with its mark value and its source credit (FR-005). Parts on one text are shown together. */
export function QuestionBlock({ question }: { question: UnseenQuestion }) {
  return (
    <section className="un-q" aria-labelledby="un-q-title">
      <div className="un-q-meta">
        <span className="rd-pill blue">
          {question.maxMarks} {question.maxMarks === 1 ? "mark" : "marks"}
        </span>
        <span className="un-q-source">{question.source}</span>
      </div>
      <h3 id="un-q-title" className="un-q-title">
        Question
      </h3>
      <p className="un-q-text">{question.prompt}</p>
      {question.parts && question.parts.length > 0 && (
        <ol className="un-q-parts">
          {question.parts.map((p) => (
            <li key={p.label}>
              <span className="un-q-part-label">({p.label})</span> {p.text} <span className="un-q-part-marks">({p.marks})</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** The live word meter against the suggested length; the state is words and an icon as well as colour. */
export function WordMeter({ words, suggested }: { words: number; suggested: number }) {
  const state = lengthState(words, suggested);
  const { max } = limitsFor(suggested);
  const flagged = state === "warn" || state === "over";
  return (
    <div className="un-meter">
      <div className="rw-meter-bar" aria-hidden="true">
        <div className={`rw-meter-fill${flagged ? " over" : ""}`} style={{ width: `${Math.min(100, (words / suggested) * 100)}%` }} />
      </div>
      <span className={`rw-meter-count un-meter-count ${state}`}>
        {flagged && <WarnIcon />}
        {words} / {suggested} words
        {state === "over" ? ` · limit ${max}` : ""}
      </span>
    </div>
  );
}

export function AnswerBox({
  id,
  label,
  value,
  onChange,
  onBlur,
  onSubmit,
  onShowText,
  textHeading = "",
  suggestedWords,
  textareaRef,
  limitReached,
  extraNote,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (text: string) => void;
  onBlur: () => void;
  onSubmit: () => void;
  /** Opens the text sheet; the button reads "View " + the text's short label. */
  onShowText?: () => void;
  /** The text's full heading, e.g. "Text 1 – Image". */
  textHeading?: string;
  suggestedWords: number;
  textareaRef?: Ref<HTMLTextAreaElement>;
  /** The day's allowance is used up: Submit stays disabled until the next day (FR-031). */
  limitReached?: boolean;
  extraNote?: string;
}) {
  const words = countWords(value);
  const state = lengthState(words, suggestedWords);
  const note = limitReached ? "Submit is off until marking is available again tomorrow." : lengthNote(words, suggestedWords);
  const blocked = limitReached || state === "short" || state === "over";
  return (
    <div className="un-answer">
      <label className="un-label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        ref={textareaRef}
        className="rw-textarea un-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Write your answer here…"
        rows={10}
        aria-describedby={`${id}-note`}
      />
      <div className="answer-bar un-answer-bar">
        <WordMeter words={words} suggested={suggestedWords} />
        <div className="un-actions">
          {onShowText && (
            <button type="button" className="un-btn-secondary" onClick={onShowText} aria-label={`View ${textHeading}`}>
              View {shortLabel(textHeading)}
            </button>
          )}
          <button type="button" className="rw-btn" onClick={onSubmit} disabled={blocked}>
            Submit for marking
          </button>
        </div>
      </div>
      <p id={`${id}-note`} className={`un-note ${state}`}>
        {note ?? extraNote ?? "No timer: take as long as you need."}
      </p>
    </div>
  );
}

/** The submitted answer, read-only, with a lock icon and (while marking) an indeterminate bar. */
export function LockedAnswer({
  label,
  text,
  suggested,
  progress,
  reducedMotion,
}: {
  label: string;
  text: string;
  suggested: number;
  progress?: boolean;
  reducedMotion?: boolean;
}) {
  return (
    <div className="rw-locked">
      <div className="rw-locked-head">
        <span className="rw-locked-label">
          <LockIcon />
          {label}
        </span>
        <span className="rw-locked-count">
          {countWords(text)} / {suggested} words
        </span>
      </div>
      <p className="rw-locked-text un-locked-text">{text}</p>
      {progress && (
        <div className="rw-progress" aria-hidden="true">
          {reducedMotion ? <div className="rw-progress-static" /> : <div className="rw-progress-fill" />}
        </div>
      )}
    </div>
  );
}

export function MarkingFooter({ note }: { note: string }) {
  return (
    <div className="rw-marking-footer">
      <span className="rw-marking-note">{note}</span>
      <button type="button" className="rw-btn" disabled>
        <SpinnerIcon />
        Marking…
      </button>
    </div>
  );
}

const sydneyDay = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", weekday: "short", day: "numeric", month: "short" });

/** "Fri 20 Nov", whatever punctuation the browser's locale puts between the parts. */
function dayLabel(iso: string): string {
  const part = (type: string) => sydneyDay.formatToParts(new Date(iso)).find((p) => p.type === type)?.value ?? "";
  return `${part("weekday")} ${part("day")} ${part("month")}`;
}

/**
 * The two ways a try can come back unmarked (FR-030 to FR-032). Plain status messages, never an
 * error, and never an offer to mark it yourself.
 */
export function NotMarkedNotice({
  reason,
  resetsAt,
  noticeRef,
}: {
  reason: NotMarked["reason"];
  resetsAt?: string;
  noticeRef?: Ref<HTMLDivElement>;
}) {
  const day = resetsAt ? dayLabel(resetsAt) : "";
  return (
    <div ref={noticeRef} className="un-notice" role="status" tabIndex={-1}>
      {reason === "marker_unavailable" ? (
        <p>We couldn’t mark your answer just now. It’s still here, so try again in a moment.</p>
      ) : (
        <p>
          You’ve reached today’s marking limit. Come back tomorrow{day ? ` (from midnight Sydney time, ${day})` : ""} and your answer will be here.
        </p>
      )}
    </div>
  );
}
