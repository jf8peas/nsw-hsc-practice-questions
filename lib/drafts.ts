// Per-tab state kept in sessionStorage so a quiz survives a session expiry
// mid-quiz (FR-028, research R12) and a quiz can run when the database is down
// (research R19). Every access is try/catch: storage may be unavailable.

import type { GradeResult } from "@/lib/grading";
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
  result: GradeResult;
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

// ---- the attempt itself (lets a quiz run when the database is down) -----

export interface AttemptPayload {
  attemptToken: string;
  unitId: string;
  passMark: number;
  questions: Question[];
  answered: Record<string, { marks: number; max: number }>;
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
