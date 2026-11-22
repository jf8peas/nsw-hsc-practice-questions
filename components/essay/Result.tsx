"use client";

import { useEffect, useRef } from "react";

import { BANDS, CRITERIA_IDS, ONE_ECONOMY_CAP, type Verdict } from "@/lib/essay/scoring";
import type { EssayResultView } from "@/lib/essay/types";

import { EssayHeader, PlanText } from "./shared";

// The result of a marked essay (spec 010 FR-032, research R11): the mark out of 20 and band, five criteria each
// with a verdict word and shape and the marker's reason, two lift points, flagged figures, the essay beside the
// plan, the band 1 model essay (collapsed) and the gaps added to "Things I need to know". Verdicts never rely on
// colour alone. Shown after marking and from the attempt detail page.

export const CRITERION_LABEL: Record<(typeof CRITERIA_IDS)[number], string> = {
  understanding: "Understanding of strategies",
  theory: "Terms, concepts and theory",
  assessment: "Assessment of effectiveness",
  data: "Data and indicators",
  structure: "Logical, cohesive response",
};

const VERDICT: Record<Verdict, { word: string; bars: number }> = {
  strong: { word: "Strong", bars: 4 },
  sound: { word: "Sound", bars: 3 },
  developing: { word: "Developing", bars: 2 },
  weak: { word: "Weak", bars: 1 },
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const v = VERDICT[verdict];
  return (
    <span className={`es-verdict v-${verdict}`}>
      <span className="es-bars" aria-hidden="true">
        {"▰".repeat(v.bars)}
        {"▱".repeat(4 - v.bars)}
      </span>
      {v.word}
    </span>
  );
}

export function EssayResult({ result, onBack }: { result: EssayResultView; onBack?: () => void }) {
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => {
    summary.current?.focus();
  }, []);
  const range = BANDS.find((b) => b.band === result.band);

  return (
    <div className="es-card es-result">
      <div ref={summary} tabIndex={-1} className="es-summary" aria-labelledby="es-mark">
        <p className="es-mark" id="es-mark">
          <span className="es-mark-num">{result.finalMark}</span> / 20
        </p>
        <p className="es-band">
          Band {result.band}
          {range ? ` (${range.min}–${range.max})` : ""}
        </p>
        {result.capped && (
          <p className="es-capped">
            Capped at {ONE_ECONOMY_CAP}: the question asks about two economies, and the essay treats only one.
          </p>
        )}
        <p className="es-band-reason">{result.bandReason}</p>
      </div>

      <EssayHeader essay={result.essay} />

      <section aria-labelledby="es-criteria-title">
        <h3 id="es-criteria-title">How each criterion went</h3>
        <ul className="es-criteria">
          {CRITERIA_IDS.map((id) => (
            <li key={id}>
              <div className="es-criterion-head">
                <span className="es-criterion-name">{CRITERION_LABEL[id]}</span>
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

      {result.flags.length > 0 && (
        <section aria-labelledby="es-flags-title">
          <h3 id="es-flags-title">Check this figure</h3>
          <ul className="es-flags">
            {result.flags.map((f, i) => (
              <li key={i}>
                <q>{f.quote}</q>
                <span>{f.why}</span>
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
