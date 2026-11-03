/**
 * The locked read-only sentence block (spec 006 FR-007, FR-018): a heading label ("Your
 * sentence" / "Your retry") with a lock icon, a static word count on the right, the sentence at
 * 18 px in a white box with a blue-100 border, and an optional indeterminate progress bar along
 * the bottom edge while marking.
 */
export function LockedSentence({
  label,
  sentence,
  wordCount,
  progress,
  reducedMotion,
}: {
  label: string;
  sentence: string;
  wordCount: number;
  /** Show the indeterminate progress bar along the bottom edge (marking states). */
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
          {wordCount} / 25 words
        </span>
      </div>
      <p className="rw-locked-text">{sentence}</p>
      {progress && (
        <div className="rw-progress" aria-hidden="true">
          {reducedMotion ? <div className="rw-progress-static" /> : <div className="rw-progress-fill" />}
        </div>
      )}
    </div>
  );
}

function LockIcon() {
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
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}