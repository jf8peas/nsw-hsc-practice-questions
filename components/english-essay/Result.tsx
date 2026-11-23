"use client";

import { useEffect, useRef } from "react";

import { VerdictBadge } from "@/components/essay/Result";
import { BANDS } from "@/lib/english-essay/scoring";
import { ENGLISH_CRITERIA_IDS, type EnglishCriterionId, type EnglishEssayResultView } from "@/lib/english-essay/types";

import { PlanText } from "./PlanReadout";
import { EnglishEssayHeader } from "./shared";

// The result of a marked English essay (spec 011 FR-024 to FR-031, data-model §10.2): the final mark out of 20 and its band,
// four criteria each with a verdict word and shape and the marker's reason, two lift points, a question-focus warning only
// for partly or barely, every knowledge error and flagged quotation with its adjustment explained, the essay beside the
// locked plan, the band 1 model essay (collapsed) and at most five gaps. Verdicts and flags never rely on colour alone.
// Shown after marking and from the attempt detail page. It never shows a raw mark, the marker's own band or any review.

export const ENGLISH_CRITERION_LABEL: Record<EnglishCriterionId, string> = {
  argument: "Question and argument",
  analysis: "Analysis of how meaning is made",
  knowledge: "Knowledge of the text and use of evidence",
  expression: "Expression and structure",
};

export function EnglishEssayResult({ result, onBack }: { result: EnglishEssayResultView; onBack?: () => void }) {
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => {
    summary.current?.focus();
  }, []);
  const range = BANDS.find((b) => b.band === result.finalBand);
  const adjusted = result.capped || result.knowledgeErrors.length > 0 || result.focusCap !== null;

  return (
    <div className="es-card es-result">
      <div ref={summary} tabIndex={-1} className="es-summary" aria-labelledby="es-mark">
        <p className="es-mark" id="es-mark">
          <span className="es-mark-num">{result.finalMark}</span> / 20
        </p>
        <p className="es-band">
          Band {result.finalBand}
          {range ? ` (${range.min}–${range.max})` : ""}
        </p>
        <p className="es-band-reason">{result.bandReason}</p>
        {adjusted && (
          <ul className="es-adjust">
            {result.knowledgeErrors.length > 0 && (
              <li>
                {result.knowledgeErrors.length === 1 ? "One mistake about the text" : `${result.knowledgeErrors.length} mistakes about the text`} lowered your mark
                {result.knowledgeCapApplied ? " (with two or more mistakes the mark cannot go above 16)" : ""}.
              </li>
            )}
            {result.focusCap !== null && (
              <li>
                Your essay answered the question only {result.questionFocus === "partly" ? "partly" : "barely"}, so the mark is held to {result.focusCap} or below.
              </li>
            )}
          </ul>
        )}
      </div>

      <EnglishEssayHeader essay={result.essay} />

      {result.questionFocus !== "fully" && (
        <section aria-labelledby="es-focus-title" className="es-warning">
          <h3 id="es-focus-title">Answering the question</h3>
          <p>
            <strong>{result.questionFocus === "partly" ? "Partly on the question." : "Barely on the question."}</strong> {result.questionFocusReason}
          </p>
        </section>
      )}

      <section aria-labelledby="es-criteria-title">
        <h3 id="es-criteria-title">How each criterion went</h3>
        <ul className="es-criteria">
          {ENGLISH_CRITERIA_IDS.map((id) => (
            <li key={id}>
              <div className="es-criterion-head">
                <span className="es-criterion-name">{ENGLISH_CRITERION_LABEL[id]}</span>
                <VerdictBadge verdict={result.criteria[id].verdict} />
              </div>
              <p className="es-criterion-reason">{result.criteria[id].reason}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="es-lift-title">
        <h3 id="es-lift-title">To lift your mark</h3>
        <ol className="es-lift">
          {result.lift.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
      </section>

      {result.knowledgeErrors.length > 0 && (
        <section aria-labelledby="es-errors-title">
          <h3 id="es-errors-title">Mistakes about the text</h3>
          <ul className="es-flags">
            {result.knowledgeErrors.map((e, i) => (
              <li key={i}>
                <q>{e.quote}</q>
                <span>{e.why}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.quoteFlags.length > 0 && (
        <section aria-labelledby="es-quotes-title">
          <h3 id="es-quotes-title">Check these quotations</h3>
          <ul className="es-flags">
            {result.quoteFlags.map((f, i) => (
              <li key={i}>
                <q>{f.quote}</q>
                {f.status === "near" ? (
                  <span>
                    Check this quote. The play says: <q>{f.correct}</q> This did not cost you marks.
                  </span>
                ) : (
                  <span>Check this quote: not found in the play. If these words come from another source, name it in your sentence.</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="es-yours-title" className="es-sidebyside">
        <h3 id="es-yours-title" className="es-sbs-title">
          Your essay and your plan
        </h3>
        <div className="es-sbs-essay">
          <h4>Your essay ({result.words} words)</h4>
          <p className="es-essay-text">{result.essayText}</p>
        </div>
        <div className="es-sbs-plan">
          <h4>Your plan</h4>
          <PlanText plan={result.plan} />
        </div>
      </section>

      {result.modelEssay && (
        <details className="es-collapse">
          <summary>A band 1 model essay</summary>
          <p className="es-essay-text">{result.modelEssay}</p>
        </details>
      )}

      <section aria-labelledby="es-gaps-title">
        <h3 id="es-gaps-title">Added to Things I need to know</h3>
        {result.gaps.length === 0 ? (
          <p>Nothing new this time.</p>
        ) : (
          <ul className="es-gaps">
            {result.gaps.map((g) => (
              <li key={g.conceptId}>
                <strong>{g.term}</strong>
                {g.detail ? `: ${g.detail}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {onBack && (
        <div className="es-actions">
          <button type="button" className="rw-btn" onClick={onBack}>
            Back to essays
          </button>
        </div>
      )}
    </div>
  );
}
