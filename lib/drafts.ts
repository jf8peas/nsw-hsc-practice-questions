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
   * at phase 1 under 3, the discussion once final (FR-023).
   */
  rewriteState?: Record<
    string,
    {
      phase: "phase1" | "phase2" | "final";
      phase1Answer: string;
      phase2Answer?: string;
      marks?: number;
      hint?: RewriteHint;
      discussion?: RewriteDiscussion;
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
