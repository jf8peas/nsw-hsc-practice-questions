import type { RewriteHint } from "@/lib/grading";

/**
 * The hint (spec 006 FR-015, FR-016): "Use these terms in your retry" with one card per
 * missed/misused term (term + one-line definition only), or "What to fix" with a single card
 * naming the lost criterion. Built purely from `hint.terms` / `hint.criterionText`, which contain
 * no plain-English mapping by construction — there is no "replaces …" line and nothing from the
 * plain-English sentence.
 */
export function HintCards({ hint }: { hint: RewriteHint }) {
  if (hint.terms.length > 0) {
    return (
      <div>
        <h2 className="rw-hint-heading">Use these terms in your retry</h2>
        <div className="rw-hint-grid">
          {hint.terms.map((t) => (
            <div key={t.term} className="rw-hint-card">
              <span className="rw-hint-term">{t.term}</span>
              <p className="rw-hint-def">{t.definition}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <h2 className="rw-hint-heading">What to fix</h2>
      <div className="rw-hint-grid">
        <div className="rw-hint-card">
          <p className="rw-hint-def">{hint.criterionText}</p>
        </div>
      </div>
    </div>
  );
}