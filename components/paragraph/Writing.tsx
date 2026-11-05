import { useEffect, useRef, type Ref } from "react";

import { PARTS, partKeyOf } from "@/lib/paragraph/parts";
import type { ParagraphDiscussion } from "@/lib/paragraph/types";
import type { PartNo } from "@/lib/types";
import { countWords } from "@/lib/wordcount";

// The writing surfaces (spec 007): the write box, the locked block while marking, the correction
// box and the self-mark screen. The word meter and the marker count words with the same function.

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 5 L19 12 L5 19" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
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

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** Live word meter. Over the limit shows the over state; submission is never blocked (FR-009). */
export function WordMeter({ text, limit }: { text: string; limit: number }) {
  const words = countWords(text);
  const over = words > limit;
  return (
    <div className="rw-meter">
      <div className="rw-meter-bar" aria-hidden="true">
        <div className={`rw-meter-fill${over ? " over" : ""}`} style={{ width: `${Math.min(100, (words / limit) * 100)}%` }} />
      </div>
      <span className={`rw-meter-count${over ? " over" : ""}`}>
        {words} / {limit} words{over ? " · over the limit — you lose the conventions mark" : ""}
      </span>
    </div>
  );
}

export function WriteBox({
  partName,
  limit,
  value,
  onChange,
  onBlur,
  onSubmit,
  busy,
}: {
  partName: string;
  limit: number;
  value: string;
  onChange: (text: string) => void;
  onBlur: () => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  return (
    <div>
      <div className="pg-section-head">
        <label className="pg-h3" htmlFor="pg-write">
          Write the {partName}
        </label>
        <span className="pg-help">Every figure you need is in the brief</span>
      </div>
      <textarea
        id="pg-write"
        className="rw-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Write your part here…"
        rows={6}
      />
      <div className="answer-bar">
        <WordMeter text={value} limit={limit} />
        <button type="button" className="rw-btn" onClick={onSubmit} disabled={busy || !value.trim()}>
          {busy ? "Marking…" : "Submit for marking"}
          <ArrowIcon />
        </button>
      </div>
      <p className="pg-info">
        <InfoIcon />
        Lose a mark? You’ll get one correction with tips, worth up to 3 marks.
      </p>
    </div>
  );
}

/** The submitted text, read-only, with a lock icon and (while marking) an indeterminate bar. */
export function LockedPart({
  label,
  text,
  limit,
  progress,
  reducedMotion,
}: {
  label: string;
  text: string;
  limit: number;
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
          {countWords(text)} / {limit} words
        </span>
      </div>
      <p className="rw-locked-text">{text}</p>
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

/**
 * The correction box (FR-014, FR-022): pre-filled with the first try, focused with the cursor at
 * the end when it appears. On a touch-only device (no fine pointer) the box is not focused so the
 * on-screen keyboard does not cover the tip cards (spec 006 research R9).
 */
export function CorrectionBox({
  value,
  onChange,
  onBlur,
  onSubmit,
  busy,
  limit,
}: {
  value: string;
  onChange: (text: string) => void;
  onBlur: () => void;
  onSubmit: () => void;
  busy: boolean;
  limit: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const touchOnly = typeof window !== "undefined" && !!window.matchMedia && !window.matchMedia("(pointer: fine)").matches;
    if (touchOnly) return;
    const el = ref.current;
    if (el) {
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, []);
  return (
    <div>
      <div className="pg-section-head">
        <label className="pg-h3" htmlFor="pg-correction">
          Your correction
        </label>
        <span className="pg-help">Starts from your first try — edit it</span>
      </div>
      <textarea
        id="pg-correction"
        ref={ref}
        className="rw-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Write your part here…"
        rows={6}
      />
      <div className="answer-bar">
        <WordMeter text={value} limit={limit} />
        <span className="rw-retry-note">
          <InfoIcon />
          Correction is worth up to 3 marks
        </span>
        <button type="button" className="rw-btn" onClick={onSubmit} disabled={busy || !value.trim()}>
          {busy ? "Marking…" : "Submit correction"}
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}

export type Ticks = Record<"a" | "b" | "c" | "d", boolean>;

/** The degrade path (FR-033): the locked text, the model part and one tick per criterion. */
export function SelfMarkScreen({
  partNo,
  text,
  limit,
  guidance,
  discussion,
  ticks,
  onTick,
  onSave,
  busy,
  firstTickRef,
}: {
  partNo: PartNo;
  text: string;
  limit: number;
  guidance: string[];
  discussion: ParagraphDiscussion;
  ticks: Ticks;
  onTick: (key: keyof Ticks, checked: boolean) => void;
  onSave: () => void;
  busy: boolean;
  firstTickRef?: Ref<HTMLInputElement>;
}) {
  const info = PARTS[partKeyOf(partNo)];
  return (
    <div className="pg-selfmark">
      <LockedPart label={`Your ${info.name}`} text={text} limit={limit} />
      <section className="pg-section" aria-labelledby="pg-self-model">
        <div className="pg-section-head">
          <h3 id="pg-self-model" className="pg-h3">Model {info.name}</h3>
        </div>
        <div className="pg-model">
          <div className="pg-model-part current">
            <div className="pg-label">MODEL {info.name.toUpperCase()}</div>
            <p>{discussion.modelPart}</p>
          </div>
        </div>
      </section>
      <fieldset className="pg-ticks">
        <legend className="pg-h3">Mark it yourself</legend>
        <p className="pg-help">Tick each criterion your text meets. Compare it with the model part above.</p>
        {(["a", "b", "c", "d"] as const).map((k, i) => (
          <label key={k} className="pg-tick">
            <input
              ref={i === 0 ? firstTickRef : undefined}
              type="checkbox"
              checked={ticks[k]}
              onChange={(e) => onTick(k, e.target.checked)}
            />
            <span>
              <strong>({k}) {info.criteria[k].short}</strong>
              <span className="pg-tick-line">{guidance[i]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="rw-marking-footer">
        <span className="rw-marking-note">Your mark is the number of ticks, out of 4.</span>
        <button type="button" className="rw-btn" onClick={onSave} disabled={busy}>
          {busy ? "Saving…" : "Save my mark"}
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}
