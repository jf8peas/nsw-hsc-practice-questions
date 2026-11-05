"use client";

import { useEffect, useRef, useState } from "react";

import { loadRewriteDraft, saveRewriteDraft, sendRewriteDraftBeacon } from "@/lib/drafts";
import type {
  CriterionView,
  ParagraphDiscussion,
  ParagraphEnding,
  ParagraphGradeResult,
  ParagraphPhaseView,
  ParagraphState,
} from "@/lib/paragraph/types";
import { LIMITS, partKeyOf } from "@/lib/paragraph/parts";
import type { ParagraphQuestion } from "@/lib/types";
import { countWords } from "@/lib/wordcount";
import { MarkingStatus, type MarkingStep } from "@/components/rewrite/MarkingStatus";

import {
  BriefAndModelCollapsed,
  BriefTable,
  EssayProgressBar,
  EssayQuestionBlock,
  ModelSoFar,
  ParagraphStepTracker,
  PartGuidance,
  PillRow,
} from "./Frame";
import {
  CriterionPills,
  CriterionResults,
  FinalBeside,
  FirstTryCollapsed,
  FlagButton,
  ModelParagraph,
  ResultSummary,
  TipCards,
  TipsAdded,
} from "./Results";
import { CorrectionBox, LockedPart, MarkingFooter, SelfMarkScreen, WriteBox, type Ticks } from "./Writing";

const STEP2_DELAY_MS = 1500;

type Stage = "writing" | "marking1" | "correction" | "marking2" | "selfMark" | "discussion";

const GENERIC_ERROR = "Marking didn’t work this time. Your text is still here, so try again.";
const OFFLINE_ERROR = "Could not reach the server. Your text is still here, so check your connection and try again.";

const json = { "content-type": "application/json" };

function phaseViewFromResult(r: ParagraphGradeResult, text: string): ParagraphPhaseView {
  return { text, mark: r.marksAwarded ?? 0, criteria: r.criteria ?? [], feedback: r.feedback, wordCount: r.wordCount };
}

/**
 * The paragraph question card (spec 007, data-model.md §5): writing, marking the first try,
 * result + correction, marking the correction, discussion, plus the self-mark screen and the
 * discussion variants for FR-019a and the degrade path. The submitted text is never cleared: the
 * local `text1` and `text2` are kept, so a marking error returns an editable box holding the same
 * text. Marking is never restored on a reload; the server tells the card which stage to start in.
 */
export function ParagraphPanel({
  attemptId,
  attemptToken,
  unitId,
  question,
  state,
  onFinish,
}: {
  attemptId: string;
  attemptToken: string;
  unitId: string;
  question: ParagraphQuestion;
  state: ParagraphState;
  onFinish: () => void;
}) {
  const questionId = question.id;
  const { view } = state;
  const partKey = partKeyOf(view.part);
  const limit = LIMITS[partKey];

  const [stage, setStage] = useState<Stage>(
    state.stage === "write" ? "writing" : state.stage === "correct" ? "correction" : "discussion",
  );
  const [text1, setText1] = useState<string>(
    () => loadRewriteDraft(attemptId, questionId, 1) || state.draft1 || state.phase1?.text || "",
  );
  const [text2, setText2] = useState<string>(() =>
    state.stage === "correct"
      ? loadRewriteDraft(attemptId, questionId, 2) || state.draft2 || state.phase1?.text || ""
      : (state.phase2?.text ?? ""),
  );
  const [phase1, setPhase1] = useState<ParagraphPhaseView | null>(state.phase1 ?? null);
  const [phase2, setPhase2] = useState<ParagraphPhaseView | null>(state.phase2 ?? null);
  const [ending, setEnding] = useState<ParagraphEnding | undefined>(state.ending);
  const [recorded, setRecorded] = useState<number>(state.recordedMark ?? 0);
  const [discussion, setDiscussion] = useState<ParagraphDiscussion | undefined>(state.discussion);
  const [mode, setMode] = useState<"marker" | "self_mark">(state.mode ?? "marker");
  const [flagged, setFlagged] = useState<boolean>(state.flagged ?? false);
  const [flagBusy, setFlagBusy] = useState(false);
  const [flagError, setFlagError] = useState<string | null>(null);
  const [selfToken, setSelfToken] = useState<string>("");
  const [ticks, setTicks] = useState<Ticks>({ a: false, b: false, c: false, d: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingStep, setMarkingStep] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const text1Ref = useRef(text1);
  const text2Ref = useRef(text2);
  text1Ref.current = text1;
  text2Ref.current = text2;
  const summaryRef = useRef<HTMLDivElement>(null);
  const firstTickRef = useRef<HTMLInputElement>(null);

  const marking = stage === "marking1" || stage === "marking2";

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  // the cosmetic, timed marking steps; one marking request sits behind them (spec 006 R8)
  useEffect(() => {
    if (!marking) return;
    setMarkingStep(0);
    const t = window.setTimeout(() => setMarkingStep(1), STEP2_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [marking]);

  // focus (FR-022): the result summary on the discussion; the first tick on the self-mark screen
  useEffect(() => {
    if (stage === "discussion") summaryRef.current?.focus();
    if (stage === "selfMark") firstTickRef.current?.focus();
  }, [stage]);

  // drafts reach the server when the page is hidden (the draft route ignores already-marked phases)
  useEffect(() => {
    const send = () => {
      if (phase1 === null) sendRewriteDraftBeacon(attemptId, questionId, 1, text1Ref.current);
      else if (stage === "correction") sendRewriteDraftBeacon(attemptId, questionId, 2, text2Ref.current);
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
  }, [attemptId, questionId, phase1, stage]);

  function changeText(phase: 1 | 2, value: string) {
    if (phase === 1) setText1(value);
    else setText2(value);
    saveRewriteDraft(attemptId, questionId, phase, value);
  }
  const blurBeacon = (phase: 1 | 2) => sendRewriteDraftBeacon(attemptId, questionId, phase, phase === 1 ? text1Ref.current : text2Ref.current);

  function fail(phase: 1 | 2, message: string) {
    setError(message);
    setStage(phase === 1 ? "writing" : "correction");
  }

  /** Apply a grade result to the card. */
  function apply(result: ParagraphGradeResult, phase: 1 | 2, text: string, selfMarkToken?: string) {
    setError(null);
    if (result.needsSelfMark) {
      setSelfToken(selfMarkToken ?? "");
      setDiscussion(result.discussion);
      setMode("self_mark");
      setStage("selfMark");
      return;
    }
    if (result.ending) {
      // final: full marks, a marked correction, or the first-try mark kept (FR-019a)
      const first = result.phase1 ?? phase1 ?? phaseViewFromResult(result, phase === 1 ? text : text1);
      setPhase1(first);
      if (result.ending === "corrected") setPhase2(phaseViewFromResult(result, text));
      setEnding(result.ending);
      setRecorded(result.recordedMark ?? first.mark);
      setDiscussion(result.discussion);
      setMode("marker");
      saveRewriteDraft(attemptId, questionId, 1, "");
      saveRewriteDraft(attemptId, questionId, 2, "");
      setStage("discussion");
      return;
    }
    // phase 1 under 4: the result, the tips and the pre-filled correction box
    setPhase1(phaseViewFromResult(result, text));
    saveRewriteDraft(attemptId, questionId, 1, "");
    setText2(loadRewriteDraft(attemptId, questionId, 2) || text);
    setStage("correction");
  }

  async function submit(phase: 1 | 2) {
    const text = phase === 1 ? text1 : text2;
    if (!text.trim() || marking) return;
    setError(null);
    setStage(phase === 1 ? "marking1" : "marking2");
    let res: Response;
    try {
      res = await fetch("/api/grade", {
        method: "POST",
        headers: json,
        body: JSON.stringify({ attemptId, attemptToken, questionId, answer: text, phase }),
      });
    } catch {
      fail(phase, OFFLINE_ERROR);
      return;
    }
    const data = await res.json().catch(() => null);
    if (res.status === 409 && data?.result) {
      apply(data.result as ParagraphGradeResult, phase, text);
      return;
    }
    if (res.status === 429) {
      fail(phase, "You’re marking too fast. Wait a moment, then try again. Your text is still here.");
      return;
    }
    if (!res.ok || !data?.result) {
      fail(phase, GENERIC_ERROR);
      return;
    }
    apply(data.result as ParagraphGradeResult, phase, text, data.selfMarkToken);
  }

  async function saveSelfMark() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/results/self-mark", {
        method: "POST",
        headers: json,
        body: JSON.stringify({ attemptId, attemptToken, questionId, answer: text1, token: selfToken, phase: 1, ticks }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(GENERIC_ERROR);
        setSaving(false);
        return;
      }
      const criteria: CriterionView[] = (["a", "b", "c", "d"] as const).map((key) => ({ key, met: ticks[key], reason: "" }));
      const mark = data.marksAwarded ?? criteria.filter((c) => c.met).length;
      setPhase1({ text: text1, mark, criteria, feedback: "", wordCount: countWords(text1) });
      setEnding("self_mark");
      setRecorded(data.recordedMark ?? mark);
      if (data.discussion) setDiscussion(data.discussion);
      setMode("self_mark");
      saveRewriteDraft(attemptId, questionId, 1, "");
      setStage("discussion");
    } catch {
      setError(OFFLINE_ERROR);
    }
    setSaving(false);
  }

  async function flag() {
    if (flagged || flagBusy) return;
    setFlagBusy(true);
    setFlagError(null);
    try {
      const res = await fetch("/api/paragraph/flag", {
        method: "POST",
        headers: json,
        body: JSON.stringify({ attemptId, attemptToken, questionId }),
      });
      if (res.ok) setFlagged(true);
      else setFlagError("Could not flag that just now. Try again in a moment.");
    } catch {
      setFlagError(OFFLINE_ERROR);
    }
    setFlagBusy(false);
  }

  // ---- shared pieces --------------------------------------------------------------------------
  const partName = view.partName;
  const progressBar = <EssayProgressBar essayNo={view.essayNo} part={view.part} parts={view.parts} />;
  const pillRow = <PillRow essayNo={view.essayNo} part={view.part} />;
  const questionBlock = (withDefinition: boolean) => (
    <EssayQuestionBlock question={question.prompt} verb={question.verb} definition={withDefinition ? view.verbDefinition : undefined} />
  );

  const steps1: MarkingStep[] = [
    { label: "Read your writing", state: "done" },
    { label: "Checking it against the four criteria…", state: markingStep >= 1 ? "active" : "pending" },
    { label: "Writing your feedback", state: "pending" },
  ];
  const steps2: MarkingStep[] = [
    { label: "Read your correction", state: "done" },
    { label: "Checking it against the four criteria again…", state: markingStep >= 1 ? "active" : "pending" },
    { label: "Writing your feedback", state: "pending" },
  ];
  const steps = stage === "marking1" ? steps1 : steps2;
  const announced = markingStep >= 1 ? steps[1].label : steps[0].label;

  const errorBox = error ? (
    <div className="pg-error" role="alert">
      {error}
    </div>
  ) : null;

  // ---- render ---------------------------------------------------------------------------------
  return (
    <div className="rw-card pg-card">
      {progressBar}
      {pillRow}

      {stage === "writing" && (
        <>
          <ParagraphStepTracker step="write" />
          {questionBlock(true)}
          <PartGuidance lines={view.guidance} />
          <BriefTable brief={view.brief} uses={view.uses} />
          <ModelSoFar earlier={view.earlier} partNo={view.part} partName={partName} />
          {errorBox}
          <WriteBox
            partName={partName}
            limit={limit}
            value={text1}
            onChange={(t) => changeText(1, t)}
            onBlur={() => blurBeacon(1)}
            onSubmit={() => void submit(1)}
            busy={false}
          />
        </>
      )}

      {stage === "marking1" && (
        <>
          <ParagraphStepTracker step="write" />
          {questionBlock(false)}
          <LockedPart label={`Your ${partName}`} text={text1} limit={limit} progress reducedMotion={reducedMotion} />
          <MarkingStatus steps={steps} announced={announced} />
          <BriefAndModelCollapsed view={view} />
          <MarkingFooter note="Usually takes 10–20 seconds." />
        </>
      )}

      {stage === "correction" && phase1 && (
        <>
          <ParagraphStepTracker step="correct" phase1Mark={phase1.mark} />
          {questionBlock(false)}
          <CriterionResults partNo={view.part} phase={phase1} />
          <TipCards partNo={view.part} criteria={phase1.criteria} heading="Fix these in your correction" />
          <BriefAndModelCollapsed view={view} />
          {errorBox}
          <CorrectionBox
            value={text2}
            onChange={(t) => changeText(2, t)}
            onBlur={() => blurBeacon(2)}
            onSubmit={() => void submit(2)}
            busy={false}
            limit={limit}
          />
        </>
      )}

      {stage === "marking2" && phase1 && (
        <>
          <ParagraphStepTracker step="correct" phase1Mark={phase1.mark} />
          {questionBlock(false)}
          <FirstTryCollapsed phase={phase1} />
          <LockedPart label="Your correction" text={text2} limit={limit} progress reducedMotion={reducedMotion} />
          <MarkingStatus steps={steps} announced={announced} />
          <BriefAndModelCollapsed view={view} />
          <MarkingFooter note="Correction is worth up to 3 marks." />
        </>
      )}

      {stage === "selfMark" && discussion && (
        <>
          <ParagraphStepTracker step="write" selfMark />
          {questionBlock(false)}
          <SelfMarkScreen
            partNo={view.part}
            text={text1}
            limit={limit}
            guidance={view.guidance}
            discussion={discussion}
            ticks={ticks}
            onTick={(k, checked) => setTicks((prev) => ({ ...prev, [k]: checked }))}
            onSave={() => void saveSelfMark()}
            busy={saving}
            firstTickRef={firstTickRef}
          />
          {errorBox}
        </>
      )}

      {stage === "discussion" && phase1 && ending && discussion && (
        <>
          <ParagraphStepTracker
            step="discuss"
            phase1Mark={phase1.mark}
            phase2Mark={phase2?.mark}
            skipCorrection={ending === "full_marks" || ending === "no_correction" || ending === "self_mark"}
          />
          <ResultSummary ref={summaryRef} ending={ending} recorded={recorded} phase1={phase1} phase2={phase2 ?? undefined} />
          <CriterionPills
            partNo={view.part}
            phase1={phase1}
            phase2={phase2 ?? undefined}
            heading={phase2 ? "Your correction, criterion by criterion" : "Your part, criterion by criterion"}
            selfMarked={ending === "self_mark"}
            noPills={ending === "no_correction"}
          />
          {ending === "no_correction" && <TipCards partNo={view.part} criteria={phase1.criteria} heading="Work on these next" />}
          {mode === "marker" && <FlagButton flagged={flagged} busy={flagBusy} error={flagError} onFlag={() => void flag()} />}
          <FinalBeside
            partNo={view.part}
            label={phase2 ? "YOUR CORRECTION" : "YOUR PART"}
            text={phase2?.text ?? phase1.text}
            discussion={discussion}
          />
          <ModelParagraph discussion={discussion} />
          <TipsAdded partNo={view.part} criteria={phase1.criteria} />
          {phase2 && <FirstTryCollapsed phase={phase1} />}
          <div className="rw-result-footer">
            <span className="rw-result-footer-line">{nextLabel(discussion)}</span>
            <button type="button" className="rw-btn" onClick={onFinish} data-unit={unitId}>
              Finish
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 5 L19 12 L5 19" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function nextLabel(d: ParagraphDiscussion): string {
  if (d.next.kind === "part") return `Next quiz: Part ${d.next.part} of 5, ${d.next.name}`;
  if (d.next.kind === "essay") return `Next quiz: Essay ${d.next.essayNo}, Part 1 of 5, ${d.next.name}`;
  return "That is every essay for now. New essays are added as they are written.";
}
