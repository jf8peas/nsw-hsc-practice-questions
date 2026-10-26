// Small display helpers shared by the history pages. Pure; safe anywhere.

import type { TrendKind } from "@/lib/stats";

const SYDNEY = "Australia/Sydney";

const dateTime = new Intl.DateTimeFormat("en-AU", {
  timeZone: SYDNEY,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** e.g. "4 Feb 2026, 3:05 pm" in Sydney time, whatever the viewer's time zone. */
export function formatWhen(date: Date | string): string {
  return dateTime.format(new Date(date));
}

export const TREND_LABEL: Record<TrendKind, string> = {
  up: "Improving",
  down: "Slipping",
  steady: "Steady",
  none: "Not enough data yet",
};

export const TREND_ARROW: Record<TrendKind, string> = {
  up: "↑",
  down: "↓",
  steady: "→",
  none: "–",
};

/** The notice shown in place of history while the database cannot be reached. */
export const HISTORY_UNAVAILABLE =
  "History is temporarily unavailable — your answers are still being marked and will be saved.";
