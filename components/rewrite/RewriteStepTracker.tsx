/**
 * The step tracker (spec 006 FR-002, FR-037): an <ol aria-label="Steps"> with "Write",
 * "Retry with hints" and "Compare" (or the two-step "Write · 3/3" → "Compare" at a 3/3 first try,
 * or "Write" → "Mark it yourself" on the self-mark path). The current step is identified visually
 * and with aria-current="step"; a done step shows a check and the mark it earned (the retry mark
 * out of 2, its cap).
 */
export function RewriteStepTracker({
  phase1Marks,
  phase2Marks,
  selfMark,
}: {
  phase1Marks?: number;
  phase2Marks?: number;
  selfMark?: boolean;
}) {
  if (selfMark) {
    return (
      <ol className="rw-steps" aria-label="Steps">
        <li className={`rw-step ${phase1Marks !== undefined ? "done" : "current"}`}>
          <span className="rw-step-dot">{phase1Marks !== undefined ? <CheckIcon /> : "1"}</span>
          {phase1Marks !== undefined ? `Write · ${phase1Marks}/3` : "Write"}
        </li>
        <li aria-hidden="true" className="rw-step-rule" />
        <li className="rw-step current" aria-current="step">
          <span className="rw-step-dot">2</span>
          Mark it yourself
        </li>
      </ol>
    );
  }

  const writeDone = phase1Marks !== undefined;
  const retryDone = phase2Marks !== undefined;
  const skipRetry = writeDone && phase1Marks === 3;
  const writeLabel = writeDone ? `Write · ${phase1Marks}/3` : "Write";
  const retryLabel = retryDone ? `Retry · ${phase2Marks}/2` : "Retry with hints";

  return (
    <ol className="rw-steps" aria-label="Steps">
      <li className={`rw-step ${writeDone ? "done" : "current"}`} aria-current={writeDone ? undefined : "step"}>
        <span className="rw-step-dot">{writeDone ? <CheckIcon /> : "1"}</span>
        {writeLabel}
      </li>
      {!skipRetry && (
        <>
          <li aria-hidden="true" className="rw-step-rule" />
          <li
            className={`rw-step ${retryDone ? "done" : writeDone ? "current" : ""}`}
            aria-current={retryDone || !writeDone ? undefined : "step"}
          >
            <span className="rw-step-dot">{retryDone ? <CheckIcon /> : "2"}</span>
            {retryLabel}
          </li>
        </>
      )}
      <li aria-hidden="true" className="rw-step-rule" />
      <li
        className={`rw-step ${retryDone || skipRetry ? "current" : ""}`}
        aria-current={retryDone || skipRetry ? "step" : undefined}
      >
        <span className="rw-step-dot">3</span>
        Compare
      </li>
    </ol>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}