import { useState, type ReactNode } from "react";

import type { EssayBar, EssayPartDot, ParagraphQuestionView } from "@/lib/paragraph/types";

// The frame every paragraph question state shares (spec 007 design §3): the essay progress bar,
// the pill and counter row, the step tracker, the essay question with its directive verb, "What
// this part must do", the brief and the model paragraph so far. Presentational only: plain data in.

export function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

/** Five labelled segments, one per part of the essay; the quiz progress bar for this unit. */
export function EssayProgressBar({ essayNo, part, parts }: { essayNo: number; part: number; parts: EssayPartDot[] }) {
  return (
    <ol className="pg-bar" aria-label={`Essay ${essayNo} progress: part ${part} of 5`}>
      {parts.map((p) => (
        <li key={p.part} className={`pg-bar-seg ${p.state}`} aria-current={p.state === "current" ? "step" : undefined}>
          <span className="pg-bar-fill" aria-hidden="true" />
          <span className="pg-bar-label">
            {p.state === "done" && (
              <span className="pg-bar-tick">
                <CheckIcon size={12} />
              </span>
            )}
            {p.short}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function PillRow({ essayNo, part }: { essayNo: number; part: number }) {
  return (
    <div className="pg-meta">
      <span className="rd-pill blue">Paragraph writing · 4 marks</span>
      <span className="pg-counter">
        Essay {essayNo} · Part {part} of 5
      </span>
    </div>
  );
}

export type TrackerStep = "write" | "correct" | "discuss";

/** Write / Correct with tips / Discuss, as the rewrite tracker; "Mark it yourself" on the self-mark path. */
export function ParagraphStepTracker({
  step,
  phase1Mark,
  phase2Mark,
  skipCorrection,
  selfMark,
}: {
  step: TrackerStep;
  phase1Mark?: number;
  phase2Mark?: number;
  /** A 4/4 first try, or a correction that could not be marked, has no "Correct" step. */
  skipCorrection?: boolean;
  selfMark?: boolean;
}) {
  const writeDone = step !== "write";
  const writeLabel = writeDone && phase1Mark !== undefined ? `Write · ${phase1Mark}/4` : "Write";
  if (selfMark) {
    return (
      <ol className="rw-steps" aria-label="Steps">
        <li className="rw-step done">
          <span className="rw-step-dot"><CheckIcon /></span>
          Write
        </li>
        <li aria-hidden="true" className="rw-step-rule" />
        <li className="rw-step current" aria-current="step">
          <span className="rw-step-dot">2</span>
          Mark it yourself
        </li>
      </ol>
    );
  }
  const correctDone = step === "discuss" && phase2Mark !== undefined;
  return (
    <ol className="rw-steps" aria-label="Steps">
      <li className={`rw-step ${writeDone ? "done" : "current"}`} aria-current={writeDone ? undefined : "step"}>
        <span className="rw-step-dot">{writeDone ? <CheckIcon /> : "1"}</span>
        {writeLabel}
      </li>
      {!skipCorrection && (
        <>
          <li aria-hidden="true" className="rw-step-rule" />
          <li
            className={`rw-step ${correctDone ? "done" : step === "correct" ? "current" : ""}`}
            aria-current={step === "correct" ? "step" : undefined}
          >
            <span className="rw-step-dot">{correctDone ? <CheckIcon /> : "2"}</span>
            {correctDone ? `Correct · ${phase2Mark}/3` : "Correct with tips"}
          </li>
        </>
      )}
      <li aria-hidden="true" className="rw-step-rule" />
      <li className={`rw-step ${step === "discuss" ? "current" : ""}`} aria-current={step === "discuss" ? "step" : undefined}>
        <span className="rw-step-dot">3</span>
        Discuss
      </li>
    </ol>
  );
}

/** The essay question in curly quotes with its directive verb highlighted (bold, not colour alone). */
export function EssayQuestionBlock({
  question,
  verb,
  definition,
}: {
  question: string;
  verb: string;
  definition?: string;
}) {
  const idx = question.toLowerCase().indexOf(verb.toLowerCase());
  const before = idx >= 0 ? question.slice(0, idx) : question;
  const hit = idx >= 0 ? question.slice(idx, idx + verb.length) : "";
  const after = idx >= 0 ? question.slice(idx + verb.length) : "";
  return (
    <div className="pg-question">
      <div className="pg-label">ESSAY QUESTION</div>
      <p className="pg-question-text">
        “{before}
        {hit && <mark className="pg-verb">{hit}</mark>}
        {after}”
      </p>
      {definition && (
        <p className="pg-verb-def">
          <strong>{hit || verb}</strong> — {definition}
        </p>
      )}
    </div>
  );
}

export function PartGuidance({ lines }: { lines: string[] }) {
  return (
    <section className="pg-section" aria-labelledby="pg-guide-title">
      <div className="pg-section-head">
        <h3 id="pg-guide-title" className="pg-h3">What this part must do</h3>
        <span className="pg-help">Marked out of 4 on these</span>
      </div>
      <ol className="pg-guide">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ol>
    </section>
  );
}

const BRIEF_ROWS: Array<{ field: keyof ParagraphQuestionView["brief"]; uses: string; label: string }> = [
  { field: "economy", uses: "economy", label: "Economy" },
  { field: "argument", uses: "argument", label: "Argument" },
  { field: "counterpoint", uses: "counterpoint", label: "Counterpoint" },
  { field: "chainSteps", uses: "chainSteps", label: "Chain steps" },
  { field: "facts", uses: "facts", label: "Facts" },
  { field: "limitation", uses: "limitation", label: "Limitation" },
];

const BRIEF_HELP = "The content in plain English — you do the writing";

/**
 * Every brief field, with the fields this part needs marked "Use in this part". With `initialOpen`
 * set the section is a native <details> (the writing screen): it starts open or closed as given,
 * the student can toggle it, and nothing is saved. Without it the table is plain (inside the
 * collapsed "brief and model" row).
 */
export function BriefTable({
  brief,
  uses,
  initialOpen,
}: {
  brief: ParagraphQuestionView["brief"];
  uses: string[];
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen ?? true);
  if (initialOpen === undefined) {
    return (
      <section className="pg-section" aria-labelledby="pg-brief-title">
        <div className="pg-section-head">
          <h3 id="pg-brief-title" className="pg-h3">The brief</h3>
          <span className="pg-help">{BRIEF_HELP}</span>
        </div>
        <BriefRows brief={brief} uses={uses} />
      </section>
    );
  }
  const usedLabels = BRIEF_ROWS.filter((r) => uses.includes(r.uses)).map((r) => r.label);
  return (
    <section className="pg-section" aria-labelledby="pg-brief-title">
      <details className="pg-brief-details" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary className="pg-brief-summary">
          <svg className="pg-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <h3 id="pg-brief-title" className="pg-h3">The brief</h3>
          <span className="pg-help">{open ? BRIEF_HELP : `Use in this part: ${usedLabels.join(" · ")}`}</span>
        </summary>
        <BriefRows brief={brief} uses={uses} />
      </details>
    </section>
  );
}

function BriefRows({ brief, uses }: { brief: ParagraphQuestionView["brief"]; uses: string[] }) {
  return (
      <dl className="pg-brief">
        {BRIEF_ROWS.map(({ field, uses: key, label }) => {
          const used = uses.includes(key);
          const value = brief[field];
          return (
            <div key={field} className={`pg-brief-row${used ? " use" : ""}`}>
              <dt className="pg-brief-label">
                {label}
                {used && <span className="pg-use-pill">Use in this part</span>}
              </dt>
              <dd className="pg-brief-value">
                {field === "chainSteps" ? (
                  <ol>
                    {(value as string[]).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                ) : Array.isArray(value) ? (
                  <ul>
                    {value.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  value
                )}
              </dd>
            </div>
          );
        })}
      </dl>
  );
}

/** The earlier parts' model text above a dashed slot for this part. Later parts are never shown. */
export function ModelSoFar({
  earlier,
  partNo,
  partName,
}: {
  earlier: ParagraphQuestionView["earlier"];
  partNo: number;
  partName: string;
}) {
  return (
    <section className="pg-section" aria-labelledby="pg-model-title">
      <div className="pg-section-head">
        <h3 id="pg-model-title" className="pg-h3">The model paragraph so far</h3>
        <span className="pg-help">Your part continues from here</span>
      </div>
      <div className="pg-model">
        {earlier.map((e) => (
          <div key={e.part} className="pg-model-part">
            <div className="pg-label">{e.label}</div>
            <p>{e.text}</p>
          </div>
        ))}
        <div className="pg-slot">
          {partNo} · {partName} — you write this below
        </div>
      </div>
    </section>
  );
}

/** The brief and the paragraph so far, collapsed into one row (marking and correction states). */
export function BriefAndModelCollapsed({ view, children }: { view: ParagraphQuestionView; children?: ReactNode }) {
  return (
    <details className="pg-collapse">
      <summary>The brief and the model paragraph so far</summary>
      <BriefTable brief={view.brief} uses={view.uses} />
      <ModelSoFar earlier={view.earlier} partNo={view.part} partName={view.partName} />
      {children}
    </details>
  );
}

export function essayBarParts(view: ParagraphQuestionView): EssayPartDot[] {
  return view.parts;
}

export type { EssayBar };
