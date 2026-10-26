import Link from "next/link";
import { notFound } from "next/navigation";

import { AttemptHistory } from "@/components/AttemptHistory";
import { Formula } from "@/components/Formula";
import { HistoryUnavailable } from "@/components/HistoryUnavailable";
import { Shell } from "@/components/Shell";
import { StartQuiz } from "@/components/StartQuiz";
import { getUnit, unitIsNew } from "@/content";
import { daysUntil, examsForUnit } from "@/content/exams";
import { requirePageUser } from "@/lib/auth.server";
import { loadUnitHistory } from "@/lib/db/queries/history.server";

export default async function UnitPage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { user, degraded } = await requirePageUser();
  const { unitId } = await params;
  const unit = getUnit(unitId);
  if (!unit) notFound();

  // The database being down must never break the page: the history section
  // shows a notice, and "Start quiz" still works (research R19).
  const history = degraded
    ? ({ status: "unavailable" } as const)
    : await loadUnitHistory(user.id, unit.id);
  const resume = history.status === "ok" ? history.data.resume : null;

  const exams = examsForUnit(unit.id);

  return (
    <Shell backHref="/">
      <div className="unit-badges" style={{ marginBottom: 12 }}>
        {unitIsNew(unit) && <span className="rd-pill new-pill">NEW</span>}
        <span className="rd-pill blue">{unit.type}</span>
        <span className="rd-pill date-pill">{unit.created}</span>
      </div>
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

      {/* Start / continue come first, above the history and the reference material (mobile-first). */}
      <div className="start-actions">
        {resume ? (
          <>
            <Link
              href={`/unit/${unit.id}/quiz?attempt=${resume.attemptId}`}
              className="rd-btn primary xl"
              style={{ width: "100%", justifyContent: "center", fontWeight: 600 }}
            >
              Continue attempt ({resume.answered} of {resume.total} answered)
            </Link>
            <StartQuiz unitId={unit.id} label="Start new attempt" primary={false} />
          </>
        ) : (
          <StartQuiz unitId={unit.id} />
        )}
      </div>

      {history.status === "ok" ? <AttemptHistory history={history.data} /> : <HistoryUnavailable />}

      {unit.formulas && unit.formulas.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <div className="eyebrow">Formulas in this test</div>
          <ul className="formula-list">
            {unit.formulas.map((f) => (
              <li key={f.formula}>
                <span className="formula-list-formula">
                  <Formula tex={f.formulaTex}>{f.formula}</Formula>
                </span>
                <span className="formula-list-name">{f.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {unit.guide && (
        <section style={{ marginTop: 32 }}>
          <div className="eyebrow">{unit.guide.title}</div>
          <ol className="guide-list">
            {unit.guide.items.map((it) => (
              <li key={it.label}>
                <span className="guide-list-label">{it.label}</span>
                <span className="guide-list-text">{it.text}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </Shell>
  );
}
