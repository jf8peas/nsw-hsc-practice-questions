import { CHECK_LABEL } from "@/lib/essay/review-labels";
import type { PlanReview } from "@/lib/essay/types";

// "Feedback on your plan" (spec 010 FR-013, FR-014): one line on each of seven checks, each a strength or a fix, and
// any figure to check. Collapsible, open by default, on the essay page only when the student chose a review. Each
// status carries a word and a mark as well as colour. It shows no mark and no band.

export function ReviewPanel({ review }: { review: PlanReview }) {
  return (
    <details className="es-collapse es-review" open>
      <summary>Feedback on your plan</summary>
      <ul className="es-checks">
        {review.checks.map((c) => (
          <li key={c.id} className={`es-check ${c.status}`}>
            <div className="es-check-head">
              <span className="es-check-name">{CHECK_LABEL[c.id]}</span>
              <span className={`es-check-status ${c.status}`}>
                <span aria-hidden="true">{c.status === "strength" ? "✓" : "?"}</span> {c.status === "strength" ? "Strength" : "Fix"}
              </span>
            </div>
            <p className="es-check-line">{c.line}</p>
          </li>
        ))}
      </ul>
      {review.figureFlags.length > 0 && (
        <div className="es-figure-flags">
          <h4>Check this figure</h4>
          <ul className="es-flags">
            {review.figureFlags.map((f, i) => (
              <li key={i}>
                <q>{f.quote}</q>
                <span>{f.why}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}
