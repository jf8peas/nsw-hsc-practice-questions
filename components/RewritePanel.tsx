"use client";

import { useState } from "react";

import type { RewriteGradeResult } from "@/lib/grading";
import { countWords } from "@/lib/wordcount";

const WORD_LIMIT = 25;

/** "17/25 words", with the over-limit note when the sentence is over the limit. */
function countLabel(words: number, over: boolean): string {
  return `${words}/${WORD_LIMIT} word${words === 1 ? "" : "s"}${
    over ? " · over the limit — you lose the conciseness mark" : ""
  }`;
}

/**
 * The sentence-writing question flow (spec 005), phase by phase, one block under the other
 * like a short answer: the phase 1 text box (editable with a live counter, then the SAME box
 * stays in place disabled with a static count), phase 1's marking box, the phase 2 hint, the
 * retry box (same treatment), phase 2's marking box, and the discussion (or the self-mark
 * screen on the degrade path). Nothing that was shown is replaced. No Photo mode for this
 * question type (FR-009).
 */
export function RewritePanel({
  phase1Answer,
  phase1Result,
  phase2Answer,
  phase2Result,
  onGrade,
  onSelfMark,
  busy,
}: {
  /** The phase 1 sentence the student submitted. */
  phase1Answer: string;
  /** The phase 1 grade result; null before the first submit. */
  phase1Result: RewriteGradeResult | null;
  /** The phase 2 sentence, once submitted. */
  phase2Answer?: string;
  /** The phase 2 grade result, once phase 2 is submitted. */
  phase2Result?: RewriteGradeResult;
  onGrade: (phase: 1 | 2, answer: string) => void;
  /** The per-criterion self-mark for the degrade path (FR-030, FR-046). */
  onSelfMark: (ticks: { criterionA: boolean; termTicks: Record<string, boolean>; criterionC: boolean }) => void;
  busy: boolean;
}) {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [ticks, setTicks] = useState<{ criterionA: boolean; termTicks: Record<string, boolean>; criterionC: boolean }>({
    criterionA: true,
    termTicks: {},
    criterionC: true,
  });
  const words1 = countWords(text1);
  const over1 = words1 > WORD_LIMIT;
  const words2 = countWords(text2);
  const over2 = words2 > WORD_LIMIT;

  const phase1Submitted = phase1Result !== null;
  const phase2Submitted = phase2Result !== undefined;
  const phase1Words = countWords(phase1Answer);
  const phase2Words = phase2Answer ? countWords(phase2Answer) : 0;

  // The discussion: phase 1 at 3/3, phase 2, or the self-mark screen.
  const discussion = phase2Result?.discussion ?? phase1Result?.discussion;
  const hint = phase1Result?.hint;
  const needsSelfMark = phase2Result?.needsSelfMark === true || phase1Result?.needsSelfMark === true;
  // At the retry: phase 1 under 3 (hint, no discussion) and phase 2 not yet submitted.
  const atRetry = phase1Submitted && !phase2Submitted && !!hint && !discussion && !needsSelfMark;
  // The retry box exists once phase 1 is under 3, and stays in place disabled after phase 2
  // is submitted (or falls back to self-marking).
  const showPhase2 = atRetry || phase2Submitted;

  return (
    <>
      {/* the phase 1 text box: editable with the live counter, then the same box stays in
          place, disabled, holding the sentence, with a static count under it */}
      <div className="rewrite-phase">
        {showPhase2 && <div className="label">First try</div>}
        <textarea
          className="q-textarea rewrite-textarea"
          value={phase1Submitted ? phase1Answer : text1}
          onChange={(e) => setText1(e.target.value)}
          placeholder="Rewrite the sentence in economics language, using the target terms..."
          disabled={phase1Submitted}
        />
        {phase1Submitted ? (
          <div className="rewrite-count-static">{countLabel(phase1Words, phase1Words > WORD_LIMIT)}</div>
        ) : (
          <div className="answer-bar">
            <span className={`rewrite-count${over1 ? " over" : ""}`}>{countLabel(words1, over1)}</span>
            <button
              type="button"
              className="rd-btn primary answer-submit"
              onClick={() => {
                onGrade(1, text1.trim());
                setText1("");
              }}
              disabled={busy || !text1.trim()}
            >
              {busy ? "Marking…" : "Submit answer"}
            </button>
          </div>
        )}
      </div>

      {/* phase 1's marking box, directly under the phase 1 box */}
      {phase1Submitted && !needsSelfMark && phase1Result.feedback && (
        <div className="feedback">
          <div className="feedback-score">
            {phase1Result.marksAwarded} / {phase1Result.maxMarks} marks
          </div>
          <p style={{ margin: "6px 0 0" }}>{phase1Result.feedback}</p>
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

      {/* the retry text box: same treatment as phase 1 */}
      {showPhase2 && (
        <div className="rewrite-phase">
          <div className="label">Retry</div>
          <textarea
            className="q-textarea rewrite-textarea"
            value={phase2Submitted ? (phase2Answer ?? "") : text2}
            onChange={(e) => setText2(e.target.value)}
            placeholder="Rewrite the sentence in economics language, using the target terms..."
            disabled={phase2Submitted}
          />
          {phase2Submitted ? (
            <div className="rewrite-count-static">{countLabel(phase2Words, phase2Words > WORD_LIMIT)}</div>
          ) : (
            <div className="answer-bar">
              <span className={`rewrite-count${over2 ? " over" : ""}`}>{countLabel(words2, over2)}</span>
              <button
                type="button"
                className="rd-btn primary answer-submit"
                onClick={() => {
                  onGrade(2, text2.trim());
                  setText2("");
                }}
                disabled={busy || !text2.trim()}
              >
                {busy ? "Marking…" : "Submit retry"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* phase 2's marking box: the retry's mark (capped at 2), with the best-of line when
          phase 1 was better (FR-019) */}
      {phase2Submitted && !needsSelfMark && phase2Result.feedback && (
        <div className="feedback">
          <div className="feedback-score">
            {phase2Result.marksAwarded} / {phase2Result.maxMarks} marks
          </div>
          <p style={{ margin: "6px 0 0" }}>{phase2Result.feedback}</p>
          {phase1Result?.marksAwarded !== null &&
            phase1Result?.marksAwarded !== undefined &&
            phase2Result.marksAwarded !== null &&
            phase1Result.marksAwarded > phase2Result.marksAwarded && (
              <p style={{ margin: "6px 0 0" }}>
                Your recorded mark is {phase1Result.marksAwarded} / 3 (your better try).
              </p>
            )}
        </div>
      )}

      {/* the degrade path (FR-030, FR-046): the model sentence and every term are shown, and the
          student marks each criterion with one tick per target term. The sentence being marked
          is the disabled box above. */}
      {needsSelfMark && discussion && (
        <div className="rewrite-selfmark" style={{ marginTop: 12 }}>
          {discussion.modelSentences.map((s, i) => (
            <p key={i} className="model-sentence" style={{ margin: "4px 0" }}>
              {s}
            </p>
          ))}
          <ul>
            {discussion.terms.map((t) => (
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

      {/* the discussion (FR-018): model sentence and every term with why it fits. The student's
          sentences are not repeated here: the disabled boxes above already show them. */}
      {discussion && !needsSelfMark && (
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
        </div>
      )}
    </>
  );
}
