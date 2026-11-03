import type { RewriteDiscussion } from "@/lib/grading";

import { LockedSentence } from "./LockedSentence";
import { TermTable, type TermRow } from "./TermTable";

/**
 * The self-mark screen (spec 006 FR-037): the degrade path in the new layout — the student's
 * sentence stays visible as the locked block, the model-sentence card and the term table (without
 * status pills) follow, each term row and criteria (a) and (c) get a checkbox, and the footer
 * button is "Save my mark". Behaviour is unchanged from spec 005 (FR-030, FR-046): no phase 2,
 * and the per-term ticks still feed concept tracking server-side.
 */
export function SelfMarkScreen({
  sentence,
  wordCount,
  discussion,
  ticks,
  onTermTick,
  onCriterionTick,
  onSave,
  busy,
}: {
  sentence: string;
  wordCount: number;
  discussion: RewriteDiscussion;
  ticks: { criterionA: boolean; termTicks: Record<string, boolean>; criterionC: boolean };
  onTermTick: (term: string, checked: boolean) => void;
  onCriterionTick: (criterion: "a" | "c", checked: boolean) => void;
  onSave: () => void;
  busy: boolean;
}) {
  const rows: TermRow[] = discussion.terms.map((t) => ({
    term: t.term,
    definition: t.definition,
    why: t.why,
    status: "not-used",
  }));
  return (
    <div className="rw-selfmark">
      <LockedSentence label="Your sentence" sentence={sentence} wordCount={wordCount} />
      <div className="rw-compare-card model" style={{ marginTop: 12 }}>
        <span className="rw-compare-label">Model sentence</span>
        {discussion.modelSentences.map((s, i) => (
          <p key={i} className="rw-compare-text">
            {s}
          </p>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <TermTable terms={rows} selfMark ticks={ticks.termTicks} onTick={onTermTick} />
      </div>
      <label className="rw-check" style={{ marginTop: 12 }}>
        <input
          type="checkbox"
          checked={ticks.criterionA}
          onChange={(e) => onCriterionTick("a", e.target.checked)}
        />
        (a) The meaning and the cause and effect are kept and correct.
      </label>
      <label className="rw-check">
        <input
          type="checkbox"
          checked={ticks.criterionC}
          onChange={(e) => onCriterionTick("c", e.target.checked)}
        />
        (c) The sentence is concise (25 words or fewer, no padding).
      </label>
      <button type="button" className="rw-btn" style={{ marginTop: 10 }} onClick={onSave} disabled={busy}>
        {busy ? "Saving…" : "Save my mark"}
      </button>
    </div>
  );
}