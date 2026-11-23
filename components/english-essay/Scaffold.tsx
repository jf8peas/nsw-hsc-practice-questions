"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { loadEnglishEssayScaffoldDraft, saveEnglishEssayScaffoldDraft } from "@/lib/drafts";
import {
  emptyEnglishEssayScaffold,
  scaffoldCounter,
  scaffoldWords,
  validateEnglishScaffold,
  type EnglishScaffoldReason,
} from "@/lib/english-essay/scaffold";
import type { EnglishEssayScaffold, PublicEnglishEssay } from "@/lib/english-essay/types";

import { EnglishEssayHeader } from "./shared";

// The plan screen (spec 011 FR-004 to FR-008, research R6): the question with its directive highlighted, then a light
// scaffold: a thesis and three optional claim and evidence-note pairs, capped at 150 words in total. Placeholders guide the
// writing; there are no labelled sub-boxes and no conclusion. Both Start writing and (S2) the plan review stay disabled over
// 150 words or without a non-blank thesis; the server checks the same rules itself. S1 offers only "Start writing".

const DEBOUNCE_MS = 1500;
const json = { "content-type": "application/json" };

const REASON_TEXT: Record<EnglishScaffoldReason, string> = {
  over_cap: "Cut your plan to 150 words or fewer.",
  no_thesis: "Write your thesis first.",
};

const THESIS_PLACEHOLDER = "One or two sentences answering this question and taking a position…";
const CLAIM_PLACEHOLDER = "One idea about human experience that builds your thesis (not a plot point or technique)…";
const EVIDENCE_PLACEHOLDER = "Optional: quotations, scenes, stage directions, staging or symbols to analyse…";
const ORDINAL = ["First", "Second", "Third"] as const;

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
  essay: PublicEnglishEssay;
  initial: EnglishEssayScaffold;
  /** The plan is locked: the essay page opens with this plan. */
  onStarted: (plan: EnglishEssayScaffold) => void;
}) {
  // the server's saved plan wins; this tab's mirror only fills in when the server has nothing yet
  const [plan, setPlan] = useState<EnglishEssayScaffold>(() => {
    const empty = scaffoldWords(initial) === 0 && initial.thesis === "";
    return (empty ? loadEnglishEssayScaffoldDraft(attemptId) : null) ?? initial ?? emptyEnglishEssayScaffold();
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSaved = useRef(JSON.stringify(initial));
  const planRef = useRef(plan);
  planRef.current = plan;

  const words = scaffoldWords(plan);
  const counter = scaffoldCounter(words);
  const check = validateEnglishScaffold(plan, "start");
  const canMove = check.ok && !busy;

  const request = useCallback(
    async (action: "save" | "start", value: EnglishEssayScaffold, keepalive = false) =>
      fetch("/api/english-essay/scaffold", {
        method: "POST",
        headers: json,
        keepalive,
        body: JSON.stringify({ attemptId, attemptToken, questionId: essay.id, action, scaffold: value }),
      }),
    [attemptId, attemptToken, essay.id],
  );

  const save = useCallback(
    async (value: EnglishEssayScaffold, keepalive = false) => {
      const text = JSON.stringify(value);
      if (text === lastSaved.current) return;
      if (validateEnglishScaffold(value, "save").reasons.includes("over_cap")) return; // the server refuses it; the text stays on this device
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
    saveEnglishEssayScaffoldDraft(attemptId, plan);
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

  async function startWriting() {
    if (!canMove) return;
    setBusy(true);
    setError(null);
    try {
      const res = await request("start", plan);
      if (res.ok || res.status === 409) {
        onStarted(plan);
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (body?.error === "scaffold_invalid") setError((body.reasons as EnglishScaffoldReason[]).map((r) => REASON_TEXT[r]).join(" "));
      else if (res.status === 503) setError("We can’t save your plan right now. Try again in a moment.");
      else if (res.status === 401) setError("Your session has ended. Sign in to continue.");
      else setError("That didn’t work. Your plan is still here, so try again.");
    } catch {
      setError("Could not reach the server. Your plan is still here, so check your connection and try again.");
    }
    setBusy(false);
  }

  const setThesis = (thesis: string) => setPlan((p) => ({ ...p, thesis }));
  const setBody = (i: number, key: "claim" | "evidence", value: string) =>
    setPlan((p) => {
      const body = p.body.map((b, j) => (j === i ? { ...b, [key]: value } : b)) as EnglishEssayScaffold["body"];
      return { ...p, body };
    });

  const savedNote =
    saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Not saved yet. Your plan is kept on this device." : "";

  return (
    <div className="es-card">
      <EnglishEssayHeader essay={essay} />
      <p className="es-lead">
        Plan your essay in notes. A thesis and up to three claims is plenty (150 words at most). Once you start writing, the plan is locked.
      </p>

      <div className="es-field">
        <label htmlFor="en-thesis">Thesis</label>
        <textarea
          id="en-thesis"
          className="rw-textarea es-textarea"
          rows={3}
          value={plan.thesis}
          placeholder={THESIS_PLACEHOLDER}
          onChange={(e) => setThesis(e.target.value)}
        />
      </div>

      {plan.body.map((b, i) => (
        <details key={i} className="es-section" open>
          <summary>
            <span>{ORDINAL[i]} claim</span>
            <span className="es-section-count">optional</span>
          </summary>
          <div className="es-field">
            <label htmlFor={`en-claim-${i}`}>Claim</label>
            <textarea
              id={`en-claim-${i}`}
              className="rw-textarea es-textarea es-grow"
              rows={1}
              value={b.claim}
              placeholder={CLAIM_PLACEHOLDER}
              onChange={(e) => setBody(i, "claim", e.target.value)}
            />
          </div>
          <div className="es-field">
            <label htmlFor={`en-evidence-${i}`}>Evidence notes</label>
            <textarea
              id={`en-evidence-${i}`}
              className="rw-textarea es-textarea es-grow"
              rows={2}
              value={b.evidence}
              placeholder={EVIDENCE_PLACEHOLDER}
              onChange={(e) => setBody(i, "evidence", e.target.value)}
            />
          </div>
        </details>
      ))}

      <div className="es-bar es-sticky">
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
        <div className="es-actions">
          <button type="button" className="rw-btn" onClick={() => void startWriting()} disabled={!canMove}>
            {busy ? "Starting…" : "Start writing"}
          </button>
        </div>
      </div>
    </div>
  );
}
