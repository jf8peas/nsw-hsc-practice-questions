"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Formula } from "@/components/Formula";
import {
  clearDraft,
  clearGraded,
  loadAttemptPayload,
  loadDraft,
  loadGraded,
  saveAttemptPayload,
  saveDraft,
  saveGraded,
  type AttemptPayload,
  type GradedState,
} from "@/lib/drafts";
import type { AlreadyAnswered, GradeResponse, GradeResult } from "@/lib/grading";
import { reloadPage } from "@/lib/navigation";
import { enqueueReceipt, flushOutbox, pendingCount, sendReceipt } from "@/lib/outbox";
import { startAttempt } from "@/lib/startAttempt";
import { formatResetMessage } from "@/lib/sydney";

type Answered = Record<string, { marks: number; max: number }>;

const FLUSH_INTERVAL_MS = 10_000;

export function Quiz({
  uid,
  attemptId,
  unitId,
  initial,
}: {
  uid: string;
  attemptId: string;
  unitId: string;
  /** Loaded by the server. Null when the database was unavailable: run from sessionStorage. */
  initial: AttemptPayload | null;
}) {
  const router = useRouter();
  const [payload, setPayload] = useState<AttemptPayload | null>(initial);
  const [loaded, setLoaded] = useState(initial !== null);
  const [answered, setAnswered] = useState<Answered>(initial?.answered ?? {});

  const questions = useMemo(() => payload?.questions ?? [], [payload]);
  const total = questions.length;
  const passMark = payload?.passMark ?? 70;

  const [i, setI] = useState(() =>
    initial ? firstUnanswered(initial.questions, initial.answered) : 0,
  );
  const [phase, setPhase] = useState<"quiz" | "results">(
    initial && firstUnanswered(initial.questions, initial.answered) >= initial.questions.length
      ? "results"
      : "quiz",
  );
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graded, setGraded] = useState<GradedState | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [pending, setPending] = useState(0);
  const [lost, setLost] = useState(0);

  const current = questions[i];
  const maxTotal = questions.reduce((s, q) => s + q.maxMarks, 0);
  const attemptToken = payload?.attemptToken ?? "";
  const signInHref = () =>
    `/signin?callbackUrl=${encodeURIComponent(
      typeof window === "undefined" ? `/unit/${unitId}` : window.location.pathname + window.location.search,
    )}`;

  // ---- start-up: merge what this tab already knows, or load the offline attempt --
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const stored = loadAttemptPayload(attemptId);
    if (initial) {
      // Marks saved only locally (the save is still queued) must not be forgotten.
      const merged: Answered = { ...(stored?.answered ?? {}), ...initial.answered };
      if (Object.keys(merged).length !== Object.keys(initial.answered).length) {
        setAnswered(merged);
        const next = firstUnanswered(initial.questions, merged);
        setI(next);
        if (next >= initial.questions.length) setPhase("results");
      }
    } else if (stored) {
      setPayload(stored);
      setAnswered(stored.answered);
      const next = firstUnanswered(stored.questions, stored.answered);
      setI(next);
      setPhase(next >= stored.questions.length ? "results" : "quiz");
    }
    setLoaded(true);
    setPending(pendingCount(uid));
  }, [attemptId, initial, uid]);

  // keep the offline copy of this attempt current
  useEffect(() => {
    if (!payload) return;
    saveAttemptPayload(attemptId, { ...payload, answered });
  }, [attemptId, payload, answered]);

  // restore the typed answer and any pending grade/self-mark step for this question
  useEffect(() => {
    if (!loaded || !current) return;
    const g = loadGraded(attemptId, current.id);
    setGraded(g);
    setDraft(g ? g.answer : loadDraft(attemptId, current.id));
    setError(null);
  }, [loaded, attemptId, current]);

  // ---- retry outbox: unsaved results are re-sent in the background -----------
  const flush = useCallback(async () => {
    const result = await flushOutbox(uid, sendReceipt);
    setPending(result.pending);
    if (result.lost > 0) setLost((n) => n + result.lost);
  }, [uid]);

  useEffect(() => {
    if (!loaded) return;
    void flush();
    const timer = window.setInterval(() => void flush(), FLUSH_INTERVAL_MS);
    const onOnline = () => void flush();
    window.addEventListener("online", onOnline);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
    };
  }, [loaded, flush]);

  function queueReceipt(receipt: string | undefined) {
    if (!receipt) return;
    const queued = enqueueReceipt(uid, receipt);
    setPending(queued.pending);
    if (queued.lost > 0) setLost((n) => n + queued.lost);
  }

  // ---- a result is final: remember the mark ---------------------------------
  function recordMarks(questionId: string, marks: number, max: number) {
    setAnswered((a) => ({ ...a, [questionId]: { marks, max } }));
  }

  function updateGraded(next: GradedState) {
    setGraded(next);
    if (current) saveGraded(attemptId, current.id, next);
  }

  async function grade(answer: string, displayIndex?: number) {
    if (!current) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, attemptToken, questionId: current.id, answer }),
      });

      if (res.status === 401) {
        setSessionEnded(true); // the typed answer is already saved in this tab (FR-028)
        return;
      }
      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        const wait = typeof body.retryAfter === "number" ? ` Try again in about ${body.retryAfter}s.` : "";
        setError(`You're submitting answers too fast.${wait}`);
        return;
      }
      if (res.status === 409) {
        // Already answered (for example this attempt is open on another device):
        // show the stored mark and carry on.
        const body: AlreadyAnswered = await res.json();
        const result = body.result as GradeResult;
        recordMarks(current.id, result.marksAwarded ?? 0, result.maxMarks);
        clearDraft(attemptId, current.id);
        updateGraded({ answer, result, marks: result.marksAwarded ?? 0, pickedDisplay: displayIndex });
        return;
      }
      if (res.status === 400) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "invalid_attempt_token") {
          // the token expired: reload for a fresh one (the draft survives in this tab)
          reloadPage();
          return;
        }
      }
      if (!res.ok) throw new Error(`Grader returned ${res.status}`);

      const data: GradeResponse = await res.json();
      queueReceipt(data.receipt);
      clearDraft(attemptId, current.id);
      const marks = data.result.needsSelfMark ? null : data.result.marksAwarded;
      if (marks !== null) recordMarks(current.id, marks, data.result.maxMarks);
      updateGraded({
        answer,
        result: data.result,
        selfMarkToken: data.selfMarkToken,
        aiUnavailable: data.aiUnavailable,
        aiLimit: data.aiLimit,
        marks,
        pickedDisplay: displayIndex,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function selfMark(correct: boolean) {
    if (!current || !graded?.selfMarkToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/results/self-mark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          attemptId,
          attemptToken,
          questionId: current.id,
          answer: graded.answer,
          correct,
          token: graded.selfMarkToken,
        }),
      });
      if (res.status === 401) {
        setSessionEnded(true);
        return;
      }
      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        const marks = typeof body.result?.marksAwarded === "number" ? body.result.marksAwarded : 0;
        recordMarks(current.id, marks, current.maxMarks);
        updateGraded({ ...graded, marks });
        return;
      }
      if (res.status === 400) {
        // the self-mark step expired: let the student submit the answer again
        clearGraded(attemptId, current.id);
        setGraded(null);
        setDraft(graded.answer);
        saveDraft(attemptId, current.id, graded.answer);
        setError("That step timed out. Please submit your answer again");
        return;
      }
      if (!res.ok) throw new Error(`Could not save your mark (${res.status})`);
      const body: { receipt?: string } = await res.json();
      queueReceipt(body.receipt);
      const marks = correct ? current.maxMarks : 0;
      recordMarks(current.id, marks, current.maxMarks);
      updateGraded({ ...graded, marks });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function selectMc(displayIndex: number) {
    if (graded || busy) return;
    void grade(String(displayIndex), displayIndex);
  }

  function submitShort() {
    if (graded || busy || !draft.trim()) return;
    void grade(draft.trim());
  }

  function onDraftChange(text: string) {
    setDraft(text);
    if (current) saveDraft(attemptId, current.id, text);
  }

  function next() {
    if (!current) return;
    clearGraded(attemptId, current.id);
    if (i >= total - 1) {
      setPhase("results");
      return;
    }
    setI(i + 1);
    setGraded(null);
    setDraft("");
    setError(null);
  }

  async function retry() {
    setBusy(true);
    setError(null);
    const result = await startAttempt(unitId);
    if (result.ok) {
      router.push(`/unit/${unitId}/quiz?attempt=${result.attemptId}`);
      return;
    }
    setError(result.error);
    setBusy(false);
  }

  // ---- banners ----------------------------------------------------------
  const banners = (
    <>
      {sessionEnded && (
        <div className="notice" role="alert">
          Your session has ended. <a href={signInHref()}>Sign in to continue</a>. Your answer is
          saved in this tab.
        </div>
      )}
      {lost > 0 && (
        <div className="notice warn" role="alert">
          A result could not be saved to your account.{" "}
          <button className="link-btn" onClick={() => setLost(0)}>
            Dismiss
          </button>
        </div>
      )}
      {pending > 0 && lost === 0 && (
        <div className="notice quiet" aria-live="polite">
          Saving {pending === 1 ? "1 result" : `${pending} results`}…
        </div>
      )}
    </>
  );

  // ---- not ready ---------------------------------------------------------
  if (!loaded) return <p className="page-sub">Loading…</p>;
  if (!payload) {
    return (
      <div className="rd-card" style={{ padding: 20 }}>
        <p style={{ marginTop: 0 }}>The quiz can&apos;t be loaded right now. Go back and start again.</p>
        <Link href={`/unit/${unitId}`} className="rd-btn">
          Back to unit
        </Link>
      </div>
    );
  }

  // ---- results view -------------------------------------------------------
  if (phase === "results") {
    const scored = questions.reduce((s, q) => s + (answered[q.id]?.marks ?? 0), 0);
    const finalPct = maxTotal > 0 ? Math.round((scored / maxTotal) * 100) : 0;
    const passed = finalPct >= passMark;
    return (
      <>
        {banners}
        <h1 className="page-h1" style={{ fontSize: 24, margin: "4px 0 20px" }}>
          Quiz complete
        </h1>

        <div className="rd-card result-card">
          <div className="result-score">
            {scored}/{maxTotal}
          </div>
          <div className="result-pct">{finalPct}% marks</div>
          <span className={`rd-pill ${passed ? "success" : "warn"}`}>
            {passed ? "Pass" : "Keep practising"}
          </span>
        </div>

        <div className="breakdown">
          {questions.map((q) => {
            const got = answered[q.id]?.marks ?? 0;
            const max = q.maxMarks;
            const full = got >= max;
            return (
              <div className="breakdown-row" key={q.id}>
                <span className={`mark ${full ? "ok" : "no"}`}>
                  {full ? "✓" : got > 0 ? "◑" : "✕"}
                </span>
                <span className="q">
                  {q.formula ? <Formula tex={q.formulaTex}>{q.formula}</Formula> : q.prompt}
                </span>
                <span className="quiz-counter">
                  {got}/{max}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ color: "var(--rd-danger-500)", fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}
        <div className="row-actions">
          <Link href={`/unit/${unitId}`} className="rd-btn">
            Back to unit
          </Link>
          <button className="rd-btn primary" style={{ fontWeight: 600 }} onClick={retry} disabled={busy}>
            {busy ? "Starting…" : "Retry quiz"}
          </button>
        </div>
      </>
    );
  }

  // ---- quiz view ------------------------------------------------------------
  if (!current) return null;
  const q = current;
  const isShort = q.type === "short";
  const result = graded?.result ?? null;
  const marks = graded?.marks ?? null;
  const canNext = result !== null && marks !== null;
  const aiNote = graded?.aiUnavailable
    ? "AI marking is unavailable right now. Mark this one yourself."
    : graded?.aiLimit
      ? formatResetMessage(new Date()) // "AI marking is paused until midnight Sydney time (Tue 27 Oct). Mark this one yourself."
      : null;

  return (
    <>
      {banners}
      <div className="progress">
        {questions.map((x, idx) => (
          <div key={x.id} className={`dot ${idx <= i ? "on" : ""}`} />
        ))}
      </div>

      <div className="quiz-topline">
        <span className={`rd-pill ${isShort ? "blue" : ""}`}>
          {q.group === "essay" ? "Essay scaffold" : isShort ? "Short answer" : "Multiple choice"}
          {" · "}
          {q.maxMarks} {q.maxMarks === 1 ? "mark" : "marks"}
        </span>
        <span className="quiz-counter">
          Question {i + 1} of {total}
        </span>
      </div>

      <div className="rd-card q-card">
        {q.formula && (
          <>
            <div className="q-formula-label">Formula</div>
            <div className="q-formula">
              <Formula tex={q.formulaTex}>{q.formula}</Formula>
            </div>
          </>
        )}
        <div className="q-prompt">{q.prompt}</div>
        {q.source && <div className="q-source">Source: {q.source}</div>}

        {q.diagramSvg && (
          <div
            className="q-diagram"
            role="img"
            aria-label={q.diagramAlt ?? "Diagram"}
            dangerouslySetInnerHTML={{ __html: q.diagramSvg }}
          />
        )}

        {isShort ? (
          <>
            <textarea
              className={`q-textarea${q.maxMarks >= 5 ? " tall" : ""}`}
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder="Type your answer here..."
              disabled={result !== null}
            />

            {result === null ? (
              <button
                className="rd-btn"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={submitShort}
                disabled={busy || !draft.trim()}
              >
                {busy ? "Marking…" : "Submit answer"}
              </button>
            ) : (
              <>
                {result.feedback && marks !== null && (
                  <div className="feedback">
                    <div className="feedback-score">
                      {marks} / {result.maxMarks} marks
                    </div>
                    <p style={{ margin: "6px 0 0" }}>{result.feedback}</p>
                    {result.rubricMisses && result.rubricMisses.length > 0 && (
                      <ul className="feedback-miss">
                        {result.rubricMisses.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {result.modelAnswer !== undefined && (
                  <div className="model-answer">
                    <div className="label">Model answer</div>
                    {result.modelAnswer}
                    {result.rubric && result.rubric.length > 0 && (
                      <ul>
                        {result.rubric.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    )}
                    {result.notes && (
                      <div style={{ marginTop: 8, fontStyle: "italic" }}>{result.notes}</div>
                    )}
                  </div>
                )}
              </>
            )}

            {result !== null && marks === null && (
              <>
                {aiNote && (
                  <div className="notice" role="status">
                    {aiNote}
                  </div>
                )}
                <div className="self-mark">
                  <button className="wrong" onClick={() => void selfMark(false)} disabled={busy}>
                    I got it wrong
                  </button>
                  <button className="right" onClick={() => void selfMark(true)} disabled={busy}>
                    I got it right
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="mc-list">
            {q.options.map((label, displayIndex) => {
              let cls = "mc-option";
              if (result && result.type === "mc") {
                const correct = result.correctDisplayIndex;
                if (correct === undefined) {
                  if (displayIndex !== graded?.pickedDisplay) cls += " dim";
                } else if (displayIndex === correct) cls += " correct";
                else if (displayIndex === graded?.pickedDisplay) cls += " wrong";
                else cls += " dim";
              }
              return (
                <button
                  key={displayIndex}
                  className={cls}
                  disabled={result !== null || busy}
                  onClick={() => selectMc(displayIndex)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div aria-live="polite">
          {result?.type === "mc" && result.optionExplanation && (
            <div className="explanation">
              <div className="label">Why this is wrong</div>
              {result.optionExplanation}
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: "var(--rd-danger-500)", fontSize: 13, marginTop: 12 }}>
            {error} — try again.
          </div>
        )}
      </div>

      {canNext && (
        <button
          className="rd-btn primary xl"
          style={{ width: "100%", justifyContent: "center", fontWeight: 600 }}
          onClick={next}
        >
          {i + 1 >= total ? "Finish" : "Next question"}
        </button>
      )}
    </>
  );
}

/** Index of the first question with no stored mark (== length when all are answered). */
function firstUnanswered(
  questions: Array<{ id: string }>,
  answered: Record<string, unknown>,
): number {
  const idx = questions.findIndex((q) => !(q.id in answered));
  return idx === -1 ? questions.length : idx;
}
