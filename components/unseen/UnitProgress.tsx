import { SectionHead } from "@/components/SectionHead";
import type { FormResult } from "@/lib/db/queries/unseen-progress.server";
import { formLabel } from "@/lib/unseen/source";

// Results by text form on the unit page (spec 008 FR-028, research R13): one row per form in the bank
// with how many questions the student has answered and their average mark as a share of full marks.
// A form with no answer yet reads "Not tried yet" (the draw offers those first).

export function UnitProgress({ byForm }: { byForm: FormResult[] }) {
  if (byForm.length === 0) return null;
  return (
    <section className="unit-section" aria-labelledby="forms-title">
      <SectionHead id="forms-title" title="Results by text form" sub="Weaker forms and forms you have not tried come up more often." />
      <ul className="un-forms">
        {byForm.map((f) => (
          <li key={f.form} className="un-form-row">
            <span className="un-form-name">{formLabel(f.form)}</span>
            <span className="un-form-count">
              {f.answered} of {f.total} answered
            </span>
            <span className="un-form-avg">{f.average === null ? "Not tried yet" : `${Math.round(f.average * 100)}% average`}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
