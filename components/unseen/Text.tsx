"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { UnseenText } from "@/lib/types";
import { addHighlight, blockLengths, removeHighlight, segments, snapToWords, type HlPart, type HlRange } from "@/lib/unseen/highlights";
import { loadHighlights, markFinal, saveHighlights, subscribeHighlights, sweepFinalHighlights, type HlScope } from "@/lib/unseen/highlight-store";

import { Dialog } from "./Dialog";

// The unseen text (spec 008 FR-002 to FR-004): heading as on the paper, title, author and source
// line, then a poem with its line and stanza breaks (and the paper's line numbers where it has them),
// prose with its paragraphs, or a cropped image the student can zoom, then the paper's footnotes.

// ---- highlighting (spec 008 FR-006a) -------------------------------------------------------------
// The text's blocks (poem lines, prose paragraphs, footnotes) are numbered in one space and each carries
// data-hl-block; a highlight is a <mark> made by splitting the block's string in React. The heading,
// title, author, source line and the answer box are not blocks, so they can never be highlighted.

interface HlContextValue {
  ranges: HlRange[];
  on: boolean;
  remove: (id: string) => void;
}
const HlContext = createContext<HlContextValue | null>(null);

/** The content of one block: its string, with the highlighted parts wrapped in <mark>. */
function HlContent({ block, text }: { block: number; text: string }) {
  const ctx = useContext(HlContext);
  const mine = ctx ? ctx.ranges.filter((r) => r.block === block) : [];
  if (!ctx || mine.length === 0) return <>{text}</>;
  return (
    <>
      {segments(text, mine).map((s, i) =>
        s.id === undefined ? (
          <span key={i}>{s.text}</span>
        ) : (
          <mark
            key={i}
            className={ctx.on ? "un-hl un-hl-on" : "un-hl"}
            data-hl-id={s.id}
            title={ctx.on ? "Click to remove this highlight" : undefined}
            tabIndex={ctx.on ? 0 : undefined}
            onClick={() => {
              // a click that ends a drag-selection is not a removal
              if (ctx.on && (typeof window === "undefined" || window.getSelection()?.isCollapsed !== false)) ctx.remove(s.id!);
            }}
            onKeyDown={(e) => {
              if (ctx.on && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                ctx.remove(s.id!);
              }
            }}
          >
            {s.text}
          </mark>
        ),
      )}
    </>
  );
}

export function PoemText({ stanzas, lineNumbers }: { stanzas: string[][]; lineNumbers?: { every: number } }) {
  let n = 0;
  return (
    <div className="un-poem">
      {stanzas.map((lines, s) => (
        <div key={s} className="un-stanza">
          {lines.map((line, i) => {
            n += 1;
            const block = n - 1;
            const shown = lineNumbers && n % lineNumbers.every === 0 ? n : null;
            return (
              <div key={i} className="un-line">
                <span className="un-ln" aria-hidden="true">
                  {shown ?? ""}
                </span>
                <span className="un-lt" data-hl-block={block}>
                  <HlContent block={block} text={line} />
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function ProseText({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="un-prose">
      {paragraphs.map((p, i) => (
        <p key={i} data-hl-block={i}>
          <HlContent block={i} text={p} />
        </p>
      ))}
    </div>
  );
}

export function Footnotes({ notes, blockOffset = 0 }: { notes: Array<{ mark: string; text: string }>; blockOffset?: number }) {
  return (
    <ul className="un-footnotes" aria-label="Notes from the paper">
      {notes.map((f, i) => (
        <li key={i}>
          {f.mark && <span className="un-fn-mark">{f.mark} </span>}
          <span data-hl-block={blockOffset + i}>
            <HlContent block={blockOffset + i} text={f.text} />
          </span>
        </li>
      ))}
    </ul>
  );
}

const ZOOMS = [100, 150, 200, 300];

/** The cropped image from the authenticated route, with a Zoom button that opens a scrollable dialog. */
export function VisualText({ image, alt }: { image: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(0);
  const src = `/api/unseen/image/${image}`;
  return (
    <div className="un-visual">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="un-image" src={src} alt={alt} />
      <button
        type="button"
        className="un-btn-secondary"
        onClick={() => {
          setZoom(0);
          setOpen(true);
        }}
      >
        Zoom
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} label="Zoom the image" className="un-zoom-dialog">
        <div className="un-zoom-bar">
          <button type="button" className="un-btn-secondary" onClick={() => setZoom((z) => Math.max(0, z - 1))} disabled={zoom === 0}>
            Zoom out
          </button>
          <button type="button" className="un-btn-secondary" onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} disabled={zoom === ZOOMS.length - 1}>
            Zoom in
          </button>
          <span className="un-zoom-level" aria-live="polite">
            {ZOOMS[zoom]}%
          </span>
        </div>
        <div className="un-zoom-scroll">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="un-zoom-image" src={src} alt={alt} style={{ width: `${ZOOMS[zoom]}%` }} />
        </div>
      </Dialog>
    </div>
  );
}

/** Opens the text on its own page in a new tab, so it can sit beside the answer (FR-006, research R12). */
export function OpenTextLink({ href, heading }: { href: string; heading: string }) {
  const label = `Open ${heading} in a new tab`;
  return (
    <a className="un-open" href={href} target="_blank" rel="noopener" aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 4h6v6" />
        <path d="M20 4l-9 9" />
        <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
      </svg>
    </a>
  );
}

/** Where a text's highlights are kept and shared: this student, this attempt (the quiz and the text-only tab agree on it). */
export interface HighlightConfig {
  userId: string;
  attemptId: string;
  /** The attempt is final (the discussion is shown): its highlights are cleaned up 30 days after. */
  final?: boolean;
}

/** The highlighter icon button (a toggle): filled when on. Mouse-down does not take focus, so the answer box keeps it. */
export function HighlightToggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={on ? "un-hl-toggle on" : "un-hl-toggle"}
      aria-pressed={on}
      aria-label="Highlight"
      title="Highlight text: select words to highlight; click a highlight to remove it"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onToggle}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11 4 16l3 3h3l5-5" />
        <path d="m14 6 4 4-7 7-4-4z" />
        <path d="M3 22h18" />
      </svg>
    </button>
  );
}

let idCounter = 0;
const newHighlightId = () => `h${Date.now().toString(36)}${(idCounter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** The highlight ranges the current browser selection covers, one per block, snapped to whole words. */
function selectedParts(root: HTMLElement): HlPart[] {
  const sel = typeof window !== "undefined" ? window.getSelection() : null;
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return [];
  const range = sel.getRangeAt(0);
  const parts: HlPart[] = [];
  const offsetIn = (el: Element, node: Node, off: number) => {
    const r = document.createRange();
    r.setStart(el, 0);
    r.setEnd(node, off);
    return r.toString().length;
  };
  root.querySelectorAll<HTMLElement>("[data-hl-block]").forEach((el) => {
    if (!range.intersectsNode(el)) return;
    const string = el.textContent ?? "";
    const start = el.contains(range.startContainer) ? offsetIn(el, range.startContainer, range.startOffset) : 0;
    const end = el.contains(range.endContainer) ? offsetIn(el, range.endContainer, range.endOffset) : string.length;
    const snapped = snapToWords(string, start, end);
    if (snapped) parts.push({ block: Number(el.dataset.hlBlock), ...snapped });
  });
  return parts;
}

/**
 * `openHref` adds the open-in-a-new-tab icon beside the heading; the text's own page leaves it out.
 * `highlight` adds the highlighter toggle (not for an image-only text); without it, `highlightNote` shows
 * a disabled toggle and the note explaining why.
 */
export function TextPanel({ text, openHref, highlight, highlightNote }: { text: UnseenText; openHref?: string; highlight?: HighlightConfig | null; highlightNote?: string }) {
  const lengths = useMemo(() => blockLengths(text), [text]);
  const bodyCount = text.body.kind === "poem" ? text.body.stanzas.flat().length : text.body.kind === "prose" ? text.body.paragraphs.length : 0;
  const canHighlight = text.body.kind !== "image";
  const userId = highlight?.userId;
  const attemptId = highlight?.attemptId;
  const scope = useMemo<HlScope | null>(() => (userId && attemptId && canHighlight ? { userId, attemptId, textId: text.id } : null), [userId, attemptId, canHighlight, text.id]);
  const final = Boolean(highlight?.final);

  const [on, setOn] = useState(false);
  const [ranges, setRanges] = useState<HlRange[]>([]);
  const rangesRef = useRef<HlRange[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef(false);
  const apply = useCallback((next: HlRange[]) => {
    rangesRef.current = next;
    setRanges(next);
  }, []);

  // load this attempt's highlights, follow other views of the same attempt and text, and tidy old attempts
  useEffect(() => {
    if (!scope) {
      apply([]);
      return;
    }
    sweepFinalHighlights();
    apply(loadHighlights(scope, lengths));
    if (final) markFinal(scope);
    return subscribeHighlights(scope, lengths, apply);
  }, [scope, lengths, apply, final]);

  const addSelection = useCallback(() => {
    if (!scope || !on || !rootRef.current) return;
    const parts = selectedParts(rootRef.current);
    if (parts.length === 0) return;
    const next = addHighlight(rangesRef.current, parts, newHighlightId(), lengths);
    apply(next);
    saveHighlights(scope, next);
    window.getSelection()?.removeAllRanges();
  }, [scope, on, lengths, apply]);

  const remove = useCallback(
    (id: string) => {
      if (!scope) return;
      const next = removeHighlight(rangesRef.current, id);
      apply(next);
      saveHighlights(scope, next);
    },
    [scope, apply],
  );

  // touch: a long-press selection has no pointerup at its end, so settle on the debounced selectionchange
  useEffect(() => {
    if (!on || !scope) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onChange = () => {
      if (!touchRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(addSelection, 500);
    };
    document.addEventListener("selectionchange", onChange);
    return () => {
      document.removeEventListener("selectionchange", onChange);
      clearTimeout(timer);
    };
  }, [on, scope, addSelection]);

  const ctx = useMemo<HlContextValue>(() => ({ ranges, on, remove }), [ranges, on, remove]);

  return (
    <article className="un-text" aria-labelledby={`un-title-${text.id}`}>
      <div className="un-text-top">
        {text.title ? <p className="un-heading">{text.heading}</p> : <span />}
        <div className="un-text-tools">
          {canHighlight && (scope || highlightNote) && <HighlightToggle on={on} onToggle={() => setOn((v) => !v)} disabled={!scope} />}
          {openHref && <OpenTextLink href={openHref} heading={text.heading} />}
        </div>
      </div>
      {on && (
        <p className="un-hl-status" role="status">
          Highlighting on
        </p>
      )}
      {canHighlight && !scope && highlightNote && <p className="un-hl-note">{highlightNote}</p>}
      <h2 id={`un-title-${text.id}`} className="un-title">
        {text.title || text.heading}
      </h2>
      {text.author && <p className="un-author">{text.author}</p>}
      {text.sourceLine && <p className="un-source">{text.sourceLine}</p>}
      <HlContext.Provider value={ctx}>
        <div
          ref={rootRef}
          className="un-text-body"
          onPointerDown={(e) => {
            touchRef.current = e.pointerType === "touch";
          }}
          onTouchStart={() => {
            touchRef.current = true;
          }}
          onPointerUp={addSelection}
          onTouchEnd={addSelection}
          onKeyUp={addSelection}
        >
          {text.body.kind === "poem" ? (
            <PoemText stanzas={text.body.stanzas} lineNumbers={text.body.lineNumbers} />
          ) : text.body.kind === "prose" ? (
            <ProseText paragraphs={text.body.paragraphs} />
          ) : (
            <VisualText image={text.body.image} alt={text.body.alt} />
          )}
          {text.footnotes && text.footnotes.length > 0 && <Footnotes notes={text.footnotes} blockOffset={bodyCount} />}
        </div>
      </HlContext.Provider>
    </article>
  );
}
