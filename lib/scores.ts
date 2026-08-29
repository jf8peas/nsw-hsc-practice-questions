"use client";

// Anonymous, per-browser score history. No backend, no accounts.
// One list of percentages per unit, keyed by unit id.

const KEY_PREFIX = "physics-scores-";

function key(unitId: string) {
  return KEY_PREFIX + unitId;
}

export function getScores(unitId: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(unitId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export function saveScore(unitId: string, pct: number): void {
  if (typeof window === "undefined") return;
  try {
    const scores = getScores(unitId);
    scores.push(pct);
    window.localStorage.setItem(key(unitId), JSON.stringify(scores));
  } catch {
    // storage unavailable (private mode, blocked) — scores just aren't kept
  }
}

export function resetScores(unitId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(unitId));
  } catch {
    // ignore
  }
}

export interface UnitStats {
  hasScores: boolean;
  attempts: number;
  allTime: number | null;
  last3: number | null;
  last: number | null;
}

export function computeStats(unitId: string): UnitStats {
  const scores = getScores(unitId);
  if (!scores.length) {
    return { hasScores: false, attempts: 0, allTime: null, last3: null, last: null };
  }
  const avg = (arr: number[]) =>
    Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  return {
    hasScores: true,
    attempts: scores.length,
    allTime: avg(scores),
    last3: avg(scores.slice(-3)),
    last: scores[scores.length - 1],
  };
}
