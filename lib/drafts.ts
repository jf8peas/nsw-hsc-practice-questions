// Per-tab state kept in sessionStorage so a quiz survives a session expiry
// mid-quiz (FR-028, research R12) and a quiz can run when the database is down
// (research R19). Every access is try/catch: storage may be unavailable.

import type { GradeResult, RewriteDiscussion, RewriteGradeResult, RewriteHint } from "@/lib/grading";
import type { Question } from "@/lib/types";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function tabStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function read<T>(store: StorageLike | null, key: string): T | null {
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

function write(store: StorageLike | null, key: string, value: unknown): void {
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // ignore: the draft is only a convenience
  }
}

function remove(store: StorageLike | null, key: string): void {
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    // ignore
  }
}

// ---- the rewrite sentence (spec 005), one key per phase -------------------

export const rewriteDraftKey = (attemptId: string, questionId: string, phase: 1 | 2) =>
  `draft:rewrite:${attemptId}:${questionId}:phase${phase}`;

export function saveRewriteDraft(
  attemptId: string,
  questionId: string,
  phase: 1 | 2,
  text: string,
  store: StorageLike | null = tabStorage(),
) {
  if (text === "") remove(store, rewriteDraftKey(attemptId, questionId, phase));
  else write(store, rewriteDraftKey(attemptId, questionId, phase), text);
}

export function loadRewriteDraft(
  attemptId: string,
  questionId: string,
  phase: 1 | 2,
  store: StorageLike | null = tabStorage(),
): string {
  const v = read<string>(store, rewriteDraftKey(attemptId, questionId, phase));
  return typeof v === "string" ? v : "";
}

// ---- the rewrite draft beacon (spec 006 FR-053) ---------------------------

const lastSentDraft = new Map<string, string>();

/**
 * Fire-and-forget save of one phase's draft to POST /api/rewrite/draft via sendBeacon, on blur /
 * page hide / visibility change, so a resume on another device restores what the student had
 * typed. The attempt token comes from the attempt payload (or is passed in). A beacon is skipped
 * when the text equals the last text already sent for that box. Never throws: a dropped beacon is
 * fine because sessionStorage holds the same text for the same tab (research R5.2).
 */
export function sendRewriteDraftBeacon(
  attemptId: string,
  questionId: string,
  phase: 1 | 2,
  text: string,
  token?: string,
): void {
  try {
    if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return;
    const key = `${attemptId}:${questionId}:${phase}`;
    if (lastSentDraft.get(key) === text) return;
    // skip an empty draft for a phase that has never been saved (no row should be created for a
    // box the student never touched); a cleared box that was previously saved still sends "" to
    // clear the column.
    if (text === "" && !lastSentDraft.has(key)) return;
    const attemptToken = token ?? loadAttemptPayload(attemptId)?.attemptToken ?? "";
    if (!attemptToken) return;
    const body = JSON.stringify({ attemptId, attemptToken, questionId, phase, draft: text });
    // sendBeacon with a string body sends text/plain; a Blob of type application/json keeps the
    // route's req.json() parseable.
    const ok = navigator.sendBeacon(
      "/api/rewrite/draft",
      new Blob([body], { type: "application/json" }),
    );
    if (ok) lastSentDraft.set(key, text);
  } catch {
    // ignore: the draft is only a convenience
  }
}

// ---- the typed answer ---------------------------------------------------

export const draftKey = (attemptId: string, questionId: string) =>
  `draft:${attemptId}:${questionId}`;

export function saveDraft(
  attemptId: string,
  questionId: string,
  text: string,
  store: StorageLike | null = tabStorage(),
) {
  if (text === "") remove(store, draftKey(attemptId, questionId));
  else write(store, draftKey(attemptId, questionId), text);
}

export function loadDraft(
  attemptId: string,
  questionId: string,
  store: StorageLike | null = tabStorage(),
): string {
  const v = read<string>(store, draftKey(attemptId, questionId));
  return typeof v === "string" ? v : "";
}

export function clearDraft(
  attemptId: string,
  questionId: string,
  store: StorageLike | null = tabStorage(),
) {
  remove(store, draftKey(attemptId, questionId));
}

// ---- the graded-but-not-finished step -----------------------------------

/**
 * The last grade result for a question, kept until the student moves on, so a
 * reload does not lose the self-mark step.
 */
export interface GradedState {
  answer: string;
  /** A short-answer/MC result, or a rewrite result (spec 005). */
  result: GradeResult | RewriteGradeResult;
  selfMarkToken?: string;
  aiUnavailable?: boolean;
  aiLimit?: { reached: true; resetsAt: string };
  /** Marks once known (graded, or self-marked). */
  marks: number | null;
  pickedDisplay?: number;
}

export const gradedKey = (attemptId: string, questionId: string) =>
  `graded:${attemptId}:${questionId}`;

export function saveGraded(
  attemptId: string,
  questionId: string,
  state: GradedState,
  store: StorageLike | null = tabStorage(),
) {
  write(store, gradedKey(attemptId, questionId), state);
}

export function loadGraded(
  attemptId: string,
  questionId: string,
  store: StorageLike | null = tabStorage(),
): GradedState | null {
  return read<GradedState>(store, gradedKey(attemptId, questionId));
}

export function clearGraded(
  attemptId: string,
  questionId: string,
  store: StorageLike | null = tabStorage(),
) {
  remove(store, gradedKey(attemptId, questionId));
}

// ---- the photo read-back (survives a reload so a read is not paid for twice) --

/**
 * The accepted read-back of a photo answer, kept in sessionStorage so a page
 * reload does not trigger another paid read (FR-024). Photos that have not yet
 * been read are never stored: a reload before "Check my answer" loses them.
 */
export interface PhotoDraft {
  attemptId: string;
  questionId: string;
  transcription: string; // raw text from the vision model (with LaTeX)
  transcriptionHtml: string; // KaTeX-rendered HTML for display
  transcriptionToken: string; // signed token for /api/grade
  note?: string; // optional typed note (≤500 chars)
  reservedSlot?: { userId: string; sydneyDate: string };
  readCount: number; // how many reads this question has used (1-3)
}

export const photoDraftKey = (attemptId: string, questionId: string) =>
  `photo-${attemptId}-${questionId}`;

export function savePhotoDraft(
  attemptId: string,
  questionId: string,
  draft: PhotoDraft,
  store: StorageLike | null = tabStorage(),
) {
  write(store, photoDraftKey(attemptId, questionId), draft);
}

export function loadPhotoDraft(
  attemptId: string,
  questionId: string,
  store: StorageLike | null = tabStorage(),
): PhotoDraft | null {
  return read<PhotoDraft>(store, photoDraftKey(attemptId, questionId));
}

export function clearPhotoDraft(
  attemptId: string,
  questionId: string,
  store: StorageLike | null = tabStorage(),
) {
  remove(store, photoDraftKey(attemptId, questionId));
}

// ---- the attempt itself (lets a quiz run when the database is down) -----

export interface AttemptPayload {
  attemptToken: string;
  unitId: string;
  passMark: number;
  questions: Question[];
  answered: Record<string, { marks: number; max: number }>;
  /**
   * spec 005: per-question rewrite phase state for resume, built server-side from the phase
   * row. Exactly what the stage allows: nothing from the key before a phase 1 grade, the hint
   * at phase 1 under 3, the discussion once final (FR-023). The phase marks and the marker's
   * feedback are carried so the disabled boxes and marking boxes look the same after a reload
   * (the feedback is not answer-key material).
   */
  rewriteState?: Record<
    string,
    {
      phase: "phase1" | "phase2" | "final" | "draft";
      /** Absent for a draft-only entry (no phase row yet, phase 1 not graded). */
      phase1Answer?: string;
      phase1Marks?: number;
      phase1Feedback?: string;
      phase1TermOutcomes?: Array<{ conceptId: string; correct: boolean }>;
      /** spec 006: the persisted display data restores the full result (FR-054). */
      phase1CreditedSpans?: Array<{ conceptId: string; span: string }>;
      phase2Answer?: string;
      phase2Marks?: number;
      phase2Feedback?: string;
      phase2CreditedSpans?: Array<{ conceptId: string; span: string }>;
      phase2TermOutcomes?: Array<{ conceptId: string; correct: boolean }>;
      languageNote?: { spelling?: Array<{ wrong: string; fix: string }>; grammar?: string };
      marks?: number;
      hint?: RewriteHint;
      discussion?: RewriteDiscussion;
      /** spec 006: the persisted per-phase drafts (FR-053). */
      phase1Draft?: string;
      phase2Draft?: string;
    }
  >;
}

export const attemptKey = (attemptId: string) => `attempt:${attemptId}`;

export function saveAttemptPayload(
  attemptId: string,
  payload: AttemptPayload,
  store: StorageLike | null = tabStorage(),
) {
  write(store, attemptKey(attemptId), payload);
}

export function loadAttemptPayload(
  attemptId: string,
  store: StorageLike | null = tabStorage(),
): AttemptPayload | null {
  return read<AttemptPayload>(store, attemptKey(attemptId));
}
