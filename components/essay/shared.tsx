import { EssayQuestionBlock } from "@/components/paragraph/Frame";
import { SCAFFOLD_FIELDS, SCAFFOLD_SECTION_TITLES, getField, type EssayScaffold, type ScaffoldField } from "@/lib/essay/scaffold";
import type { PublicEssay } from "@/lib/essay/types";

// Pieces the essay unit's screens share (spec 010): the question with its verb highlighted and defined, the
// source credit, the economy the student writes about, and the read-only plan.

export const ECONOMY_LINE: Record<PublicEssay["economy"], string> = {
  china: "You write about China, an emerging economy.",
  nepal: "You write about Nepal, a developing economy.",
  both: "You write about both economies: China (emerging) and Nepal (developing).",
};

export function EssayHeader({ essay }: { essay: PublicEssay }) {
  return (
    <div className="es-header">
      <EssayQuestionBlock question={essay.prompt} verb={essay.verb} definition={essay.verbDefinition || undefined} />
      {essay.source && <p className="es-source">Source: {essay.source}</p>}
      <p className="es-economy">{ECONOMY_LINE[essay.economy]}</p>
    </div>
  );
}

/** The plan as read-only text, section by section; empty fields are left out. */
export function PlanText({ plan }: { plan: EssayScaffold }) {
  const sections = (Object.keys(SCAFFOLD_SECTION_TITLES) as ScaffoldField["section"][]).map((section) => ({
    section,
    fields: SCAFFOLD_FIELDS.filter((f) => f.section === section && getField(plan, f).trim() !== ""),
  }));
  const any = sections.some((s) => s.fields.length > 0);
  if (!any) return <p className="es-plan-empty">No plan was written.</p>;
  return (
    <div className="es-plan">
      {sections
        .filter((s) => s.fields.length > 0)
        .map((s) => (
          <section key={s.section} className="es-plan-section">
            <h4>{SCAFFOLD_SECTION_TITLES[s.section]}</h4>
            <dl>
              {s.fields.map((f) => (
                <div key={f.key} className="es-plan-row">
                  <dt>{f.label}</dt>
                  <dd>{getField(plan, f)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
    </div>
  );
}

/** "Your plan": collapsible, open by default (FR-018). */
export function PlanReadout({ plan }: { plan: EssayScaffold }) {
  return (
    <details className="es-collapse" open>
      <summary>Your plan</summary>
      <PlanText plan={plan} />
    </details>
  );
}
