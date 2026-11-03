import type { ReactNode } from "react";

/**
 * Shared span-highlighting helpers for the rewrite panel (spec 006 FR-032). The server keeps a
 * credited span only when it is found in the student's sentence under case-insensitive,
 * whitespace-normalised matching; the client re-finds it with the same rule to compute offsets.
 */

/** Normalise for span matching: trim and collapse runs of whitespace to a single space. */
export function normaliseForSpan(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find the [start, end) character offsets of every occurrence of `span` in `sentence` under
 * case-insensitive matching, allowing any run of whitespace between the span's words (so a span
 * split across a line break still matches). Returns [] when the span is not found.
 */
export function findSpanOffsets(sentence: string, span: string): Array<[number, number]> {
  const t = normaliseForSpan(span).toLowerCase();
  if (!t) return [];
  const words = t.split(" ");
  const pattern = words.map((w) => escapeRegExp(w)).join("\\s+");
  const re = new RegExp(pattern, "gi");
  const out: Array<[number, number]> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(sentence)) !== null) {
    out.push([m.index, m.index + m[0].length]);
    re.lastIndex = m.index + m[0].length;
  }
  return out;
}

/** Merge overlapping/adjacent ranges so nested marks are never rendered. */
export function mergeRanges(ranges: Array<[number, number]>): Array<[number, number]> {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const out: Array<[number, number]> = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

/** Render `text` with every range wrapped in a `<mark className={className}>`. */
export function HighlightedText({
  text,
  ranges,
  className,
}: {
  text: string;
  ranges: Array<[number, number]>;
  className: string;
}) {
  return <HighlightedSegments text={text} segments={ranges.map(([start, end]) => ({ start, end, className }))} />;
}

/** A highlighted segment with its own class (e.g. a credited term vs a misspelling). */
export interface HighlightSegment {
  start: number;
  end: number;
  className: string;
}

/** Render `text` with each segment wrapped in a `<mark className={...}>`; overlapping segments
 *  are merged, with the first segment's class winning. */
export function HighlightedSegments({ text, segments }: { text: string; segments: HighlightSegment[] }) {
  const merged: HighlightSegment[] = [];
  for (const seg of [...segments].sort((a, b) => a.start - b.start || a.end - b.end)) {
    const last = merged[merged.length - 1];
    if (last && seg.start <= last.end) {
      if (seg.end > last.end) last.end = seg.end;
    } else {
      merged.push({ ...seg });
    }
  }
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const seg of merged) {
    if (seg.start > cursor) nodes.push(text.slice(cursor, seg.start));
    nodes.push(
      <mark key={`${seg.start}-${seg.end}`} className={seg.className}>
        {text.slice(seg.start, seg.end)}
      </mark>,
    );
    cursor = seg.end;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}