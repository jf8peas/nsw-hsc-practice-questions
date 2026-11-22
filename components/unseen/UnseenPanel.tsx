"use client";

import { useEffect, useRef, useState } from "react";

import { MarkingStatus, type MarkingStep } from "@/components/rewrite/MarkingStatus";
import { loadRewriteDraft, saveRewriteDraft, sendRewriteDraftBeacon } from "@/lib/drafts";
import { reloadPage } from "@/lib/navigation";
import { savePick, sendPickBeacon } from "@/lib/comparative/client";
import { isCompletePick, tabOrder } from "@/lib/comparative/pick";
import type { ComparativeState } from "@/lib/comparative/types";
import type { ComparativeQuestion, UnseenQuestion } from "@/lib/types";
import { lengthState } from "@/lib/unseen/limits";
import { UNSEEN_REPEAT_NOTICE } from "@/lib/unseen/notices";
import { missedSkills } from "@/lib/unseen/scoring";
import type { ComparativeSkillId } from "@/lib/unseen/skills";
import type { NotMarked, TryView, UnseenDiscussion, UnseenEnding, UnseenGradeResult, UnseenState } from "@/lib/unseen/types";

import { countWords } from "@/lib/wordcount";

import { DeclineButton, Discussion, FirstTryCollapsed, ResultCard, RetryChoice, TipCards } from "./Results";
import { PickChips } from "./PickChips";
import { TextPanel } from "./Text";
import { TextTabs } from "./TextTabs";
import { AnswerBox, LockedAnswer, MarkingFooter, NotMarkedNotice, QuestionBlock } from "./Writing";

// The unseen-text question card (spec 008, data-model.md §5, research R12): writing, marking the first
// try, the result with the retry choice, the retry with its tip cards, marking the retry, and the
// discussion. The submitted text is never cleared: `text1` and `text2` are kept, so any failure returns
// an editable box holding the same text. Marking is never restored on a reload; the server tells the
// card which stage to start in. There is no self-marking anywhere in this component.
//
// Spec 009 reuses this card for a comparative question: its texts in tabs (TextTabs), the pick chips on a
// choice question (saved at once, fixed on the first submit, read-only after), nine skills, and the same
// states. Nothing else differs, so the two units cannot drift.

type Stage = "writing" | "marking1" | "result" | "retrying" | "marking2" | "discussion";
type Notice = { reason: NotMarked["reason"]; resetsAt?: string } | null;

const GENERIC_ERROR = "Marking didn’t work this time. Your answer is still here, so try again.";
const OFFLINE_ERROR = "Could not reach the server. Your answer is still here, so check your connection and try again.";
const STEP_DELAYS_MS = [1500, 8000, 25000];

const json = { "content-type": "application/json" };

const tryFrom = (r: UnseenGradeResult, text: string): TryView => ({
  text,
  mark: r.marksAwarded,
  skills: r.skills,
  feedback: r.feedback,
  biggestGap: r.biggestGap,
  goFurther: r.goFurther ?? null,
  wordCount: r.wordCount,
});

export function UnseenPanel({
  attemptId,
  attemptToken,
  unitId,
  uid,
  question,
  state,
  onFinish,
}: {
  attemptId: string;
  attemptToken: string;
  unitId: string;
  /** The signed-in student, so highlights are kept per student on this device. */
  uid: string;
  question: UnseenQuestion | ComparativeQuestion;
  state: UnseenState | ComparativeState;
  onFinish: () => void;
}) {
  const questionId = question.id;
  const comparative = question.type === "comparative" ? question : null;
  const cState = "texts" in state ? state : null;
  const choice = comparative?.choice ?? null;
  const suggested = question.suggestedWords;

  const [stage, setStage] = useState<Stage>(
    state.stage === "write" ? "writing" : state.stage === "choice" ? "result" : state.stage === "retry" ? "retrying" : "discussion",
  );
  const [text1, setText1] = useState<string>(
    () => loadRewriteDraft(attemptId, questionId, 1) || state.draft1 || state.try1?.text || "",
  );
  // the retry box starts from the first try (FR-020); a saved retry draft wins
  const [text2, setText2] = useState<string>(() =>
    state.stage === "retry" || state.stage === "choice"
      ? loadRewriteDraft(attemptId, questionId, 2) || state.draft2 || state.try1?.text || ""
      : (state.try2?.text ?? ""),
  );
  const [try1, setTry1] = useState<TryView | null>(state.try1 ?? null);
  const [try2, setTry2] = useState<TryView | null>(state.try2 ?? null);
  // the pick on a choice question: saved with the draft, fixed once the first try is submitted
  const [pick, setPick] = useState<string[]>(cState?.pick ?? []);
  const [pickLocked, setPickLocked] = useState<boolean>(cState?.pickLocked ?? false);
  const [retryOffered, setRetryOffered] = useState<boolean>(state.retryOffered ?? true);
  const [ending, setEnding] = useState<UnseenEnding | undefined>(state.ending);
  const [recorded, setRecorded] = useState<number>(state.recordedMark ?? 0);
  const [discussion, setDiscussion] = useState<(UnseenDiscussion & { pairing?: string[] }) | undefined>(state.discussion);
  const [notice, setNotice] = useState<Notice>(state.dailyLimit ? { reason: "daily_limit", resetsAt: state.dailyLimit.resetsAt } : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingStep, setMarkingStep] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const pickRef = useRef(pick);
  pickRef.current = pick;
  const text1Ref = useRef(text1);
  const text2Ref = useRef(text2);
  text1Ref.current = text1;
  text2Ref.current = text2;
  const summaryRef = useRef<HTMLDivElement>(null);
  const retryRef = useRef<HTMLTextAreaElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const focusRetry = useRef(false);

  const marking = stage === "marking1" || stage === "marking2";
  const limitReached = notice?.reason === "daily_limit";

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  // the cosmetic, timed marking steps; one marking request sits behind them (spec 006 R8)
  useEffect(() => {
    if (!marking) return;
    setMarkingStep(0);
    const timers = STEP_DELAYS_MS.map((ms, i) => window.setTimeout(() => setMarkingStep(i + 1), ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [marking]);

  // focus (FR-047): the result or discussion summary when it appears; the retry box (caret at the end)
  // when the retry opens; the plain notice when a try comes back unmarked
  useEffect(() => {
    if (stage === "result" || stage === "discussion") summaryRef.current?.focus();
    if (stage === "retrying" && focusRetry.current) {
      focusRetry.current = false;
      const el = retryRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  }, [stage]);
  useEffect(() => {
    if (notice) noticeRef.current?.focus();
  }, [notice]);

  // the pick is saved as soon as it is complete or changed (debounced), so a resume restores it
  useEffect(() => {
    if (!choice || pickLocked || !isCompletePick(choice, pick)) return;
    const timer = window.setTimeout(() => void savePick({ attemptId, attemptToken, questionId, pick }), 400);
    return () => window.clearTimeout(timer);
  }, [choice, pick, pickLocked, attemptId, attemptToken, questionId]);

  // drafts reach the server when the page is hidden (the draft route ignores already-marked tries)
  useEffect(() => {
    const send = () => {
      if (choice && !pickLocked && stage === "writing" && isCompletePick(choice, pickRef.current)) {
        sendPickBeacon({ attemptId, attemptToken, questionId, pick: pickRef.current });
      }
      if (stage === "writing" || stage === "marking1") sendRewriteDraftBeacon(attemptId, questionId, 1, text1Ref.current);
      else if (stage === "retrying" || stage === "marking2") sendRewriteDraftBeacon(attemptId, questionId, 2, text2Ref.current);
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
  }, [attemptId, attemptToken, questionId, stage, choice, pickLocked]);

  function changeText(phase: 1 | 2, value: string) {
    if (phase === 1) setText1(value);
    else setText2(value);
    saveRewriteDraft(attemptId, questionId, phase, value);
  }
  const blurBeacon = (phase: 1 | 2) => sendRewriteDraftBeacon(attemptId, questionId, phase, phase === 1 ? text1Ref.current : text2Ref.current);

  function fail(phase: 1 | 2, message: string) {
    setError(message);
    setStage(phase === 1 ? "writing" : "retrying");
  }

  /** Apply a grade (or decline) result to the card. */
  function apply(result: UnseenGradeResult, text: string) {
    setError(null);
    setNotice(null);
    if (choice) {
      setPickLocked(true); // the pick is fixed from the first marked try on
      if (result.pick && comparative) setPick(tabOrder(comparative, result.pick));
    }
    if (result.ending) {
      // final: full marks, a question with no retry, a marked retry, or a declined retry
      const t1 = result.phase === 2 ? (result.try1 ?? try1!) : (result.try1 ?? tryFrom(result, text));
      setTry1(t1);
      setTry2(result.phase === 2 ? tryFrom(result, text) : null);
      setEnding(result.ending);
      setRecorded(result.recordedMark ?? t1.mark);
      setDiscussion(result.discussion);
      saveRewriteDraft(attemptId, questionId, 1, "");
      saveRewriteDraft(attemptId, questionId, 2, "");
      setStage("discussion");
      return;
    }
    // try 1 below full marks: the result, then the retry choice
    const t1 = tryFrom(result, text);
    setTry1(t1);
    setRetryOffered(result.retryOffered ?? true);
    saveRewriteDraft(attemptId, questionId, 1, "");
    setText2(loadRewriteDraft(attemptId, questionId, 2) || text);
    setStage("result");
  }

  const pickReady = !choice || pickLocked || isCompletePick(choice, pick);

  async function submit(phase: 1 | 2) {
    const text = phase === 1 ? text1 : text2;
    const fit = lengthState(countWords(text), suggested);
    if (!text.trim() || marking || limitReached || fit === "short" || fit === "over") return;
    if (phase === 1 && !pickReady) return;
    setError(null);
    setNotice(null);
    setStage(phase === 1 ? "marking1" : "marking2");
    let res: Response;
    try {
      res = await fetch("/api/grade", {
        method: "POST",
        headers: json,
        // a choice question's first try carries the pick; the retry uses the first try's, stored on the server
        body: JSON.stringify({ attemptId, attemptToken, questionId, answer: text, phase, ...(choice && phase === 1 ? { pick } : {}) }),
      });
    } catch {
      fail(phase, OFFLINE_ERROR);
      return;
    }
    const data = await res.json().catch(() => null);
    if (res.status === 409) {
      reloadPage(); // another tab or a double tap already marked it: show the stored result
      return;
    }
    if (res.status === 429) {
      fail(phase, "You’re marking too fast. Wait a moment, then try again. Your answer is still here.");
      return;
    }
    if (res.ok && data?.notMarked) {
      const nm = data.notMarked as NotMarked;
      setNotice({ reason: nm.reason, resetsAt: nm.resetsAt });
      setStage(phase === 1 ? "writing" : "retrying");
      return;
    }
    if (!res.ok || !data?.result) {
      fail(phase, GENERIC_ERROR);
      return;
    }
    apply(data.result as UnseenGradeResult, text);
  }

  async function decline() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/unseen/decline", {
        method: "POST",
        headers: json,
        body: JSON.stringify({ attemptId, attemptToken, questionId }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 409) {
        reloadPage();
        return;
      }
      if (res.ok && data?.result) apply(data.result as UnseenGradeResult, text1);
      else setError(GENERIC_ERROR);
    } catch {
      setError(OFFLINE_ERROR);
    } finally {
      setBusy(false);
    }
  }

  function startRetry() {
    focusRetry.current = true;
    setError(null);
    setStage("retrying");
  }

  // ---- pieces ---------------------------------------------------------------------------------
  const steps: MarkingStep[] = [
    { label: "Reading your answer", state: "done" },
    { label: `Comparing it with the ${comparative ? "nine" : "seven"} skills…`, state: markingStep >= 1 ? (markingStep >= 2 ? "done" : "active") : "pending" },
    { label: "Writing your feedback", state: markingStep >= 2 ? (markingStep >= 3 ? "done" : "active") : "pending" },
    ...(markingStep >= 3 ? ([{ label: "Still working on it…", state: "active" }] as MarkingStep[]) : []),
  ];
  const announced = steps.slice().reverse().find((s) => s.state === "active")?.label ?? steps[0].label;

  const noticeEl = notice ? <NotMarkedNotice reason={notice.reason} resetsAt={notice.resetsAt} noticeRef={noticeRef} /> : null;
  const errorEl = error ? (
    <div className="un-error" role="alert">
      {error}
    </div>
  ) : null;
  const missedOnFirst: ComparativeSkillId[] = try1
    ? missedSkills(Object.fromEntries(try1.skills.map((s) => [s.id, { met: s.met, reason: s.reason }])) as never)
    : [];

  return (
    <div className="rw-card un-card">
      {cState ? (
        <TextTabs texts={cState.texts} unitId={unitId} attemptId={attemptId} uid={uid} final={stage === "discussion"} picked={choice && (pickLocked || stage !== "writing") ? pick : undefined} />
      ) : (
        <TextPanel
          text={(state as UnseenState).text}
          openHref={`/unit/${unitId}/text/${(state as UnseenState).text.id}?attempt=${attemptId}`}
          highlight={{ userId: uid, attemptId, final: stage === "discussion" }}
        />
      )}
        <div className="un-main">
          {state.repeating && stage !== "discussion" && (
            <p className="pg-notice un-repeat" role="status">
              {UNSEEN_REPEAT_NOTICE}
            </p>
          )}
          <Steps stage={stage} first={try1?.mark} maxMarks={question.maxMarks} />
          <QuestionBlock question={question} />
          {choice && cState && (
            <PickChips texts={cState.texts} choice={choice} pick={pick} locked={pickLocked || stage !== "writing"} onChange={setPick} />
          )}

          {stage === "writing" && (
            <>
              {noticeEl}
              {errorEl}
              <AnswerBox
                id="un-answer-1"
                label="Your answer"
                value={text1}
                onChange={(t) => changeText(1, t)}
                onBlur={() => blurBeacon(1)}
                onSubmit={() => void submit(1)}
                suggestedWords={suggested}
                limitReached={limitReached}
                blockedNote={pickReady ? undefined : choice && choice.pick === 1 ? "Choose a text to write about, then you can submit." : "Choose the texts to write about, then you can submit."}
              />
            </>
          )}

          {stage === "marking1" && (
            <>
              <LockedAnswer label="Your answer" text={text1} suggested={suggested} progress reducedMotion={reducedMotion} />
              <MarkingStatus steps={steps} announced={announced} />
              <MarkingFooter note="Marking can take up to a minute." />
            </>
          )}

          {stage === "result" && try1 && (
            <>
              <ResultCard label="Your first try" result={try1} maxMarks={question.maxMarks} summaryRef={summaryRef} />
              {errorEl}
              {retryOffered && <RetryChoice maxMarks={question.maxMarks} onRetry={startRetry} onDecline={() => void decline()} busy={busy} />}
            </>
          )}

          {stage === "retrying" && try1 && (
            <>
              <FirstTryCollapsed try1={try1} maxMarks={question.maxMarks} />
              <TipCards missed={missedOnFirst} />
              {noticeEl}
              {errorEl}
              <AnswerBox
                id="un-answer-2"
                label="Your retry"
                value={text2}
                onChange={(t) => changeText(2, t)}
                onBlur={() => blurBeacon(2)}
                onSubmit={() => void submit(2)}
                suggestedWords={suggested}
                textareaRef={retryRef}
                limitReached={limitReached}
                extraNote="Starts from your first try. Edit it, then submit."
              />
              <DeclineButton onDecline={() => void decline()} busy={busy} />
            </>
          )}

          {stage === "marking2" && (
            <>
              <LockedAnswer label="Your retry" text={text2} suggested={suggested} progress reducedMotion={reducedMotion} />
              <MarkingStatus steps={steps} announced={announced} />
              <MarkingFooter note="Marking can take up to a minute." />
            </>
          )}

          {stage === "discussion" && try1 && ending && discussion && (
            <Discussion
              maxMarks={question.maxMarks}
              try1={try1}
              try2={try2}
              ending={ending}
              recorded={recorded}
              discussion={discussion}
              pairingNote={choice && discussion.pairing ? `This model answer shows one possible pairing (${discussion.pairing.map((id) => cState?.texts.find((t) => t.id === id)?.heading ?? id).join(" and ")}). Any allowed pairing can earn full marks.` : undefined}
              onFinish={onFinish}
              summaryRef={summaryRef}
            />
          )}
        </div>
    </div>
  );
}

/** Write / Retry / Discuss, as the rewrite tracker. A full-mark or no-retry question skips Retry. */
function Steps({ stage, first, maxMarks }: { stage: Stage; first?: number; maxMarks: number }) {
  const writeDone = stage !== "writing" && stage !== "marking1";
  const retryDone = stage === "discussion";
  const hideRetry = stage === "discussion" && first !== undefined && first >= maxMarks;
  return (
    <ol className="rw-steps" aria-label="Steps">
      <li className={`rw-step ${writeDone ? "done" : "current"}`} aria-current={writeDone ? undefined : "step"}>
        <span className="rw-step-dot">{writeDone ? "✓" : "1"}</span>
        {writeDone && first !== undefined ? `Write · ${first}/${maxMarks}` : "Write"}
      </li>
      {!hideRetry && (
        <>
          <li aria-hidden="true" className="rw-step-rule" />
          <li
            className={`rw-step ${retryDone ? "done" : stage === "retrying" || stage === "marking2" || stage === "result" ? "current" : ""}`}
            aria-current={stage === "retrying" || stage === "marking2" ? "step" : undefined}
          >
            <span className="rw-step-dot">{retryDone ? "✓" : "2"}</span>
            Retry
          </li>
        </>
      )}
      <li aria-hidden="true" className="rw-step-rule" />
      <li className={`rw-step ${stage === "discussion" ? "current" : ""}`} aria-current={stage === "discussion" ? "step" : undefined}>
        <span className="rw-step-dot">3</span>
        Discuss
      </li>
    </ol>
  );
}

