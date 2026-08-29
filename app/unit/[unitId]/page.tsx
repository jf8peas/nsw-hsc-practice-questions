import Link from "next/link";
import { notFound } from "next/navigation";

import { Shell } from "@/components/Shell";
import { UnitStatsPanel } from "@/components/UnitStatsPanel";
import { UNITS, getUnit } from "@/content";
import { daysUntil, examsForUnit } from "@/content/exams";

export function generateStaticParams() {
  return UNITS.map((u) => ({ unitId: u.id }));
}

export default async function UnitPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const unit = getUnit(unitId);
  if (!unit) notFound();

  const exams = examsForUnit(unit.id);

  return (
    <Shell backHref="/">
      <span className="rd-pill blue" style={{ marginBottom: 12 }}>
        {unit.type}
      </span>
      <h1 className="page-h1" style={{ fontSize: 24, margin: "8px 0 6px" }}>
        {unit.title}
      </h1>
      <p className="page-sub" style={{ marginBottom: 20 }}>
        {unit.description}
      </p>

      {exams.map((exam) => {
        const d = daysUntil(exam.date);
        return (
          <div className="rd-card exam-card" key={exam.id}>
            <span className="when">
              {d === 0 ? "Today" : d === 1 ? "1 day" : `${d} days`}
            </span>
            <span>
              <span className="exam-title">{exam.title}</span>
              <br />
              <span className="exam-date">{exam.date}</span>
            </span>
          </div>
        );
      })}

      <UnitStatsPanel unitId={unit.id} />

      <Link
        href={`/unit/${unit.id}/quiz`}
        className="rd-btn primary xl"
        style={{ width: "100%", justifyContent: "center", fontWeight: 600 }}
      >
        Start quiz
      </Link>

      {unit.formulas && unit.formulas.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <div className="eyebrow">Formulas in this test</div>
          <ul className="formula-list">
            {unit.formulas.map((f) => (
              <li key={f.formula}>
                <span className="formula-list-formula">{f.formula}</span>
                <span className="formula-list-name">{f.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}
