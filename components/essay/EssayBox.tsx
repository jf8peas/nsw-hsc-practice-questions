"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent } from "react";

import { saveRewriteDraft, sendRewriteDraftBeacon } from "@/lib/drafts";
import { essayCounter } from "@/lib/essay/counter";
import { countWords } from "@/lib/wordcount";

// The essay box (spec 010 FR-019 to FR-023): a live counter against 600 to 800 words, a Submit button that is
// enabled only inside that range, pasting and dropping text switched off (as in the exam), and an autosaved
// draft. The counter and the server count words with the same function (lib/wordcount.ts).

const DRAFT_DEBOUNCE_MS = 3000;
const ANNOUNCE_MS = 2000;
const PASTE_NOTE_MS = 4000;

/** `beforeinput` types that put text in from outside the keyboard. Autocorrect (`insertReplacementText`) is allowed. */
const BLOCKED_INPUT = new Set(["insertFromPaste", "insertFromPasteAsQuotation", "insertFromDrop", "insertFromYank"]);

export function EssayBox({
  attemptId,
  attemptToken,
  questionId,
  value,
  onChange,
  onSubmit,
  locked,
  limitReached,
}: {
  attemptId: string;
  attemptToken: string;
  questionId: string;
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  /** Marking is running: the box is read-only. */
  locked: boolean;
  /** The day's marking allowance is used up: Submit stays off until tomorrow. */
  limitReached: boolean;
}) {
  const words = countWords(value);
  const counter = essayCounter(words);
  const [announced, setAnnounced] = useState(counter.text);
  const [pasteNote, setPasteNote] = useState(false);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  // the polite live region follows the counter at most every two seconds
  useEffect(() => {
    const t = setTimeout(() => setAnnounced(counter.text), ANNOUNCE_MS);
    return () => clearTimeout(t);
  }, [counter.text]);

  // draft: this tab at once, the server after a pause, on blur and when the page is hidden
  useEffect(() => {
    saveRewriteDraft(attemptId, questionId, 1, value);
    const t = setTimeout(() => sendRewriteDraftBeacon(attemptId, questionId, 1, value, attemptToken), DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [attemptId, attemptToken, questionId, value]);
  useEffect(() => {
    const flush = () => sendRewriteDraftBeacon(attemptId, questionId, 1, valueRef.current, attemptToken);
    const hidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [attemptId, attemptToken, questionId]);
  useEffect(() => () => void (noteTimer.current && clearTimeout(noteTimer.current)), []);

  function blocked() {
    setPasteNote(true);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setPasteNote(false), PASTE_NOTE_MS);
  }
  const stopPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    blocked();
  };
  const stopDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (e.type === "drop") blocked();
  };
  // React's onBeforeInput is not the browser's `beforeinput`, so the paste and drop input types (a phone's paste
  // button, a long-press, a drag) are caught with a native listener
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onBefore = (e: Event) => {
      if (BLOCKED_INPUT.has((e as InputEvent).inputType)) {
        e.preventDefault();
        blocked();
      }
    };
    el.addEventListener("beforeinput", onBefore);
    return () => el.removeEventListener("beforeinput", onBefore);
  }, []);

  const disabled = !counter.canSubmit || locked || limitReached;

  return (
    <div className="es-write">
      <label className="un-label" htmlFor="es-essay">
        Your essay
      </label>
      <textarea
        id="es-essay"
        ref={box}
        className="rw-textarea es-essay"
        rows={16}
        value={value}
        readOnly={locked}
        aria-busy={locked || undefined}
        aria-describedby="es-essay-counter es-essay-note"
        autoComplete="off"
        placeholder="Write your essay here…"
        onChange={(e) => onChange(e.target.value)}
        onPaste={stopPaste}
        onDrop={stopDrop}
        onDragOver={stopDrop}
        onBlur={() => sendRewriteDraftBeacon(attemptId, questionId, 1, value, attemptToken)}
      />
      <div className="es-bar es-bar-inline">
        <div className="es-bar-info">
          <span id="es-essay-counter" className={`es-counter ${counter.state}`}>
            {counter.text}
          </span>
        </div>
        <span className="rw-sr-only" role="status" aria-live="polite">
          {announced}
        </span>
        <div className="es-actions">
          <button type="button" className="rw-btn" onClick={onSubmit} disabled={disabled}>
            Submit essay
          </button>
        </div>
      </div>
      <p id="es-essay-note" className="un-note" role="status">
        {limitReached
          ? "Submit is off until marking is available again tomorrow."
          : pasteNote
            ? "Pasting is switched off, as in the exam. Type your answer."
            : locked
              ? "Marking your essay…"
              : "Pasting is switched off, as in the exam. Your plan stays above."}
      </p>
    </div>
  );
}
