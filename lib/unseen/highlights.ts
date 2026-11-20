// Text highlighting for the unseen-text unit (spec 008 FR-006a, research R12): the pure model. A highlight
// is a character range inside one text block. A block is a poem line, a prose paragraph or a footnote,
// numbered in one space: the body's blocks first (0 to bodyCount - 1), then the footnotes
// (bodyCount + footnote index). A highlight that crosses blocks is stored as one range per block with
// the same `id` and is one connected highlight: removing any part removes all of it. Nothing here
// touches the DOM, storage or the server.

export interface HlRange {
  /** The connected highlight this range belongs to. */
  id: string;
  block: number;
  start: number;
  end: number;
}

/** A selection to add: a range per block, before it has an id. */
export interface HlPart {
  block: number;
  start: number;
  end: number;
}

const touches = (a: { start: number; end: number }, b: { start: number; end: number }) => a.start <= b.end && b.start <= a.end;

/** Moves a range outwards to whole words (a word is a run of non-space characters) and trims spaces; null if nothing is left. */
export function snapToWords(text: string, start: number, end: number): { start: number; end: number } | null {
  let s = Math.max(0, Math.min(start, text.length));
  let e = Math.max(0, Math.min(end, text.length));
  if (e <= s) return null;
  while (s < e && /\s/.test(text[s])) s += 1; // trim leading space
  while (e > s && /\s/.test(text[e - 1])) e -= 1; // trim trailing space
  if (e <= s) return null;
  while (s > 0 && !/\s/.test(text[s - 1])) s -= 1; // out to the start of the word
  while (e < text.length && !/\s/.test(text[e])) e += 1; // out to the end of the word
  return { start: s, end: e };
}

/**
 * Sorted by block then start, clipped to each block's length, empty ranges dropped, and overlapping or
 * touching ranges of the same highlight merged. `lengths[block]` is the block's string length.
 */
export function normalise(ranges: HlRange[], lengths: number[]): HlRange[] {
  const clipped: HlRange[] = [];
  for (const r of ranges) {
    const len = lengths[r.block];
    if (len === undefined || !Number.isInteger(r.start) || !Number.isInteger(r.end)) continue;
    const start = Math.max(0, r.start);
    const end = Math.min(len, r.end);
    if (end > start) clipped.push({ id: r.id, block: r.block, start, end });
  }
  clipped.sort((a, b) => a.block - b.block || a.start - b.start || a.end - b.end);
  const out: HlRange[] = [];
  for (const r of clipped) {
    const last = out[out.length - 1];
    if (last && last.block === r.block && last.id === r.id && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else out.push({ ...r });
  }
  return out;
}

/**
 * Adds a selection. Every existing highlight that overlaps or touches any part of it, in the same block,
 * is merged with it into ONE connected highlight (one id), and ranges of that highlight that now overlap
 * or touch in a block become one range.
 */
export function addHighlight(existing: HlRange[], parts: HlPart[], newId: string, lengths: number[]): HlRange[] {
  const joined = new Set<string>([newId]);
  for (const r of existing) {
    if (parts.some((p) => p.block === r.block && touches(p, r))) joined.add(r.id);
  }
  const merged: HlRange[] = existing.map((r) => (joined.has(r.id) ? { ...r, id: newId } : r));
  for (const p of parts) merged.push({ id: newId, block: p.block, start: p.start, end: p.end });
  return normalise(merged, lengths);
}

/** Removes the whole connected highlight with this id (every block's range of it); separate highlights stay. */
export function removeHighlight(existing: HlRange[], id: string): HlRange[] {
  return existing.filter((r) => r.id !== id);
}

/** A validated list read back from storage or from another view; anything malformed gives []. */
export function parseRanges(value: unknown, lengths: number[]): HlRange[] {
  if (!Array.isArray(value)) return [];
  const ranges: HlRange[] = [];
  for (const v of value) {
    if (v && typeof v === "object") {
      const r = v as Record<string, unknown>;
      if (typeof r.id === "string" && typeof r.block === "number" && typeof r.start === "number" && typeof r.end === "number") {
        ranges.push({ id: r.id, block: r.block, start: r.start, end: r.end });
      }
    }
  }
  return normalise(ranges, lengths);
}

/** A block's string cut into plain and highlighted segments, in order; `id` is set on a highlighted segment. */
export function segments(text: string, ranges: HlRange[]): Array<{ text: string; id?: string }> {
  const out: Array<{ text: string; id?: string }> = [];
  let at = 0;
  for (const r of [...ranges].sort((a, b) => a.start - b.start)) {
    if (r.start > at) out.push({ text: text.slice(at, r.start) });
    out.push({ text: text.slice(Math.max(r.start, at), r.end), id: r.id });
    at = Math.max(at, r.end);
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out.length ? out : [{ text }];
}

/** The string length of every block of a text, in the block numbering (body first, then footnotes). */
export function blockLengths(text: {
  body: { kind: "poem"; stanzas: string[][] } | { kind: "prose"; paragraphs: string[] } | { kind: "image" };
  footnotes?: Array<{ text: string }>;
}): number[] {
  const body = text.body.kind === "poem" ? text.body.stanzas.flat().map((l) => l.length) : text.body.kind === "prose" ? text.body.paragraphs.map((p) => p.length) : [];
  return [...body, ...(text.footnotes ?? []).map((f) => f.text.length)];
}
