/**
 * The term table (spec 006 FR-028, FR-037): "The three terms" / "The two terms" / "The term"
 * matching the question's term count, one row per target term with the term, its status pill
 * ("First try" / "Added in retry" / "Not used"), the key's "why" text and the definition. This
 * table is the ONLY term listing — the old hint list and "Why these terms fit" are gone. The
 * `selfMark` variant renders without status pills and with a checkbox per row (used by the
 * self-mark screen, FR-037).
 */
export type TermStatus = "first-try" | "added" | "not-used";

export interface TermRow {
  term: string;
  definition: string;
  why: string;
  status: TermStatus;
}

export function TermTable({
  terms,
  selfMark,
  ticks,
  onTick,
}: {
  terms: TermRow[];
  selfMark?: boolean;
  ticks?: Record<string, boolean>;
  onTick?: (term: string, checked: boolean) => void;
}) {
  const heading =
    terms.length === 1 ? "The term" : terms.length === 2 ? "The two terms" : "The three terms";
  return (
    <div>
      <h2 className="rw-hint-heading">{heading}</h2>
      <div className="rw-term-table">
        {terms.map((t) => (
          <div key={t.term} className="rw-term-row">
            <div className="rw-term-left">
              <div className="rw-term-name">
                {t.term}
                {selfMark ? (
                  <label className="rw-check">
                    <input
                      type="checkbox"
                      checked={ticks?.[t.term] ?? false}
                      onChange={(e) => onTick?.(t.term, e.target.checked)}
                    />
                    <span className="rw-sr-only">Used {t.term} correctly</span>
                  </label>
                ) : (
                  <span className={`rw-pill ${t.status}`}>
                    {t.status === "first-try" ? "First try" : t.status === "added" ? "Added in retry" : "Not used"}
                  </span>
                )}
              </div>
              <div className="rw-term-why">{t.why}</div>
            </div>
            <div className="rw-term-def">{t.definition}</div>
          </div>
        ))}
      </div>
    </div>
  );
}