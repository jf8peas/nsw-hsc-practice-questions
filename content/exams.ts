import type { Exam } from "@/lib/types";

/**
 * Upcoming exams. Shown on the home page and on unit pages they cover.
 * Past exams (date before today) are filtered out at render time.
 */
export const EXAMS: Exam[] = [
  {
    id: "y11-formula-test-2026",
    title: "Year 11 Formula Test",
    date: "2026-09-19",
    unitIds: ["y11-formula-test"],
  },
];

export function upcomingExams(now: Date = new Date()): Exam[] {
  const today = now.toISOString().slice(0, 10);
  return EXAMS.filter((e) => e.date >= today).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export function examsForUnit(unitId: string, now: Date = new Date()): Exam[] {
  return upcomingExams(now).filter((e) => e.unitIds.includes(unitId));
}

export function daysUntil(dateIso: string, now: Date = new Date()): number {
  const target = new Date(dateIso + "T00:00:00");
  const start = new Date(now.toISOString().slice(0, 10) + "T00:00:00");
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}
