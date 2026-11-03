"use client";

import { useEffect, useRef, useState } from "react";

import { loadRewriteDraft, saveRewriteDraft, sendRewriteDraftBeacon } from "@/lib/drafts";
import type { RewriteDiscussion, RewriteGradeResult } from "@/lib/grading";
import { countWords } from "@/lib/wordcount";

import { FirstTryCollapsed } from "./FirstTryCollapsed";
import { FirstTryResult } from "./FirstTryResult";
import { HintCards } from "./HintCards";
import { LockedSentence } from "./LockedSentence";
import { MarkingStatus, type MarkingStep } from "./MarkingStatus";
import { OutcomeSummary } from "./OutcomeSummary";
import { PlainEnglishBlock } from "./PlainEnglishBlock";
import { RetryBox } from "./RetryBox";
import { RewriteStepTracker } from "./RewriteStepTracker";
import { SelfMarkScreen } from "./SelfMarkScreen";
import { SentenceComparison } from "./SentenceComparison";
import { TermTable, type TermRow } from "./TermTable";

const WORD_LIMIT = 25;
const STEP2_DELAY_MS = 1500;

export interface RewriteTicks {
  criterionA: boolean;
  termTicks: Record<string, boolean>;
  criterionC: boolean;
}

/**
 * The sentence-rewrite question card (spec 006): a five-state machine — writing, marking first
 * try, feedback + retry, marking retry, result — plus the self-mark screen on the degrade path.
 * The states are derived from the phase results plus a local `submitting` flag; the submitted
 * text is never cleared (the local `text1`/`text2` are kept until the grade is stored, so a
 * grading error returns an editable box holding the same text, FR-011).
 */
export function RewritePanel({
  attemptId,
  questionId,
  prompt,
  phase1Answer,
  phase1Result,
  phase2Answer,
  phase2Result,
  phase1Draft,
  phase2Draft,
  onGrade,
  onSelfMark,
  busy,
  nextLabel,
}: {
  attemptId: string;
  questionId: string;
  /** The plain-English sentence (FR-003). */
  prompt: string;
  phase1Answer: string;
  phase1Result: RewriteGradeResult | null;
  phase2Answer?: string;
  phase2Result?: RewriteGradeResult;
  /** The persisted phase-1 draft (resume, FR-053). */
  phase1Draft?: string;
  /** The persisted phase-2 draft (resume, FR-053); the retry box falls back to the first try. */
  phase2Draft?: string;
  onGrade: (phase: 1 | 2, answer: string) => void;
  onSelfMark: (ticks: RewriteTicks) => void;
  busy: boolean;
  /** "Next: question 4 of 5" / "Last question" (FR-030). */
  nextLabel?: string;
}) {
  // prefer the sessionStorage draft (written on every keystroke) over the server draft (saved on
  // blur/page hide, so it can be older) — research R6, review item 6
  const [text1, setText1] = useState<string>(loadRewriteDraft(attemptId, questionId, 1) || phase1Draft || "");
  const [text2, setText2] = useState("");
  const [ticks, setTicks] = useState<RewriteTicks>({ criterionA: true, termTicks: {}, criterionC: true });
  const [submittingPhase, setSubmittingPhase] = useState<1 | 2 | null>(null);
  const [markingStep, setMarkingStep] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const retryInitialised = useRef(false);
  const text1Ref = useRef(text1);
  const text2Ref = useRef(text2);
  text1Ref.current = text1;
  text2Ref.current = text2;

  // a server draft (resume, FR-053) arrives after mount (the quiz restores rewrite state in an
  // effect); prefill the writing box once, unless it already holds a sessionStorage draft
  const serverDraftApplied = useRef(text1 !== "");
  useEffect(() => {
    if (serverDraftApplied.current) return;
    if (phase1Draft) {
      setText1(phase1Draft);
      serverDraftApplied.current = true;
    }
  }, [phase1Draft, attemptId, questionId]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  // ---- derived states ------------------------------------------------------
  const phase1Submitted = phase1Result !== null;
  const phase2Submitted = phase2Result !== undefined;
  const needsSelfMark = phase1Result?.needsSelfMark === true || phase2Result?.needsSelfMark === true;
  const phase1Final = phase1Result?.marksAwarded === 3 && !needsSelfMark;
  const atResult = phase2Submitted || phase1Final;
  const atRetry = phase1Submitted && !phase2Submitted && !atResult && !needsSelfMark;
  const marking1 = submittingPhase === 1 && phase1Result === null;
  const marking2 = submittingPhase === 2 && phase2Result === undefined;
  const marking = marking1 || marking2;

  const discussion: RewriteDiscussion | undefined = phase2Result?.discussion ?? phase1Result?.discussion;
  const hint = phase1Result?.hint;
  const phase1Marks = phase1Result?.marksAwarded ?? undefined;
  const phase2Marks = phase2Result?.marksAwarded ?? undefined;
  const shown1 = phase1Submitted ? phase1Answer : text1;
  const shown2 = phase2Submitted ? (phase2Answer ?? "") : text2;

  // ---- the submitted text is never cleared; clear the local draft only once graded ----------
  useEffect(() => {
    if (phase1Result !== null) saveRewriteDraft(attemptId, questionId, 1, "");
  }, [phase1Result, attemptId, questionId]);
  useEffect(() => {
    if (phase2Result !== undefined) saveRewriteDraft(attemptId, questionId, 2, "");
  }, [phase2Result, attemptId, questionId]);

  // ---- submitting: cleared when the phase's result arrives or the fetch ends (error) --------
  useEffect(() => {
    if (submittingPhase === 1 && phase1Result !== null) setSubmittingPhase(null);
    if (submittingPhase === 2 && phase2Result !== undefined) setSubmittingPhase(null);
    if (!busy && submittingPhase !== null) setSubmittingPhase(null);
  }, [submittingPhase, phase1Result, phase2Result, busy]);

  // ---- the retry box is pre-filled once state 3 first appears (FR-017, FR-053) -------------
  useEffect(() => {
    if (atRetry && !retryInitialised.current) {
      retryInitialised.current = true;
      // the retry box starts from the sessionStorage draft, else the server draft, else the
      // first-try sentence (FR-017, FR-053); loadRewriteDraft returns "" when absent
      setText2(loadRewriteDraft(attemptId, questionId, 2) || phase2Draft || phase1Answer);
    }
  }, [atRetry, phase2Draft, phase1Answer, attemptId, questionId]);

  // ---- the cosmetic, timed marking steps (FR-008, FR-020; research R8) ---------------------
  useEffect(() => {
    if (!marking) return;
    setMarkingStep(0);
    const t = window.setTimeout(() => setMarkingStep(1), STEP2_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [marking]);

  // ---- draft beacons on blur / page hide / visibility change (FR-053, research R5.2) -------
  useEffect(() => {
    const send = () => {
      // skip a phase that is already graded (its sentence is stored as phaseN_answer)
      if (phase1Result === null) sendRewriteDraftBeacon(attemptId, questionId, 1, text1Ref.current);
      if (phase2Result === undefined) sendRewriteDraftBeacon(attemptId, questionId, 2, text2Ref.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") send();
    };
    window.addEventListener("pagehide", send);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", send);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [attemptId, questionId, phase1Result, phase2Result]);

  // ---- state 4's hint pills and checking label (FR-020) ------------------------------------
  const hintTerms = hint?.terms ?? [];
  const checkingLabel =
    hintTerms.length > 0
      ? `Checking ${hintTerms.map((t) => t.term).join(" and ")}…`
      : "Checking your sentence…";
  const askedRow =
    hintTerms.length > 0
      ? { heading: "Terms you were asked to use:", pills: hintTerms.map((t) => t.term) }
      : {
          heading: "You were asked to fix:",
          pills: [hint?.lostCriterion === "c" ? "Conciseness" : "Meaning"],
        };

  const markingSteps: MarkingStep[] = marking1
    ? [
        { label: "Read your sentence", state: "done" },
        { label: "Checking your economics terms…", state: markingStep >= 1 ? "active" : "pending" },
        { label: "Writing your feedback", state: "pending" },
      ]
    : [
        { label: "Read your retry", state: "done" },
        { label: checkingLabel, state: markingStep >= 1 ? "active" : "pending" },
        { label: "Preparing the model sentence", state: "pending" },
      ];
  const announced = markingStep >= 1 ? markingSteps[1].label : markingSteps[0].label;

  // ---- result data (FR-024 to FR-028) ------------------------------------------------------
  const maxMarks = phase1Result?.maxMarks ?? 3;
  const recordedMark = phase2Result
    ? Math.max(phase1Marks ?? 0, phase2Marks ?? 0)
    : (phase1Marks ?? 0);
  const firstTry = phase1Marks ?? 0;
  const retryDone = phase2Submitted;
  const gain = recordedMark - firstTry;
  // the retry advice depends on what the phase 1 hint said was wrong: missed terms, or a lost
  // criterion (meaning / length) with every term already used
  const missedTerms = (phase1Result?.hint?.terms?.length ?? 0) > 0;
  const retryAdvice = missedTerms
    ? `Use every term on the first try next time for the full ${maxMarks}.`
    : `Get every term, the meaning and the length right on the first try for the full ${maxMarks}.`;
  let line1 = "";
  let line2 = "";
  if (firstTry === maxMarks) {
    line1 = "Full marks on your first try.";
    line2 = phase1Result?.feedback ?? "";
  } else if (retryDone) {
    line1 = phase2Result?.feedback ?? "";
    line2 =
      gain > 0
        ? `A retry can earn at most ${maxMarks - 1}. ${retryAdvice}`
        : `Your retry didn't improve your mark — it stays at ${recordedMark} / ${maxMarks}.`;
  }

  const finalLabel: "YOUR RETRY" | "YOUR SENTENCE" = phase2Submitted ? "YOUR RETRY" : "YOUR SENTENCE";
  const finalSentence = phase2Submitted ? (phase2Answer ?? "") : phase1Answer;
  const finalSpans = phase2Result?.creditedSpans ?? phase1Result?.creditedSpans ?? [];
  const languageNote = phase2Result?.languageNote ?? phase1Result?.languageNote;

  const phase1Outcomes = new Map((phase1Result?.termOutcomes ?? []).map((o) => [o.conceptId, o.correct]));
  const phase2Outcomes = new Map((phase2Result?.phase2TermOutcomes ?? []).map((o) => [o.conceptId, o.correct]));
  const termRows: TermRow[] = (discussion?.terms ?? []).map((t) => {
    const status = phase1Outcomes.get(t.conceptId) === true ? "first-try" : phase2Outcomes.get(t.conceptId) === true ? "added" : "not-used";
    return { term: t.term, definition: t.definition, why: t.why, status };
  });

  // ---- self-mark ticks ---------------------------------------------------------------------
  const onTermTick = (term: string, checked: boolean) =>
    setTicks((prev) => ({ ...prev, termTicks: { ...prev.termTicks, [term]: checked } }));
  const onCriterionTick = (criterion: "a" | "c", checked: boolean) =>
    setTicks((prev) => ({ ...prev, [criterion === "a" ? "criterionA" : "criterionC"]: checked }));

  // ---- render ------------------------------------------------------------------------------
  return (
    <div className="rw-card">
      {needsSelfMark ? (
        <>
          <RewriteStepTracker phase1Marks={phase1Marks} selfMark />
          <PlainEnglishBlock sentence={prompt} />
          <SelfMarkScreen
            sentence={phase2Submitted ? (phase2Answer ?? "") : phase1Answer}
            wordCount={countWords(phase2Submitted ? (phase2Answer ?? "") : phase1Answer)}
            discussion={discussion ?? { modelSentences: [], terms: [] }}
            ticks={ticks}
            onTermTick={onTermTick}
            onCriterionTick={onCriterionTick}
            onSave={() => onSelfMark(ticks)}
            busy={busy}
          />
        </>
      ) : marking1 ? (
        <>
          <RewriteStepTracker phase1Marks={undefined} />
          <PlainEnglishBlock sentence={prompt} />
          <LockedSentence label="Your sentence" sentence={shown1} wordCount={countWords(shown1)} progress reducedMotion={reducedMotion} />
          <MarkingStatus steps={markingSteps} announced={announced} />
          <div className="rw-marking-footer">
            <span className="rw-marking-note">Usually takes a few seconds.</span>
            <button type="button" className="rw-btn" disabled>
              <SpinnerIcon />
              Marking…
            </button>
          </div>
        </>
      ) : marking2 ? (
        <>
          <RewriteStepTracker phase1Marks={phase1Marks} />
          <PlainEnglishBlock sentence={prompt} />
          <FirstTryCollapsed marks={phase1Marks ?? 0} sentence={phase1Answer}>
            <FirstTryResult
              marks={phase1Marks ?? 0}
              feedback={phase1Result?.feedback ?? ""}
              sentence={phase1Answer}
              spans={phase1Result?.creditedSpans ?? []}
            />
          </FirstTryCollapsed>
          <div className="rw-asked-row">
            <span>{askedRow.heading}</span>
            {askedRow.pills.map((p) => (
              <span key={p} className="rw-pill asked">
                {p}
              </span>
            ))}
          </div>
          <LockedSentence label="Your retry" sentence={shown2} wordCount={countWords(shown2)} progress reducedMotion={reducedMotion} />
          <MarkingStatus steps={markingSteps} announced={announced} />
          <div className="rw-marking-footer">
            <span className="rw-marking-note">Retry is worth up to 2 marks.</span>
            <button type="button" className="rw-btn" disabled>
              <SpinnerIcon />
              Marking…
            </button>
          </div>
        </>
      ) : atResult ? (
        <>
          <RewriteStepTracker phase1Marks={phase1Marks} phase2Marks={phase2Marks} />
          <OutcomeSummary firstTry={firstTry} final={recordedMark} retryDone={retryDone} maxMarks={maxMarks} line1={line1} line2={line2} />
          <SentenceComparison
            finalLabel={finalLabel}
            finalSentence={finalSentence}
            finalSpans={finalSpans}
            languageNote={languageNote}
            modelSentences={discussion?.modelSentences ?? []}
            modelTerms={(discussion?.terms ?? []).map((t) => t.term)}
          />
          <TermTable terms={termRows} />
          {phase2Submitted && (
            <FirstTryCollapsed marks={phase1Marks ?? 0} sentence={phase1Answer}>
              <FirstTryResult
                marks={phase1Marks ?? 0}
                feedback={phase1Result?.feedback ?? ""}
                sentence={phase1Answer}
                spans={phase1Result?.creditedSpans ?? []}
              />
            </FirstTryCollapsed>
          )}
          {nextLabel && (
            <div className="rw-result-footer">
              <span className="rw-result-footer-line">{nextLabel}</span>
            </div>
          )}
        </>
      ) : atRetry ? (
        <>
          <RewriteStepTracker phase1Marks={phase1Marks} />
          <PlainEnglishBlock sentence={prompt} />
          <FirstTryResult
            marks={phase1Marks ?? 0}
            feedback={phase1Result?.feedback ?? ""}
            sentence={phase1Answer}
            spans={phase1Result?.creditedSpans ?? []}
          />
          <HintCards hint={hint ?? { terms: [] }} />
          <RetryBox
            value={text2}
            onChange={(t) => {
              setText2(t);
              saveRewriteDraft(attemptId, questionId, 2, t);
            }}
            onBlur={() => sendRewriteDraftBeacon(attemptId, questionId, 2, text2Ref.current)}
            onSubmit={() => {
              if (!text2.trim() || busy) return;
              setSubmittingPhase(2);
              onGrade(2, text2.trim());
            }}
            busy={busy}
          />
        </>
      ) : (
        <>
          <RewriteStepTracker />
          <PlainEnglishBlock sentence={prompt} />
          <div className="rw-field">
            <div className="rw-writing-head">
              <label className="rw-writing-title" htmlFor="rw-write">
                Rewrite it in economics language
              </label>
              <span className="rw-writing-help">Use the precise terms an HSC marker looks for</span>
            </div>
            <textarea
              id="rw-write"
              className="rw-textarea"
              value={text1}
              onChange={(e) => {
                setText1(e.target.value);
                saveRewriteDraft(attemptId, questionId, 1, e.target.value);
              }}
              onBlur={() => sendRewriteDraftBeacon(attemptId, questionId, 1, text1Ref.current)}
              placeholder="Write your sentence here…"
              rows={3}
            />
            <div className="answer-bar">
              <div className="rw-meter">
                <div className="rw-meter-bar" aria-hidden="true">
                  <div
                    className={`rw-meter-fill${countWords(text1) > WORD_LIMIT ? " over" : ""}`}
                    style={{ width: `${Math.min(100, (countWords(text1) / WORD_LIMIT) * 100)}%` }}
                  />
                </div>
                <span className={`rw-meter-count${countWords(text1) > WORD_LIMIT ? " over" : ""}`}>
                  {countWords(text1)} / {WORD_LIMIT} words
                  {countWords(text1) > WORD_LIMIT ? " · over the limit — you lose the conciseness mark" : ""}
                </span>
              </div>
              <button
                type="button"
                className="rw-btn"
                onClick={() => {
                  if (!text1.trim() || busy) return;
                  setSubmittingPhase(1);
                  onGrade(1, text1.trim());
                }}
                disabled={busy || !text1.trim()}
              >
                {busy ? "Marking…" : "Submit for marking"}
                <ArrowIcon />
              </button>
            </div>
          </div>
          <p className="rw-divider">
            <InfoIcon />
            {"Miss a term? You'll get one retry with hints, worth up to 2 marks."}
          </p>
        </>
      )}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="rw-spinner"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 5 L19 12 L5 19" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}
