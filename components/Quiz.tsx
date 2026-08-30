"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Formula } from "@/components/Formula";
import type { GradeResult } from "@/lib/grading";
import { saveScore } from "@/lib/scores";
import type { Question, Unit } from "@/lib/types";

const SHUFFLE_OPTIONS = true;
const DEFAULT_PASS_MARK = 70;

interface Prepared {
  question: Question;
  /** MC only: optionOrder[displayIndex] = originalIndex */
  optionOrder: number[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function prepare(unit: Unit): Prepared[] {
  let chosen: Question[];
  if (unit.quiz?.groups) {
    // Draw n from each named group, in listed order (so quiz order follows it).
    chosen = unit.quiz.groups.flatMap(({ group, n }) =>
      pick(unit.questions.filter((q) => q.group === group), n),
    );
  } else {
    // Short-answer questions first, then multiple choice; random within each.
    const shorts = unit.questions.filter((q) => q.type === "short");
    const mcs = unit.questions.filter((q) => q.type === "mc");
    chosen = unit.quiz
      ? [...pick(shorts, unit.quiz.short), ...pick(mcs, unit.quiz.mc)]
      : [...shuffle(shorts), ...shuffle(mcs)];
  }
  return chosen.map((question) => {
    if (question.type !== "mc") return { question, optionOrder: [] };
    const idx = question.options.map((_, i) => i);
    return { question, optionOrder: SHUFFLE_OPTIONS ? shuffle(idx) : idx };
  });
}

export function Quiz({ unit }: { unit: Unit }) {
  const passMark = unit.quiz?.passMark ?? DEFAULT_PASS_MARK;
  const [runId, setRunId] = useState(0);
  const prepared = useMemo(
    () => prepare(unit),
    // re-prepare (reshuffle) whenever the run is restarted
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unit, runId],
  );

  const [i, setI] = useState(0);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [pickedDisplay, setPickedDisplay] = useState<number | null>(null);
  const [marks, setMarks] = useState<(number | null)[]>(
    () => unit.questions.map(() => null),
  );
  const [phase, setPhase] = useState<"quiz" | "results">("quiz");
  const [finalPct, setFinalPct] = useState(0);

  // access gate (short-answer grading only)
  const [needsCode, setNeedsCode] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const current = prepared[i];
  const total = prepared.length;
  const maxTotal = prepared.reduce((s, p) => s + p.question.maxMarks, 0);

  function resetQuestionState() {
    setDraft("");
    setResult(null);
    setPickedDisplay(null);
    setError(null);
    setBusy(false);
    setNeedsCode(false);
    setCodeError(null);
  }

  async function submitCode() {
    if (codeBusy || !codeInput.trim()) return;
    setCodeBusy(true);
    setCodeError(null);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      });
      if (!res.ok) {
        setCodeError(res.status === 403 ? "Incorrect class code" : "Could not verify code");
        return;
      }
      setNeedsCode(false);
      setCodeInput("");
      if (draft.trim()) void grade(draft.trim());
    } catch {
      setCodeError("Could not verify code");
    } finally {
      setCodeBusy(false);
    }
  }

  async function grade(answer: string, displayIndex?: number) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId: current.question.id, answer }),
      });
      if (res.status === 401) {
        setNeedsCode(true);
        return;
      }
      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        const wait = typeof body.retryAfter === "number" ? ` Try again in about ${body.retryAfter}s.` : "";
        setError(`You're submitting answers too fast.${wait}`);
        return;
      }
      if (!res.ok) throw new Error(`Grader returned ${res.status}`);
      const data: GradeResult = await res.json();
      setNeedsCode(false);
      setResult(data);
      if (displayIndex !== undefined) setPickedDisplay(displayIndex);
      if (!data.needsSelfMark && data.marksAwarded !== null) {
        setMarks((m) => {
          const next = m.slice();
          next[i] = data.marksAwarded;
          return next;
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function selectMc(displayIndex: number) {
    if (result || busy) return;
    const originalIndex = current.optionOrder[displayIndex];
    void grade(String(originalIndex), displayIndex);
  }

  function submitShort() {
    if (result || busy || !draft.trim()) return;
    void grade(draft.trim());
  }

  function selfMark(correct: boolean) {
    setMarks((m) => {
      const next = m.slice();
      next[i] = correct ? current.question.maxMarks : 0;
      return next;
    });
  }

  function next() {
    const isLast = i >= total - 1;
    if (!isLast) {
      setI(i + 1);
      resetQuestionState();
      return;
    }
    const scored = marks.reduce<number>((s, v) => s + (v ?? 0), 0);
    const pct = maxTotal > 0 ? Math.round((scored / maxTotal) * 100) : 0;
    saveScore(unit.id, pct);
    setFinalPct(pct);
    setPhase("results");
  }

  function retry() {
    setI(0);
    setMarks(unit.questions.map(() => null));
    setPhase("quiz");
    setFinalPct(0);
    resetQuestionState();
    setRunId((n) => n + 1);
  }

  // ---- results view -------------------------------------------------
  if (phase === "results") {
    const scored = marks.reduce<number>((s, v) => s + (v ?? 0), 0);
    const passed = finalPct >= passMark;
    return (
      <>
        <h1 className="page-h1" style={{ fontSize: 24, margin: "4px 0 20px" }}>
          Quiz complete
        </h1>

        <div className="rd-card result-card">
          <div className="result-score">
            {scored}/{maxTotal}
          </div>
          <div className="result-pct">{finalPct}% marks</div>
          <span
            className={`rd-pill ${passed ? "success" : "warn"}`}
          >
            {passed ? "Pass" : "Keep practising"}
          </span>
        </div>

        <div className="breakdown">
          {prepared.map((p, idx) => {
            const got = marks[idx] ?? 0;
            const max = p.question.maxMarks;
            const full = got >= max;
            return (
              <div className="breakdown-row" key={p.question.id}>
                <span className={`mark ${full ? "ok" : "no"}`}>
                  {full ? "✓" : got > 0 ? "◑" : "✕"}
                </span>
                <span className="q">
                  {p.question.formula ? (
                    <Formula tex={p.question.formulaTex}>
                      {p.question.formula}
                    </Formula>
                  ) : (
                    p.question.prompt
                  )}
                </span>
                <span className="quiz-counter">
                  {got}/{max}
                </span>
              </div>
            );
          })}
        </div>

        <div className="row-actions">
          <Link href={`/unit/${unit.id}`} className="rd-btn">
            Back to unit
          </Link>
          <button
            className="rd-btn primary"
            style={{ fontWeight: 600 }}
            onClick={retry}
          >
            Retry quiz
          </button>
        </div>
      </>
    );
  }

  // ---- quiz view --------------------------------------------------
  const q = current.question;
  const isShort = q.type === "short";
  const canNext =
    result !== null && (result.type === "mc" || marks[i] !== null);

  return (
    <>
      <div className="progress">
        {prepared.map((p, idx) => (
          <div
            key={p.question.id}
            className={`dot ${idx <= i ? "on" : ""}`}
          />
        ))}
      </div>

      <div className="quiz-topline">
        <span className={`rd-pill ${isShort ? "blue" : ""}`}>
          {isShort ? "Short answer" : "Multiple choice"}
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

        {q.diagramSvg && (
          <div
            className="q-diagram"
            role="img"
            aria-label="Supply and demand diagram"
            dangerouslySetInnerHTML={{ __html: q.diagramSvg }}
          />
        )}

        {isShort ? (
          <>
            <textarea
              className="q-textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your answer here..."
              disabled={result !== null}
            />

            {needsCode ? (
              <div className="model-answer">
                <div className="label">Class code</div>
                <div style={{ marginBottom: 10 }}>
                  Enter the class code your teacher gave you to unlock marking.
                </div>
                <input
                  className="rd-input"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Class code"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submitCode();
                  }}
                />
                <button
                  className="rd-btn"
                  style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                  onClick={submitCode}
                  disabled={codeBusy || !codeInput.trim()}
                >
                  {codeBusy ? "Checking…" : "Unlock marking"}
                </button>
                {codeError && (
                  <div
                    style={{
                      color: "var(--rd-danger-500)",
                      fontSize: 13,
                      marginTop: 8,
                    }}
                  >
                    {codeError}
                  </div>
                )}
              </div>
            ) : result === null ? (
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
                {result.feedback && marks[i] !== null && (
                  <div className="feedback">
                    <div className="feedback-score">
                      {marks[i]} / {result.maxMarks} marks
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
                    <div style={{ marginTop: 8, fontStyle: "italic" }}>
                      {result.notes}
                    </div>
                  )}
                </div>
              </>
            )}

            {result !== null && marks[i] === null && (
              <div className="self-mark">
                <button className="wrong" onClick={() => selfMark(false)}>
                  I got it wrong
                </button>
                <button className="right" onClick={() => selfMark(true)}>
                  I got it right
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mc-list">
            {q.options.map((_, displayIndex) => {
              const originalIndex = current.optionOrder[displayIndex];
              const label = q.options[originalIndex];
              let cls = "mc-option";
              if (result && result.type === "mc") {
                const correctDisplay = current.optionOrder.indexOf(
                  result.correctIndex ?? -1,
                );
                if (displayIndex === correctDisplay) cls += " correct";
                else if (displayIndex === pickedDisplay) cls += " wrong";
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
