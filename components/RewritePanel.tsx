"use client";

import { useState } from "react";

import type { RewriteGradeResult } from "@/lib/grading";
import { countWords } from "@/lib/wordcount";

const WORD_LIMIT = 25;

/**
 * The sentence-writing question flow (spec 005): phase 1 text box with a live word counter
 * (over 25 shown, submit still allowed), the phase 2 hint panel (missed/misused terms with
 * definitions, or the lost criterion), and the discussion (model sentence(s), every term with
 * its definition and why it fits, the student's sentences, the feedback). No Photo mode for
 * this question type (FR-009).
 */
export function RewritePanel({
  phase1Answer,
  phase2Answer,
  result,
  onGrade,
  onSkip,
  onSelfMark,
  busy,
}: {
  /** The phase 1 sentence the student submitted (for the discussion). */
  phase1Answer: string;
  /** The phase 2 sentence, once submitted. */
  phase2Answer?: string;
  /** The last rewrite result; null before the first submit. */
  result: RewriteGradeResult | null;
  onGrade: (phase: 1 | 2, answer: string) => void;
  onSkip: () => void;
  /** The per-criterion self-mark for the degrade path (FR-030, FR-046). */
  onSelfMark: (ticks: { criterionA: boolean; termTicks: Record<string, boolean>; criterionC: boolean }) => void;
  busy: boolean;
}) {
  const [text, setText] = useState("");
  const [ticks, setTicks] = useState<{ criterionA: boolean; termTicks: Record<string, boolean>; criterionC: boolean }>({
    criterionA: true,
    termTicks: {},
    criterionC: true,
  });
  const words = countWords(text);
  const over = words > WORD_LIMIT;

  const needsSelfMark = result?.needsSelfMark === true && result?.marksAwarded === null;
  const discussion = result?.discussion;
  const hint = result?.hint;
  // At the retry: a phase 2 result, or a phase 1 result that came back with a hint.
  const atPhase2 = result?.phase === 2 || (result?.phase === 1 && !!hint && !discussion);
  // The student may type while: nothing has been submitted yet, or phase 1 scored under 3 with
  // no discussion yet (the hinted retry).
  const canType = result === null || (result.phase === 1 && !discussion) || (atPhase2 && !discussion);

  return (
    <>
      {result !== null && !needsSelfMark && result.feedback && (
        <div className="feedback">
          <div className="feedback-score">
            {result.marksAwarded} / {result.maxMarks} marks
          </div>
          <p style={{ margin: "6px 0 0" }}>{result.feedback}</p>
        </div>
      )}

      {/* the phase 2 hint: only the missed/misused terms, or the lost criterion (FR-045) */}
      {hint && !discussion && (
        <div className="rewrite-hint" style={{ marginTop: 12 }}>
          <div className="label">{hint.terms.length > 0 ? "Terms to use in your retry" : "What to fix"}</div>
          {hint.terms.length > 0 ? (
            <ul>
              {hint.terms.map((t) => (
                <li key={t.term}>
                  <b>{t.term}</b> — {t.definition}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: "4px 0 0" }}>{hint.criterionText}</p>
          )}
        </div>
      )}

      {canType && !needsSelfMark && (
        <>
          <textarea
            className="q-textarea rewrite-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Rewrite the sentence in economics language, using the target terms..."
          />
          <div className="answer-bar">
            <span className={`rewrite-count${over ? " over" : ""}`}>
              {words}/{WORD_LIMIT} word{words === 1 ? "" : "s"}
              {over && " · over the limit — you lose the conciseness mark"}
            </span>
            <button
              type="button"
              className="rd-btn primary answer-submit"
              onClick={() => {
                onGrade(atPhase2 ? 2 : 1, text.trim());
                setText("");
              }}
              disabled={busy || !text.trim()}
            >
              {busy ? "Marking…" : atPhase2 ? "Submit retry" : "Submit answer"}
            </button>
            {atPhase2 && (
              <button type="button" className="rd-btn answer-submit" onClick={onSkip} disabled={busy}>
                Skip retry (keep {result?.marksAwarded} / 3)
              </button>
            )}
          </div>
        </>
      )}

      {/* the degrade path (FR-030, FR-046): the model sentence and every term are shown, and the
          student marks each criterion with one tick per target term */}
      {needsSelfMark && result?.discussion && (
        <div className="rewrite-selfmark" style={{ marginTop: 12 }}>
          {result.discussion.modelSentences.map((s, i) => (
            <p key={i} className="model-sentence" style={{ margin: "4px 0" }}>
              {s}
            </p>
          ))}
          <ul>
            {result.discussion.terms.map((t) => (
              <li key={t.term}>
                <label>
                  <input
                    type="checkbox"
                    checked={ticks.termTicks[t.term] ?? false}
                    onChange={(e) =>
                      setTicks((prev) => ({
                        ...prev,
                        termTicks: { ...prev.termTicks, [t.term]: e.target.checked },
                      }))
                    }
                  />{" "}
                  <b>{t.term}</b> — {t.definition}
                </label>
              </li>
            ))}
          </ul>
          <label>
            <input
              type="checkbox"
              checked={ticks.criterionA}
              onChange={(e) => setTicks((prev) => ({ ...prev, criterionA: e.target.checked }))}
            />{" "}
            (a) The meaning and the cause and effect are kept and correct.
          </label>
          <div>
            <label>
              <input
                type="checkbox"
                checked={ticks.criterionC}
                onChange={(e) => setTicks((prev) => ({ ...prev, criterionC: e.target.checked }))}
              />{" "}
              (c) The sentence is concise (25 words or fewer, no padding).
            </label>
          </div>
          <button
            type="button"
            className="rd-btn primary"
            style={{ marginTop: 10 }}
            disabled={busy}
            onClick={() => onSelfMark(ticks)}
          >
            {busy ? "Saving…" : "Save my mark"}
          </button>
        </div>
      )}

      {/* the discussion (FR-018): model sentence, terms with why it fits, the student's sentences */}
      {discussion && (
        <div className="rewrite-discussion" style={{ marginTop: 12 }}>
          <div className="label">
            Model sentence{discussion.modelSentences.length > 1 ? "s" : ""}
          </div>
          {discussion.modelSentences.map((s, i) => (
            <p key={i} className="model-sentence" style={{ margin: "4px 0" }}>
              {s}
            </p>
          ))}
          <div className="label" style={{ marginTop: 10 }}>
            Why these terms fit
          </div>
          <ul>
            {discussion.terms.map((t) => (
              <li key={t.term}>
                <b>{t.term}</b> — {t.definition} <span style={{ color: "var(--rd-mute-600)" }}>({t.why})</span>
              </li>
            ))}
          </ul>
          {(phase1Answer || phase2Answer) && (
            <>
              <div className="label" style={{ marginTop: 10 }}>
                Your sentences
              </div>
              {phase1Answer && (
                <p className="detail-answer" style={{ margin: "4px 0" }}>
                  {phase2Answer ? "Phase 1:" : "Your sentence:"} {phase1Answer}
                </p>
              )}
              {phase2Answer && (
                <p className="detail-answer" style={{ margin: "4px 0" }}>
                  Phase 2: {phase2Answer}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
