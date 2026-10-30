"use client";

/**
 * Read-only read-back of a transcribed photo answer (specs/004-photo-answers).
 *
 * Shows what the vision model read, with maths rendered as formulas (the HTML
 * is pre-rendered server-side), crossed-out work marked as crossed out, and any
 * drawn diagram described in words. The student can only accept it ("Looks
 * right, mark it") or retake — it can never be edited (FR-009).
 */

export function ReadBackPanel({
  transcriptionHtml,
  note,
  onAccept,
  onRetake,
  busy,
}: {
  transcriptionHtml: string;
  note?: string;
  onAccept: () => void;
  onRetake: () => void;
  busy: boolean;
}) {
  return (
    <div className="readback-panel">
      <div className="label">What we read from your photos</div>
      <div
        className="readback-text"
        role="region"
        aria-label="Transcribed answer"
        // The HTML is produced server-side from the vision model's transcription
        // (KaTeX-rendered); it is never user-authored.
        dangerouslySetInnerHTML={{ __html: transcriptionHtml }}
      />

      {note && (
        <div className="readback-note" style={{ marginTop: 8, fontStyle: "italic" }}>
          <span className="label">Your note</span>
          <div>{note}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          className="rd-btn"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={onAccept}
          disabled={busy}
          data-testid="accept-readback"
        >
          {busy ? "Marking…" : "Looks right, mark it"}
        </button>
        <button
          type="button"
          className="rd-btn"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={onRetake}
          disabled={busy}
          data-testid="retake-readback"
        >
          Retake
        </button>
      </div>
    </div>
  );
}