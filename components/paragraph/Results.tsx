import { forwardRef } from "react";

import { PARTS, TIPS, partKeyOf, type CriterionKey } from "@/lib/paragraph/parts";
import { lostTipSlugsFromViews } from "@/lib/paragraph/views";
import type { CriterionView, ParagraphDiscussion, ParagraphEnding, ParagraphPhaseView } from "@/lib/paragraph/types";
import type { PartNo } from "@/lib/types";

import { CheckIcon } from "./Frame";

// The result surfaces (spec 007): the first-try result, the tip cards, the recorded-mark summary,
// the per-criterion pills, the flag button, the final text beside the model, the model paragraph
// with later parts as labelled slots, and the tips added to "Things I need to know".

function MetIcon({ met }: { met: boolean }) {
  return met ? (
    <span role="img" aria-label="Met" className="pg-verdict met">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12l5 5 9-10" />
      </svg>
    </span>
  ) : (
    <span role="img" aria-label="Not met" className="pg-verdict not">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </span>
  );
}

const shortOf = (partNo: PartNo, key: CriterionKey) => PARTS[partKeyOf(partNo)].criteria[key].short;

/** The first-try result box: mark, overall feedback, one reason per criterion, and the text. */
export function CriterionResults({
  partNo,
  phase,
  label = "FIRST TRY",
}: {
  partNo: PartNo;
  phase: ParagraphPhaseView;
  label?: string;
}) {
  return (
    <div className="pg-result">
      <div className="pg-result-top">
        <div className="pg-label">{label}</div>
        <div className="pg-result-mark">
          {phase.mark} / 4
        </div>
        <p className="pg-result-feedback">{phase.feedback}</p>
      </div>
      <ul className="pg-criteria" aria-label="Results by criterion">
        {phase.criteria.map((c) => (
          <li key={c.key}>
            <MetIcon met={c.met} />
            <div>
              <strong>
                ({c.key}) {shortOf(partNo, c.key)}
              </strong>
              {c.reason && <div className="pg-reason">{c.reason}</div>}
            </div>
          </li>
        ))}
      </ul>
      <div className="pg-result-text">
        <div className="pg-label">
          Your first try · {phase.wordCount} words
        </div>
        <p>{phase.text}</p>
      </div>
    </div>
  );
}

/** One card per LOST criterion: its name, the writing tip and one generic application line. Never model text. */
export function TipCards({
  partNo,
  criteria,
  heading,
}: {
  partNo: PartNo;
  criteria: CriterionView[];
  heading: string;
}) {
  const info = PARTS[partKeyOf(partNo)];
  const lost = criteria.filter((c) => !c.met);
  if (lost.length === 0) return null;
  const tipText = (slug: string) => TIPS.find((t) => t.slug === slug)?.description ?? "";
  return (
    <section className="pg-section" aria-labelledby="pg-tips-title">
      <h3 id="pg-tips-title" className="pg-h3">{heading}</h3>
      <div className="rw-hint-grid">
        {lost.map((c) => {
          const crit = info.criteria[c.key];
          const tips = c.key === "d" ? lostTipSlugsFromViews(info.key, [c]).map(tipText) : [crit.tip];
          return (
            <div key={c.key} className="rw-hint-card pg-tip-card">
              <div className="pg-tip-lost">
                Lost: ({c.key}) {crit.short}
              </div>
              {tips.map((t) => (
                <p key={t} className="pg-tip-text">{t}</p>
              ))}
              <p className="pg-tip-apply">{crit.apply}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export interface SummaryInput {
  ending: ParagraphEnding;
  recorded: number;
  phase1: ParagraphPhaseView;
  phase2?: ParagraphPhaseView;
}

/** The two lines under the recorded mark, chosen by outcome (design §8.1, FR-016, FR-019a, FR-033). */
export function summaryLines(i: SummaryInput): { line1: string; line2: string } {
  const { ending, recorded, phase1, phase2 } = i;
  if (ending === "full_marks") return { line1: "Full marks on your first try.", line2: phase1.feedback };
  if (ending === "no_correction") {
    return {
      line1: `Your first try is recorded: ${recorded} / 4 marks.`,
      line2: "We couldn't mark a correction this time, so your first-try mark stands. The tips below are what to work on.",
    };
  }
  if (ending === "self_mark") {
    return { line1: `You marked ${recorded} / 4.`, line2: "Compare your text with the model part." };
  }
  // corrected
  const p2 = phase2!;
  if (p2.criteria.every((c) => c.met)) {
    return {
      line1: "Full marks for a correction — every criterion met.",
      line2: "A correction can earn at most 3. Meet all four on the first try next time for the full 4.",
    };
  }
  if (phase1.mark > p2.mark) {
    return { line1: p2.feedback, line2: `Your recorded mark is ${recorded} / 4 (your better try).` };
  }
  return { line1: p2.feedback, line2: "A correction can earn at most 3." };
}

/** The recorded-mark panel; takes focus when the discussion appears (FR-022). */
export const ResultSummary = forwardRef<HTMLDivElement, SummaryInput>(function ResultSummary(props, ref) {
  const { line1, line2 } = summaryLines(props);
  return (
    <div ref={ref} tabIndex={-1} className={`rw-summary${props.recorded <= 2 ? " plain" : ""}`} style={{ outline: "none" }}>
      <div className="rw-summary-score">
        <span className="rw-summary-mark">{props.recorded}</span>
        <span className="rw-summary-denom"> / 4 marks</span>
      </div>
      <div className="rw-summary-lines">
        <div className="rw-summary-line1">{line1}</div>
        <div className="rw-summary-line2">{line2}</div>
      </div>
    </div>
  );
});

/** "Your correction, criterion by criterion": each row with a First try / Fixed in correction / Not met pill. */
export function CriterionPills({
  partNo,
  phase1,
  phase2,
  heading,
  selfMarked,
  noPills,
}: {
  partNo: PartNo;
  phase1: ParagraphPhaseView;
  phase2?: ParagraphPhaseView;
  heading: string;
  selfMarked?: boolean;
  /** FR-019a: ✓/✗ only, no correction pills. */
  noPills?: boolean;
}) {
  return (
    <section className="pg-section" aria-labelledby="pg-crit-title">
      <h3 id="pg-crit-title" className="pg-h3">{heading}</h3>
      <ul className="pg-criteria pg-criteria-pills">
        {phase1.criteria.map((c) => {
          const fixed = !c.met && phase2?.criteria.find((x) => x.key === c.key)?.met === true;
          const pill = selfMarked
            ? { text: "Your tick", cls: "neutral" }
            : c.met
              ? { text: "First try", cls: "first" }
              : fixed
                ? { text: "Fixed in correction", cls: "fixed" }
                : { text: "Not met", cls: "notmet" };
          return (
            <li key={c.key}>
              <MetIcon met={c.met || fixed} />
              <span className="pg-crit-name">{shortOf(partNo, c.key)}</span>
              {!noPills && <span className={`pg-pill ${pill.cls}`}>{pill.text}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function FlagButton({ flagged, busy, error, onFlag }: { flagged: boolean; busy: boolean; error?: string | null; onFlag: () => void }) {
  return (
    <div className="pg-flag">
      <p className="pg-help">Think the marker got a criterion wrong? Flag it and your teacher will look at it.</p>
      <button type="button" className="rd-btn pg-flag-btn" onClick={onFlag} disabled={flagged || busy} aria-live="polite">
        {flagged ? (
          <>
            <CheckIcon size={16} />
            Flagged for your teacher
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
            </svg>
            This mark seems wrong
          </>
        )}
      </button>
      {error && <p className="pg-flag-error" role="alert">{error}</p>}
    </div>
  );
}

/** The student's final text beside the model part, with a computed word count and the commentary. */
export function FinalBeside({
  partNo,
  label,
  text,
  discussion,
}: {
  partNo: PartNo;
  label: "YOUR CORRECTION" | "YOUR PART";
  text: string;
  discussion: ParagraphDiscussion;
}) {
  const info = PARTS[partKeyOf(partNo)];
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div className="rw-compare">
      <div className="rw-compare-card">
        <div className="rw-compare-label">{label}</div>
        <p className="rw-compare-text">{text}</p>
        <p className="rw-compare-note">
          {words} / {info.limit} words
        </p>
      </div>
      <div className="rw-compare-card model">
        <div className="rw-compare-label">MODEL {info.name.toUpperCase()}</div>
        <p className="rw-compare-text">{discussion.modelPart}</p>
        <p className="rw-compare-note">
          {discussion.modelWords} words — {discussion.commentary}
        </p>
      </div>
    </div>
  );
}

/** The model paragraph up to and including this part (this part highlighted); later parts are chips with labels only. */
export function ModelParagraph({ discussion }: { discussion: ParagraphDiscussion }) {
  return (
    <section className="pg-section" aria-labelledby="pg-para-title">
      <div className="pg-section-head">
        <h3 id="pg-para-title" className="pg-h3">The model paragraph</h3>
        <span className="pg-key">
          <span className="pg-key-swatch" aria-hidden="true" />
          This part
        </span>
      </div>
      <p className="pg-paragraph">
        {discussion.modelSoFar.map((p) => (
          <span key={p.part}>
            {p.current ? <mark className="pg-this">{p.text}</mark> : p.text}{" "}
          </span>
        ))}
        {discussion.laterSlots.map((s) => (
          <span key={s.part} className="pg-chip">
            {s.label} — {s.when}
          </span>
        ))}
      </p>
    </section>
  );
}

/** Tips missed in PHASE 1 (they count even though they were fixed in the correction). */
export function TipsAdded({ partNo, criteria }: { partNo: PartNo; criteria: CriterionView[] }) {
  const info = PARTS[partKeyOf(partNo)];
  const slugs = lostTipSlugsFromViews(info.key, criteria);
  if (slugs.length === 0) return null;
  return (
    <section className="pg-section" aria-labelledby="pg-added-title">
      <div className="pg-section-head">
        <h3 id="pg-added-title" className="pg-h3">Added to Things I need to know</h3>
        <span className="pg-help">Missed on your first try, so they count even though you fixed them</span>
      </div>
      <ul className="pg-added">
        {slugs.map((slug) => {
          const tip = TIPS.find((t) => t.slug === slug)!;
          return (
            <li key={slug} className="concept-item">
              <span className="concept-desc">
                <strong className="concept-term">{tip.term}</strong>: {tip.description}
              </span>
              <span className="concept-progress">
                <span className="concept-pips" aria-hidden="true">
                  {Array.from({ length: tip.clearAfter }, (_, i) => (
                    <span key={i} className="pip" />
                  ))}
                </span>
                <span className="concept-togo" aria-hidden="true">{tip.clearAfter} to go</span>
                <span className="visually-hidden">
                  {tip.clearAfter} correct first tries to go
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function FirstTryCollapsed({ phase }: { phase: ParagraphPhaseView }) {
  return (
    <details className="pg-collapse pg-firsttry">
      <summary>
        <span className="pg-label">FIRST TRY · {phase.mark}/4</span>
        <span className="pg-firsttry-text">{phase.text}</span>
      </summary>
      <p className="pg-firsttry-full">{phase.text}</p>
    </details>
  );
}
