"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

import type { UnseenText } from "@/lib/types";

import { TextPanel } from "./Text";

// The texts of a comparative question in tabs (spec 009 FR-002 to FR-005, research R4): one tab per text, labelled
// as on the paper ("Text 4 – Poem"), on every screen size (never side by side). WAI-ARIA tabs pattern: a tablist
// with a roving tabindex, arrow keys (and Home and End) move and select, each panel is labelled by its tab. Every
// panel stays MOUNTED and the inactive ones are hidden, so each text keeps its highlights, its live sync with the
// tabbed-out page and its zoomed image while the student switches. The tabs sit above the question and the answer
// box, so switching never moves or clears the box. Each panel is spec 008's TextPanel, so each text has its own
// open-in-a-new-tab icon (this text only, never the pair) and its own highlighter.

export function TextTabs({
  texts,
  unitId,
  attemptId,
  uid,
  final,
  picked,
}: {
  texts: UnseenText[];
  unitId: string;
  attemptId: string;
  /** The signed-in student, so highlights are kept per student on this device. */
  uid: string;
  /** The question is finished: its highlights are removed 30 days later. */
  final: boolean;
  /** The ids of the texts the student picked (a choice question): their tabs say so in words. */
  picked?: readonly string[];
}) {
  const base = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  function move(to: number) {
    const next = (to + texts.length) % texts.length;
    setActive(next);
    tabs.current[next]?.focus();
  }
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") move(i + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") move(i - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(texts.length - 1);
    else return;
    e.preventDefault();
  }

  return (
    <div className="un-tabs">
      <div role="tablist" aria-label="The texts for this question" className="un-tablist">
        {texts.map((t, i) => {
          const selected = i === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              className={`un-tab${selected ? " selected" : ""}`}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span className="un-tab-label">{t.heading}</span>
              {picked?.includes(t.id) && <span className="un-tab-picked">Picked</span>}
            </button>
          );
        })}
      </div>
      {texts.map((t, i) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${i}`}
          aria-labelledby={`${base}-tab-${i}`}
          hidden={i !== active}
          className="un-tabpanel"
        >
          <TextPanel
            text={t}
            openHref={`/unit/${unitId}/text/${t.id}?attempt=${attemptId}`}
            highlight={{ userId: uid, attemptId, final }}
          />
        </div>
      ))}
    </div>
  );
}
