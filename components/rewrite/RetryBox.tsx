import { useEffect, useRef } from "react";

import { countWords } from "@/lib/wordcount";

const WORD_LIMIT = 25;

/**
 * The retry box (spec 006 FR-017): "Your retry" with "Starts from your first try — edit it", a
 * textarea pre-filled with the first-try sentence, the live word meter, the notice "Retry is
 * worth up to 2 marks" and the primary "Submit retry" button. On devices with a fine pointer the
 * box is focused with the cursor at the end when it appears; on touch devices it is not, so the
 * on-screen keyboard never pops up over the hint (research R9).
 */
export function RetryBox({
  value,
  onChange,
  onBlur,
  onSubmit,
  busy,
}: {
  value: string;
  onChange: (text: string) => void;
  onBlur: () => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const words = countWords(value);
  const over = words > WORD_LIMIT;

  useEffect(() => {
    // focus + cursor at the end only on fine-pointer devices (FR-017, research R9)
    if (typeof window !== "undefined" && window.matchMedia?.("(pointer: fine)").matches) {
      const el = ref.current;
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
  }, []);

  return (
    <div>
      <div className="rw-retry-head">
        <label className="rw-retry-label" htmlFor="rw-retry">
          Your retry
        </label>
        <span className="rw-retry-help">Starts from your first try — edit it</span>
      </div>
      <textarea
        id="rw-retry"
        ref={ref}
        className="rw-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Write your sentence here…"
        rows={3}
      />
      <div className="answer-bar">
        <div className="rw-meter">
          <div className="rw-meter-bar" aria-hidden="true">
            <div className={`rw-meter-fill${over ? " over" : ""}`} style={{ width: `${Math.min(100, (words / WORD_LIMIT) * 100)}%` }} />
          </div>
          <span className={`rw-meter-count${over ? " over" : ""}`}>
            {words} / {WORD_LIMIT} words{over ? " · over the limit — you lose the conciseness mark" : ""}
          </span>
        </div>
        <span className="rw-retry-note">
          <InfoIcon />
          Retry is worth up to 2 marks
        </span>
        <button
          type="button"
          className="rw-btn"
          onClick={onSubmit}
          disabled={busy || !value.trim()}
        >
          {busy ? "Marking…" : "Submit retry"}
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 5 L19 12 L5 19" />
    </svg>
  );
}