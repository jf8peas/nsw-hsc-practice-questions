import type { RewriteCreditedSpan } from "@/lib/grading";

import { findSpanOffsets, HighlightedText } from "./highlight";

/**
 * The first-try result (spec 006 FR-013, FR-014): the mono "FIRST TRY" label, the mark out of 3,
 * the grader's feedback, and "Your first try" with each credited term highlighted. Missed terms
 * are not marked in the sentence; a span not found in the sentence is not highlighted (FR-032).
 */
export function FirstTryResult({
  marks,
  feedback,
  sentence,
  spans,
}: {
  marks: number;
  feedback: string;
  sentence: string;
  spans: RewriteCreditedSpan[];
}) {
  const ranges = spans.flatMap((s) => findSpanOffsets(sentence, s.span));
  return (
    <div className="rw-first-try">
      <div className="rw-first-try-head">
        <div className="rw-first-try-score">
          <span className="rw-first-try-label">First try</span>
          <div className="rw-first-try-mark">
            <span className="rw-first-try-num">{marks}</span>
            <span className="rw-first-try-denom">/ 3</span>
          </div>
        </div>
        <p className="rw-first-try-feedback">{feedback}</p>
      </div>
      <div className="rw-first-try-sentence">
        <span className="rw-first-try-sub">Your first try</span>
        <p className="rw-first-try-text">
          <HighlightedText text={sentence} ranges={ranges} className="rw-credit" />
        </p>
      </div>
    </div>
  );
}