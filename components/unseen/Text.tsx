"use client";

import { useState } from "react";

import type { UnseenText } from "@/lib/types";

import { Dialog } from "./Dialog";

// The unseen text (spec 008 FR-002 to FR-004): heading as on the paper, title, author and source
// line, then a poem with its line and stanza breaks (and the paper's line numbers where it has them),
// prose with its paragraphs, or a cropped image the student can zoom, then the paper's footnotes.

export function PoemText({ stanzas, lineNumbers }: { stanzas: string[][]; lineNumbers?: { every: number } }) {
  let n = 0;
  return (
    <div className="un-poem">
      {stanzas.map((lines, s) => (
        <div key={s} className="un-stanza">
          {lines.map((line, i) => {
            n += 1;
            const shown = lineNumbers && n % lineNumbers.every === 0 ? n : null;
            return (
              <div key={i} className="un-line">
                <span className="un-ln" aria-hidden="true">
                  {shown ?? ""}
                </span>
                <span className="un-lt">{line}</span>
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
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

export function Footnotes({ notes }: { notes: Array<{ mark: string; text: string }> }) {
  return (
    <ul className="un-footnotes" aria-label="Notes from the paper">
      {notes.map((f, i) => (
        <li key={i}>
          {f.mark && <span className="un-fn-mark">{f.mark} </span>}
          {f.text}
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

/** `openHref` adds the open-in-a-new-tab icon beside the heading; the text's own page leaves it out. */
export function TextPanel({ text, openHref }: { text: UnseenText; openHref?: string }) {
  return (
    <article className="un-text" aria-labelledby={`un-title-${text.id}`}>
      <div className="un-text-top">
        {text.title ? <p className="un-heading">{text.heading}</p> : <span />}
        {openHref && <OpenTextLink href={openHref} heading={text.heading} />}
      </div>
      <h2 id={`un-title-${text.id}`} className="un-title">
        {text.title || text.heading}
      </h2>
      {text.author && <p className="un-author">{text.author}</p>}
      {text.sourceLine && <p className="un-source">{text.sourceLine}</p>}
      {text.body.kind === "poem" ? (
        <PoemText stanzas={text.body.stanzas} lineNumbers={text.body.lineNumbers} />
      ) : text.body.kind === "prose" ? (
        <ProseText paragraphs={text.body.paragraphs} />
      ) : (
        <VisualText image={text.body.image} alt={text.body.alt} />
      )}
      {text.footnotes && text.footnotes.length > 0 && <Footnotes notes={text.footnotes} />}
    </article>
  );
}
