"use client";

import { useEffect, useRef, useState } from "react";

import { EssayBox } from "@/components/essay/EssayBox";
import { MarkingStatus, type MarkingStep } from "@/components/rewrite/MarkingStatus";
import { loadRewriteDraft } from "@/lib/drafts";
import { englishEssayCounter } from "@/lib/english-essay/counter";
import type { EnglishEssayNotMarked, EnglishEssayResultView, EnglishEssayScaffold, EnglishEssayState } from "@/lib/english-essay/types";

import { PlanReadout } from "./PlanReadout";
import { EnglishEssayResult } from "./Result";
import { Scaffold } from "./Scaffold";
import { EnglishEssayHeader } from "./shared";

// The English essay card (spec 011): the plan, the essay and the result are one panel that keeps its own stage. The server
// tells it which stage to start in; marking is never restored after a reload. The submitted essay is never cleared: every
// failure returns an editable box holding the same text. There is no self-marking anywhere here and no timer in S1.

type Stage = "scaffold" | "write" | "marking" | "result";

const GENERIC_ERROR = "Marking didn’t work this time. Your essay is still here, so try again.";
const OFFLINE_ERROR = "Could not reach the server. Your essay is still here, so check your connection and try again.";
const STEPS = [
  { label: "Sending your essay", at: 0 },
  { label: "Reading your essay", at: 8000 },
  { label: "Checking your quotations", at: 18000 },
  { label: "Choosing your band", at: 35000 },
  { label: "Almost done", at: 55000 },
];

const json = { "content-type": "application/json" };

/** The three reasons an essay comes back unmarked (never an error, never a mark). */
export function EnglishNotMarkedNotice({ notice, noticeRef }: { notice: EnglishEssayNotMarked; noticeRef?: React.Ref<HTMLDivElement> }) {
  const day = notice.resetsAt ? new Date(notice.resetsAt).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Sydney" }) : "";
  return (
    <div ref={noticeRef} className="un-notice" role="status" tabIndex={-1}>
      {notice.reason === "marker_unavailable" ? (
        <p>We couldn’t mark your essay just now. It’s still here, so try again in a moment.</p>
      ) : notice.reason === "reference_text_unavailable" ? (
        <p>We couldn’t check your quotations against the play just now, so your essay hasn’t been marked. It’s still here, so try again in a moment.</p>
      ) : (
        <p>You’ve reached today’s marking limit. Come back tomorrow{day ? ` (from midnight Sydney time, ${day})` : ""} and your essay will be here.</p>
      )}
    </div>
  );
}

export function EssayPanel({
  attemptId,
  attemptToken,
  state,
  onFinish,
}: {
  attemptId: string;
  attemptToken: string;
  state: EnglishEssayState;
  onFinish: () => void;
}) {
  const essay = state.essay;
  const [stage, setStage] = useState<Stage>(state.stage === "scaffold" ? "scaffold" : state.stage === "write" ? "write" : "result");
  const [plan, setPlan] = useState<EnglishEssayScaffold>(state.scaffold);
  const [text, setText] = useState<string>(() => loadRewriteDraft(attemptId, essay.id, 1) || state.draft || "");
  const [result, setResult] = useState<EnglishEssayResultView | null>(state.result ?? null);
  const [notice, setNotice] = useState<EnglishEssayNotMarked | null>(state.cap ? { reason: "daily_limit", resetsAt: state.cap.resetsAt } : null);
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
      setResult(body.result as EnglishEssayResultView);
      setStage("result");
      return;
    }
    if (res.ok && body.notMarked) {
      setNotice(body.notMarked as EnglishEssayNotMarked);
      setStage("write");
      return;
    }
    if (res.status === 409 && body?.result) {
      setResult(body.result as EnglishEssayResultView);
      setStage("result");
      return;
    }
    setStage("write");
    if (body?.error === "marking_in_progress") setError("Your essay is already being marked. Wait a moment, then reload this page.");
    else if (body?.error === "essay_too_short" || body?.error === "essay_too_long") setError("Your essay needs to be 800 to 1,200 words.");
    else if (res.status === 429) setError("You’re submitting too fast. Wait a moment and try again.");
    else if (res.status === 401) setError("Your session has ended. Sign in to continue.");
    else setError(GENERIC_ERROR);
  }

  if (stage === "result" && result) {
    return <EnglishEssayResult result={result} onBack={onFinish} />;
  }

  if (stage === "scaffold") {
    return (
      <Scaffold
        attemptId={attemptId}
        attemptToken={attemptToken}
        essay={essay}
        initial={state.scaffold}
        onStarted={(locked) => {
          setPlan(locked);
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
      <EnglishEssayHeader essay={essay} />
      <PlanReadout plan={plan} />
      <EssayBox
        attemptId={attemptId}
        attemptToken={attemptToken}
        questionId={essay.id}
        value={text}
        onChange={setText}
        onSubmit={() => void submit()}
        locked={marking}
        limitReached={notice?.reason === "daily_limit"}
        counterOf={englishEssayCounter}
      />
      {marking && <MarkingStatus steps={steps} announced={steps[activeIndex]!.label} />}
      {notice && <EnglishNotMarkedNotice notice={notice} noticeRef={noticeRef} />}
      {error && (
        <p className="es-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
