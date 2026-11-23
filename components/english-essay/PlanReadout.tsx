import type { EnglishEssayScaffold } from "@/lib/english-essay/types";

// The locked plan as read-only text (spec 011 FR-018): thesis, then each claim with its evidence note, with empty optional
// fields left out. Reused on the essay and result screens. It never carries review or key material.

const NUMBER_WORD = ["First", "Second", "Third"] as const;

export function PlanText({ plan }: { plan: EnglishEssayScaffold }) {
  const claims = plan.body.map((b, i) => ({ ...b, label: NUMBER_WORD[i]! })).filter((b) => b.claim.trim() !== "" || b.evidence.trim() !== "");
  if (plan.thesis.trim() === "" && claims.length === 0) return <p className="es-plan-empty">No plan was written.</p>;
  return (
    <div className="es-plan">
      {plan.thesis.trim() !== "" && (
        <section className="es-plan-section">
          <h4>Thesis</h4>
          <p>{plan.thesis}</p>
        </section>
      )}
      {claims.map((c) => (
        <section key={c.label} className="es-plan-section">
          <h4>{c.label} claim</h4>
          <dl>
            {c.claim.trim() !== "" && (
              <div className="es-plan-row">
                <dt>Claim</dt>
                <dd>{c.claim}</dd>
              </div>
            )}
            {c.evidence.trim() !== "" && (
              <div className="es-plan-row">
                <dt>Evidence notes</dt>
                <dd>{c.evidence}</dd>
              </div>
            )}
          </dl>
        </section>
      ))}
    </div>
  );
}

/** "Your plan": collapsible, open by default. */
export function PlanReadout({ plan }: { plan: EnglishEssayScaffold }) {
  return (
    <details className="es-collapse" open>
      <summary>Your plan</summary>
      <PlanText plan={plan} />
    </details>
  );
}
