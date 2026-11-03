/**
 * The cosmetic, timed marking status list (spec 006 FR-008, FR-009, FR-020): three steps in a
 * `role="status"` `aria-live="polite"` container. The visible rows are the design's list; a
 * visually hidden span carries the announced label, which the panel changes only when a step
 * state changes, so each change is announced once (research R8). The steps are cosmetic and
 * timed — a single marking request sits behind them.
 */
export interface MarkingStep {
  label: string;
  state: "done" | "active" | "pending";
}

export function MarkingStatus({ steps, announced }: { steps: MarkingStep[]; announced: string }) {
  return (
    <div className="rw-status" role="status" aria-live="polite">
      <span className="rw-sr-only">{announced}</span>
      {steps.map((s, i) => (
        <div key={i} className={`rw-status-row ${s.state}`}>
          {s.state === "done" ? (
            <CheckIcon />
          ) : s.state === "active" ? (
            <SpinnerIcon />
          ) : (
            <CircleIcon />
          )}
          {s.label}
        </div>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--rd-success-500)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5 5.5-6" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="rw-spinner"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--rd-blue-500)"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--rd-mute-400)"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}