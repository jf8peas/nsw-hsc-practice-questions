import { useEffect, useRef } from "react";

/**
 * The result summary (spec 006 FR-024, FR-025): the recorded mark panel (success-50, or
 * surface-50 with an ink-900 mark when the recorded mark is below 2) and the outcome pair chosen
 * by outcome. Takes focus when the result state appears (FR-025).
 */
export function OutcomeSummary({
  recordedMark,
  line1,
  line2,
}: {
  recordedMark: number;
  line1: string;
  line2: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      className={`rw-summary${recordedMark < 2 ? " plain" : ""}`}
      style={{ outline: "none" }}
    >
      <div className="rw-summary-score">
        <span className="rw-summary-mark">{recordedMark}</span>
        <span className="rw-summary-denom">/ 3 marks</span>
      </div>
      <div className="rw-summary-lines">
        <div className="rw-summary-line1">{line1}</div>
        <div className="rw-summary-line2">{line2}</div>
      </div>
    </div>
  );
}