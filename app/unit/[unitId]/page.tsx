import Link from "next/link";
import { notFound } from "next/navigation";

import { AttemptHistory } from "@/components/AttemptHistory";
import { ClampedText } from "@/components/ClampedText";
import { ConceptPanel } from "@/components/ConceptPanel";
import { ComparativeResults, UnitProgress } from "@/components/unseen/UnitProgress";
import { UNSEEN_REPEAT_NOTICE } from "@/lib/unseen/notices";
import { EssayBlock, essayButtonLabel } from "@/components/EssayBlock";
import { Formula } from "@/components/Formula";
import { HistoryUnavailable } from "@/components/HistoryUnavailable";
import { SectionHead } from "@/components/SectionHead";
import { Shell } from "@/components/Shell";
import { StartQuiz } from "@/components/StartQuiz";
import { getUnit, unitIsNew } from "@/content";
import { daysUntil, examsForUnit } from "@/content/exams";
import { requirePageUser } from "@/lib/auth.server";
import { loadConceptContentViewForPage, loadUnitConceptProgress } from "@/lib/db/queries/concepts.server";
import { load, loadUnitHistory } from "@/lib/db/queries/history.server";
import { loadEssayProgressFor } from "@/lib/db/queries/sequence.server";
import { UnitEssays } from "@/components/essay/UnitEssays";
import { loadEssayUnitData } from "@/lib/essay/progress.server";
import { UnitEssays as EnglishUnitEssays } from "@/components/english-essay/UnitEssays";
import { loadEnglishEssayUnitData } from "@/lib/english-essay/progress.server";
import { loadComparativeProgress, loadUnseenProgress } from "@/lib/db/queries/unseen-progress.server";

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
  // a sequential unit (spec 007) shows the essay in progress; its start route resumes the part, so
  // the usual "Continue attempt" button is not used
  const essay = unit.sequence
    ? degraded
      ? ({ status: "unavailable" } as const)
      : await load((db) => loadEssayProgressFor(db, user.id, unit))
    : null;
  // the unseen-text unit (spec 008) offers an unfinished question first, so it has no "Continue attempt"
  const isComparative = unit.draw?.kind === "comparative-weighted";
  const unseen = unit.draw && !isComparative
    ? degraded
      ? ({ status: "unavailable" } as const)
      : await load((db) => loadUnseenProgress(db, user.id, unit))
    : null;
  // the comparative unit (spec 009) has the same start and resume, with its own results by question type
  const comparative = isComparative
    ? degraded
      ? ({ status: "unavailable" } as const)
      : await load((db) => loadComparativeProgress(db, user.id, unit))
    : null;
  // the essay-writing unit (spec 010): the student picks an essay; each shows its latest mark; one attempt is open at a time
  const essays = unit.flow === "essay"
    ? degraded
      ? ({ status: "unavailable" } as const)
      : await load((db) => loadEssayUnitData(db, user.id, unit))
    : null;
  // the English essay unit (spec 011): the same shape, with the live essays in offer order and the latest final mark and band
  const englishEssays = unit.flow === "englishEssay"
    ? degraded
      ? ({ status: "unavailable" } as const)
      : await load((db) => loadEnglishEssayUnitData(db, user.id, unit))
    : null;
  const progress = unseen ?? comparative;
  const resume = !unit.sequence && !unit.draw && !unit.flow && history.status === "ok" ? history.data.resume : null;

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
          {englishEssays ? (
            englishEssays.status === "unavailable" ? (
              <p className="pg-notice" role="status">
                We can&apos;t load your essays right now. Try again in a moment.
              </p>
            ) : null
          ) : essays ? (
            essays.status === "unavailable" ? (
              <p className="pg-notice" role="status">
                We can&apos;t load your essays right now. Try again in a moment.
              </p>
            ) : null
          ) : progress ? (
            progress.status === "unavailable" ? (
              <p className="pg-notice" role="status">
                We can&apos;t load your questions right now. Try again in a moment.
              </p>
            ) : (
              <>
                {progress.data.repeating && (
                  <p className="pg-notice" role="status">
                    {UNSEEN_REPEAT_NOTICE}
                  </p>
                )}
                {progress.data.pending && (
                  <p className="pg-notice" role="status">
                    You have a question in progress: {progress.data.pending.heading} · {progress.data.pending.label}
                  </p>
                )}
                <StartQuiz unitId={unit.id} label={progress.data.pending ? "Continue question" : "Start a question"} />
              </>
            )
          ) : essay ? (
            essay.status === "unavailable" ? (
              <p className="pg-notice" role="status">
                We can&apos;t load your place in the essay right now. Try again in a moment.
              </p>
            ) : essay.data.finished ? (
              <p className="pg-notice" role="status">
                You&apos;ve finished every essay so far. New essays are added as they&apos;re written.
              </p>
            ) : (
              <>
                <EssayBlock progress={essay.data} />
                <StartQuiz unitId={unit.id} label={essayButtonLabel(essay.data.nextPart)} />
              </>
            )
          ) : resume ? (
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

      {englishEssays?.status === "ok" && (
        <section className="unit-section" aria-labelledby="essays-title">
          <SectionHead id="essays-title" title="Pick an essay" />
          <EnglishUnitEssays unitId={unit.id} data={englishEssays.data} />
        </section>
      )}

      {essays?.status === "ok" && (
        <section className="unit-section" aria-labelledby="essays-title">
          <SectionHead id="essays-title" title="Pick an essay" />
          <UnitEssays unitId={unit.id} data={essays.data} />
        </section>
      )}

      {/* 2. The student's concepts to review, below Start/Continue and above the history. */}
      <ConceptPanel unit={unit} progress={conceptProgress} view={conceptView} details={essays?.status === "ok" ? essays.data.gapDetails : englishEssays?.status === "ok" ? englishEssays.data.gapDetails : undefined} />

      {unseen?.status === "ok" && <UnitProgress byForm={unseen.data.byForm} />}
      {comparative?.status === "ok" && <ComparativeResults byKind={comparative.data.byKind} />}

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
