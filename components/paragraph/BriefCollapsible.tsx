"use client";

import { useState } from "react";

import type { ParagraphQuestionView } from "@/lib/paragraph/types";

import { BRIEF_HELP, BRIEF_ROWS, BriefRows } from "./Frame";

/**
 * The brief on the writing screen (spec 007 FR-006): a native <details> that starts open or closed
 * as given and can be toggled freely. The starting state is not saved. Its own client file so
 * Frame.tsx stays usable from server components.
 */
export function BriefCollapsible({
  brief,
  uses,
  initialOpen,
}: {
  brief: ParagraphQuestionView["brief"];
  uses: string[];
  initialOpen: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const usedLabels = BRIEF_ROWS.filter((r) => uses.includes(r.uses)).map((r) => r.label);
  return (
    <section className="pg-section" aria-labelledby="pg-brief-title">
      <details className="pg-brief-details" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary className="pg-brief-summary">
          <svg className="pg-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
          <h3 id="pg-brief-title" className="pg-h3">The brief</h3>
          <span className="pg-help">{open ? BRIEF_HELP : `Use in this part: ${usedLabels.join(" · ")}`}</span>
        </summary>
        <BriefRows brief={brief} uses={uses} />
      </details>
    </section>
  );
}
