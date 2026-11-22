"use client";

import { useEffect, useRef, useState } from "react";

import { MarkingStatus, type MarkingStep } from "@/components/rewrite/MarkingStatus";
import { NotMarkedNotice } from "@/components/unseen/Writing";
import { loadRewriteDraft } from "@/lib/drafts";
import type { EssayScaffold } from "@/lib/essay/scaffold";
import type { EssayNotMarked, EssayResultView, EssayState, PlanReview } from "@/lib/essay/types";

import { EssayBox } from "./EssayBox";
import { EssayResult } from "./Result";
import { ReviewPanel } from "./ReviewPanel";
import { Scaffold } from "./Scaffold";
import { Timer } from "./Timer";
import { EssayHeader, PlanReadout } from "./shared";

// The essay card (spec 010): the plan, the essay and the result are one panel that keeps its own stage. The
// server tells it which stage to start in; marking is never restored after a reload. The submitted essay is never
// cleared: any failure returns an editable box holding the same text. There is no self-marking anywhere here.

type Stage = "scaffold" | "write" | "marking" | "result";

const GENERIC_ERROR = "Marking didn’t work this time. Your essay is still here, so try again.";
const OFFLINE_ERROR = "Could not reach the server. Your essay is still here, so check your connection and try again.";
const STEPS = [
  { label: "Sending your essay", at: 0 },
  { label: "Reading your essay", at: 8000 },
  { label: "Checking each criterion", at: 18000 },
  { label: "Choosing your band", at: 30000 },
  { label: "Almost done", at: 45000 },
];

const json = { "content-type": "application/json" };

export function EssayPanel({
  attemptId,
  attemptToken,
  state,
  onFinish,
}: {
  attemptId: string;
  attemptToken: string;
  state: EssayState;
  onFinish: () => void;
}) {
  const essay = state.essay;
  const [stage, setStage] = useState<Stage>(state.stage === "scaffold" ? "scaffold" : state.stage === "write" ? "write" : "result");
  const [plan, setPlan] = useState<EssayScaffold>(state.scaffold);
  const [review, setReview] = useState<PlanReview | null>(state.review ?? null);
  const [text, setText] = useState<string>(() => loadRewriteDraft(attemptId, essay.id, 1) || state.draft || "");
  const [result, setResult] = useState<EssayResultView | null>(state.result ?? null);
  const [notice, setNotice] = useState<EssayNotMarked | null>(state.cap ? { reason: "daily_limit", resetsAt: state.cap.resetsAt } : null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const noticeRef = useRef<HTMLDivElement>(null);

  // the server's draft wins when this tab has none (a resume on another device)
  useEffect(() => {
    if (!text && state.draft) setText(state.draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // the cosmetic, timed status steps while one marking request runs
  useEffect(() => {
    if (stage !== "marking") return;
    setElapsed(0);
    const start = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(t);
  }, [stage]);

  // after a not-marked return the notice takes focus, so it is announced and the box is within reach
  useEffect(() => {
    if (notice && stage === "write") noticeRef.current?.focus();
  }, [notice, stage]);

  async function submit() {
    setError(null);
    setNotice(null);
    setStage("marking");
    let res: Response;
    try {
      res = await fetch("/api/grade", {
        method: "POST",
        headers: json,
        body: JSON.stringify({ attemptId, attemptToken, questionId: essay.id, answer: text }),
      });
    } catch {
      setStage("write");
      setError(OFFLINE_ERROR);
      return;
    }
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.result) {
      setResult(body.result as EssayResultView);
      setStage("result");
      return;
    }
    if (res.ok && body.notMarked) {
      setNotice(body.notMarked as EssayNotMarked);
      setStage("write");
      return;
    }
    if (res.status === 409 && body?.result) {
      setResult(body.result as EssayResultView);
      setStage("result");
      return;
    }
    setStage("write");
    if (body?.error === "marking_in_progress") setError("Your essay is already being marked. Wait a moment, then reload this page.");
    else if (body?.error === "essay_too_short" || body?.error === "essay_too_long") setError("Your essay needs to be 600 to 800 words.");
    else if (res.status === 429) setError("You’re submitting too fast. Wait a moment and try again.");
    else if (res.status === 401) setError("Your session has ended. Sign in to continue.");
    else setError(GENERIC_ERROR);
  }

  if (stage === "result" && result) {
    return <EssayResult result={result} onBack={onFinish} />;
  }

  if (stage === "scaffold") {
    return (
      <Scaffold
        attemptId={attemptId}
        attemptToken={attemptToken}
        essay={essay}
        initial={state.scaffold}
        onStarted={(locked, made) => {
          setPlan(locked);
          if (made) setReview(made);
          setStage("write");
        }}
      />
    );
  }

  const marking = stage === "marking";
  const activeIndex = STEPS.reduce((acc, s, i) => (elapsed >= s.at ? i : acc), 0);
  const steps: MarkingStep[] = STEPS.map((s, i) => ({ label: s.label, state: i < activeIndex ? "done" : i === activeIndex ? "active" : "pending" }));

  return (
    <div className="es-card">
      <EssayHeader essay={essay} />
      <PlanReadout plan={plan} />
      {review && <ReviewPanel review={review} />}
      <Timer />
      <EssayBox
        attemptId={attemptId}
        attemptToken={attemptToken}
        questionId={essay.id}
        value={text}
        onChange={setText}
        onSubmit={() => void submit()}
        locked={marking}
        limitReached={notice?.reason === "daily_limit"}
      />
      {marking && <MarkingStatus steps={steps} announced={steps[activeIndex]!.label} />}
      {notice && <NotMarkedNotice reason={notice.reason} resetsAt={notice.resetsAt} noticeRef={noticeRef} />}
      {error && (
        <p className="es-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
