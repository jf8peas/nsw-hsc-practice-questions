import { useEffect, useRef } from "react";

/**
 * The result summary (spec 006 FR-024, FR-025): the recorded mark panel (success-50, or
 * surface-50 with an ink-900 mark when the recorded mark is below 2) and the outcome pair chosen
 * by outcome. When a retry was done the banner shows the first-try → final transition and the
 * gain, e.g. "1/3 → 2/3 (+1 for the retry)". Takes focus when the result state appears (FR-025).
 */
export function OutcomeSummary({
  firstTry,
  final,
  retryDone,
  maxMarks,
  line1,
  line2,
}: {
  firstTry: number;
  final: number;
  retryDone: boolean;
  maxMarks: number;
  line1: string;
  line2: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const gain = final - firstTry;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      className={`rw-summary${final < 2 ? " plain" : ""}`}
      style={{ outline: "none" }}
    >
      <div className="rw-summary-score">
        {retryDone ? (
          <span className="rw-summary-transition">
            <span className="rw-summary-mark">{firstTry}</span>/{maxMarks} →{" "}
            <span className="rw-summary-mark">{final}</span>/{maxMarks}
            <span className="rw-summary-gain">{gain > 0 ? ` (+${gain} for the retry)` : " (no gain)"}</span>
          </span>
        ) : (
          <>
            <span className="rw-summary-mark">{final}</span>
            <span className="rw-summary-denom">/ {maxMarks} marks</span>
          </>
        )}
      </div>
      <div className="rw-summary-lines">
        <div className="rw-summary-line1">{line1}</div>
        <div className="rw-summary-line2">{line2}</div>
      </div>
    </div>
  );
}