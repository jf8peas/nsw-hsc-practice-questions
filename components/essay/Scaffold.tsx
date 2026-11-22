"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { loadEssayScaffoldDraft, saveEssayScaffoldDraft } from "@/lib/drafts";
import { scaffoldCounter } from "@/lib/essay/counter";
import {
  SCAFFOLD_FIELDS,
  SCAFFOLD_SECTION_TITLES,
  filledCount,
  getField,
  scaffoldWords,
  setField,
  validateScaffold,
  type EssayScaffold,
  type ScaffoldField,
  type ScaffoldReason,
} from "@/lib/essay/scaffold";
import type { PlanReview, PublicEssay } from "@/lib/essay/types";

import { EssayHeader } from "./shared";

// The plan screen (spec 010 FR-006 to FR-011): the question, the economy, the 20-field scaffold in five
// collapsible sections, a total word counter capped at 250, autosave, and the button that locks the plan and
// moves on. Both buttons are disabled over 250 words and without a judgement and at least one body point; the
// server checks the same rules itself.

const SECTIONS = Object.keys(SCAFFOLD_SECTION_TITLES) as ScaffoldField["section"][];
const DEBOUNCE_MS = 1500;
const json = { "content-type": "application/json" };

const REASON_TEXT: Record<ScaffoldReason, string> = {
  over_cap: "Cut your plan to 250 words or fewer.",
  no_judgement: "Write your judgement in the introduction.",
  no_body_point: "Write at least one body paragraph point.",
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function Scaffold({
  attemptId,
  attemptToken,
  essay,
  initial,
  onStarted,
}: {
  attemptId: string;
  attemptToken: string;
  essay: PublicEssay;
  initial: EssayScaffold;
  /** The plan is locked: the essay page opens with this plan (and the review, if one was made). */
  onStarted: (plan: EssayScaffold, review?: PlanReview) => void;
}) {
  const [plan, setPlan] = useState<EssayScaffold>(() => {
    const empty = scaffoldWords(initial) === 0 && initial.intro.judgement === "";
    return (empty ? loadEssayScaffoldDraft(attemptId) : null) ?? initial;
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [busy, setBusy] = useState<"start" | "review" | null>(null);
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastSaved = useRef(JSON.stringify(initial));
  const planRef = useRef(plan);
  planRef.current = plan;

  const words = scaffoldWords(plan);
  const counter = scaffoldCounter(words);
  const check = validateScaffold(plan, "start");
  const canMove = check.ok && busy === null;

  const request = useCallback(
    async (action: "save" | "start", value: EssayScaffold, keepalive = false) =>
      fetch("/api/essay/scaffold", {
        method: "POST",
        headers: json,
        keepalive,
        body: JSON.stringify({ attemptId, attemptToken, questionId: essay.id, action, scaffold: value }),
      }),
    [attemptId, attemptToken, essay.id],
  );

  const save = useCallback(
    async (value: EssayScaffold, keepalive = false) => {
      const text = JSON.stringify(value);
      if (text === lastSaved.current) return;
      if (validateScaffold(value, "save").reasons.includes("over_cap")) return; // the server refuses it; the text stays on this device
      setSaveState("saving");
      try {
        const res = await request("save", value, keepalive);
        if (res.ok) {
          lastSaved.current = text;
          setSaveState("saved");
        } else if (res.status === 409) {
          setSaveState("saved"); // already locked: the page reloads into the essay on the next action
        } else {
          setSaveState("error");
        }
      } catch {
        setSaveState("error");
      }
    },
    [request],
  );

  // mirror to this tab at once, and save to the server after a pause
  useEffect(() => {
    saveEssayScaffoldDraft(attemptId, plan);
    const timer = setTimeout(() => void save(plan), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [attemptId, plan, save]);

  // a leave or a tab switch saves what is there (a dropped request is fine: sessionStorage holds the same text)
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden" || document.visibilityState === undefined) void save(planRef.current, true);
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", flush);
    };
  }, [save]);

  async function getReview() {
    if (!canMove) return;
    setBusy("review");
    setError(null);
    setReviewNote(null);
    try {
      const res = await fetch("/api/essay/review", {
        method: "POST",
        headers: json,
        body: JSON.stringify({ attemptId, attemptToken, questionId: essay.id, scaffold: plan }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.review) {
        onStarted(plan, body.review as PlanReview);
        return;
      }
      if (res.status === 409) {
        onStarted(plan); // already locked or reviewed in another tab: the essay page loads the saved state
        return;
      }
      if (res.ok && body.notReviewed) {
        setReviewNote(
          body.notReviewed.reason === "daily_limit"
            ? "You’ve reached today’s feedback limit, so there’s no plan feedback right now. You can still start writing."
            : "We couldn’t review your plan just now. You can still start writing, or try the feedback again in a moment.",
        );
      } else if (body?.error === "scaffold_invalid") setError((body.reasons as ScaffoldReason[]).map((r) => REASON_TEXT[r]).join(" "));
      else if (res.status === 503) setError("We can’t reach your plan right now. Try again in a moment.");
      else if (res.status === 401) setError("Your session has ended. Sign in to continue.");
      else setReviewNote("We couldn’t review your plan just now. You can still start writing.");
    } catch {
      setReviewNote("We couldn’t review your plan just now. You can still start writing.");
    }
    setBusy(null);
  }

  async function startWriting() {
    if (!canMove) return;
    setBusy("start");
    setError(null);
    setReviewNote(null);
    try {
      const res = await request("start", plan);
      if (res.ok || res.status === 409) {
        onStarted(plan);
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (body?.error === "scaffold_invalid") setError((body.reasons as ScaffoldReason[]).map((r) => REASON_TEXT[r]).join(" "));
      else if (res.status === 503) setError("We can’t save your plan right now. Try again in a moment.");
      else if (res.status === 401) setError("Your session has ended. Sign in to continue.");
      else setError("That didn’t work. Your plan is still here, so try again.");
    } catch {
      setError("Could not reach the server. Your plan is still here, so check your connection and try again.");
    }
    setBusy(null);
  }

  const savedNote =
    saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Not saved yet. Your plan is kept on this device." : "";

  return (
    <div className="es-card">
      <EssayHeader essay={essay} />
      <p className="es-lead">
        Plan your essay here, in notes or dot points. About one handwritten side is enough (250 words at most). Once you start writing, the plan is locked.
      </p>

      {SECTIONS.map((section) => {
        const { filled, total } = filledCount(plan, section);
        return (
          <details key={section} className="es-section" open>
            <summary>
              <span>{SCAFFOLD_SECTION_TITLES[section]}</span>
              <span className="es-section-count">
                {filled} of {total} filled
              </span>
            </summary>
            {SCAFFOLD_FIELDS.filter((f) => f.section === section).map((f) => {
              const id = `sc-${section}-${f.key}`;
              return (
                <div key={id} className="es-field">
                  <label htmlFor={id}>{f.label}</label>
                  <textarea
                    id={id}
                    className="rw-textarea es-textarea"
                    rows={2}
                    value={getField(plan, f)}
                    placeholder={f.placeholder}
                    onChange={(e) => setPlan((p) => setField(p, f, e.target.value))}
                  />
                </div>
              );
            })}
          </details>
        );
      })}

      <div className="es-bar">
        <div className="es-bar-info">
          <span className={`es-counter${counter.over ? " over" : ""}`} role="status" aria-live="polite">
            {counter.text}
          </span>
          <span className="es-save" aria-live="polite">
            {savedNote}
          </span>
        </div>
        {!check.ok && words > 0 && <p className="es-hint">{check.reasons.map((r) => REASON_TEXT[r]).join(" ")}</p>}
        {error && (
          <p className="es-error" role="alert">
            {error}
          </p>
        )}
        {reviewNote && (
          <p className="es-hint" role="status">
            {reviewNote}
          </p>
        )}
        <div className="es-actions">
          <button type="button" className="rd-btn xl" onClick={() => void getReview()} disabled={!canMove}>
            {busy === "review" ? "Reviewing your plan…" : "Get feedback on my plan"}
          </button>
          <button type="button" className="rw-btn" onClick={() => void startWriting()} disabled={!canMove}>
            {busy === "start" ? "Starting…" : "Start writing"}
          </button>
        </div>
      </div>
    </div>
  );
}
