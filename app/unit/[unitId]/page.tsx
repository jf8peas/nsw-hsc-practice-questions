import Link from "next/link";
import { notFound } from "next/navigation";

import { AttemptHistory } from "@/components/AttemptHistory";
import { ClampedText } from "@/components/ClampedText";
import { ConceptPanel } from "@/components/ConceptPanel";
import { Formula } from "@/components/Formula";
import { HistoryUnavailable } from "@/components/HistoryUnavailable";
import { SectionHead } from "@/components/SectionHead";
import { Shell } from "@/components/Shell";
import { StartQuiz } from "@/components/StartQuiz";
import { getUnit, unitIsNew } from "@/content";
import { daysUntil, examsForUnit } from "@/content/exams";
import { requirePageUser } from "@/lib/auth.server";
import { loadConceptContentViewForPage, loadUnitConceptProgress } from "@/lib/db/queries/concepts.server";
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
  const [history, conceptProgress] = await Promise.all([
    degraded ? ({ status: "unavailable" } as const) : loadUnitHistory(user.id, unit.id),
    degraded ? ({ status: "unavailable" } as const) : loadUnitConceptProgress(user.id, unit),
  ]);
  // approved summaries and pictures for the weak concepts listed (descriptions only if this fails)
  const conceptView =
    conceptProgress.status === "ok" && conceptProgress.data.length > 0
      ? await loadConceptContentViewForPage(conceptProgress.data.map((s) => s.conceptId))
      : undefined;
  const resume = history.status === "ok" ? history.data.resume : null;

  const exams = examsForUnit(unit.id);

  return (
    <Shell backHref="/">
      {/* 1. Introduction: what this quiz is, when the exam is, and the way in (mobile-first). */}
      <header className="rd-card unit-intro">
        <div className="unit-badges">
          {unitIsNew(unit) && <span className="rd-pill new-pill">NEW</span>}
          <span className="rd-pill blue">{unit.type}</span>
          <span className="rd-pill date-pill">{unit.created}</span>
        </div>
        <h1 className="page-h1 unit-intro-title">{unit.title}</h1>
        <ClampedText className="unit-intro-desc">{unit.description}</ClampedText>

        {exams.map((exam) => {
          const d = daysUntil(exam.date);
          return (
            <div className="unit-exam" key={exam.id}>
              <span className="unit-exam-when">
                {d === 0 ? "Today" : d === 1 ? "In 1 day" : `In ${d} days`}
              </span>
              <span className="unit-exam-what">{exam.title}</span>
              <span className="unit-exam-date">{exam.date}</span>
            </div>
          );
        })}

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
      </header>

      {/* 2. The student's concepts to review, below Start/Continue and above the history. */}
      <ConceptPanel unit={unit} progress={conceptProgress} view={conceptView} />

      {/* 3 and 4. Results, then past attempts. */}
      {history.status === "ok" ? (
        <AttemptHistory history={history.data} />
      ) : (
        <section className="unit-section" aria-labelledby="results-title">
          <SectionHead id="results-title" title="Your results" />
          <HistoryUnavailable />
        </section>
      )}

      {unit.formulas && unit.formulas.length > 0 && (
        <section className="unit-section" aria-labelledby="formulas-title">
          <SectionHead id="formulas-title" title="Formulas in this test" />
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
        <section className="unit-section" aria-labelledby="guide-title">
          <SectionHead id="guide-title" title={unit.guide.title} />
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
