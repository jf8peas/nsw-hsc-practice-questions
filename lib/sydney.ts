// Australia/Sydney calendar helpers for the daily AI allowance (FR-017).
// Pure and DST-aware (uses Intl, so it follows AEDT/AEST). Safe anywhere.

export const SYDNEY_TZ = "Australia/Sydney";

const partsFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: SYDNEY_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

interface Parts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function sydneyParts(d: Date): Parts {
  const out: Record<string, number> = {};
  for (const p of partsFormat.formatToParts(d)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return out as unknown as Parts;
}

/** Milliseconds Sydney is ahead of UTC at this instant (39 600 000 in summer, 36 000 000 in winter). */
export function sydneyOffsetMs(at: Date): number {
  const p = sydneyParts(at);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** The Sydney calendar date of an instant, as YYYY-MM-DD. */
export function sydneyDate(at: Date): string {
  const p = sydneyParts(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** The first instant strictly after `now` at which the Sydney calendar date changes. */
export function nextSydneyMidnight(now: Date): Date {
  const p = sydneyParts(now);
  // local midnight at the start of the next Sydney day, expressed as if it were UTC
  const localMidnightAsUtc = Date.UTC(p.year, p.month - 1, p.day + 1, 0, 0, 0);
  // converge on the instant whose Sydney wall clock reads that time (offset can differ across DST)
  let instant = new Date(localMidnightAsUtc - sydneyOffsetMs(now));
  for (let i = 0; i < 3; i++) {
    instant = new Date(localMidnightAsUtc - sydneyOffsetMs(instant));
  }
  return instant;
}

/** An ISO-8601 timestamp in Sydney time with its offset, e.g. 2026-10-27T00:00:00+11:00. */
export function toSydneyIso(at: Date): string {
  const p = sydneyParts(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  const offsetMin = Math.round(sydneyOffsetMs(at) / 60_000);
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  return (
    `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

const dayLabel = new Intl.DateTimeFormat("en-AU", {
  timeZone: SYDNEY_TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** "midnight Sydney time (Tue 27 Oct)" for the next reset after `now`. */
export function resetLabel(now: Date): string {
  return `midnight Sydney time (${dayLabel.format(nextSydneyMidnight(now))})`;
}

/** The sentence shown when today's AI allowance is used up. */
export function formatResetMessage(now: Date): string {
  return `AI marking is paused until ${resetLabel(now)}. Mark this one yourself.`;
}
