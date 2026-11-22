import { SectionHead } from "@/components/SectionHead";
import type { FormResult, KindResult } from "@/lib/db/queries/unseen-progress.server";
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

const KIND_LABEL: Record<KindResult["kind"], string> = { fixed: "Fixed pair", choice: "Choice of texts" };

/**
 * The comparative unit's results by question type (spec 009 FR-024a): one row for the fixed-pair questions and one for the
 * choice questions, each with answered of total and the average of the latest marks as a share of full marks, "Not tried
 * yet" where none. No breakdown by text form: every question mixes forms.
 */
export function ComparativeResults({ byKind }: { byKind: KindResult[] }) {
  if (byKind.length === 0) return null;
  return (
    <section className="unit-section" aria-labelledby="kinds-title">
      <SectionHead id="kinds-title" title="Results by question type" sub="A fixed pair names both texts; a choice question lets you pick." />
      <ul className="un-forms">
        {byKind.map((k) => (
          <li key={k.kind} className="un-form-row">
            <span className="un-form-name">{KIND_LABEL[k.kind]}</span>
            <span className="un-form-count">
              {k.answered} of {k.total} answered
            </span>
            <span className="un-form-avg">{k.average === null ? "Not tried yet" : `${Math.round(k.average * 100)}% average`}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
