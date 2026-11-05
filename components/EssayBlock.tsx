import { CheckIcon } from "@/components/paragraph/Frame";
import type { EssayProgress } from "@/lib/attempts/sequence.server";
import { PARTS, partKeyOf } from "@/lib/paragraph/parts";

/**
 * The essay in progress, in the unit page's intro card (spec 007 FR-004, design §4.1): "Essay 3 of
 * 12 · next: Evidence & Application", the essay question with its directive verb highlighted, the
 * model economy, and five part dots with the recorded mark on each finished part. Public data
 * only (the question, verb, economy and recorded marks); never the brief or any model text.
 */
export function EssayBlock({ progress }: { progress: Extract<EssayProgress, { finished: false }> }) {
  const { question, verb, essayNo, essayTotal, economy, parts, nextPart } = progress;
  const idx = question.toLowerCase().indexOf(verb.toLowerCase());
  const before = idx >= 0 ? question.slice(0, idx) : question;
  const hit = idx >= 0 ? question.slice(idx, idx + verb.length) : "";
  const after = idx >= 0 ? question.slice(idx + verb.length) : "";
  return (
    <div className="pg-essay">
      <div className="pg-essay-head">
        Essay {essayNo} of {essayTotal} · next: {PARTS[partKeyOf(nextPart)].name}
      </div>
      <p className="pg-essay-q">
        “{before}
        {hit && <mark className="pg-verb">{hit}</mark>}
        {after}” <span className="pg-essay-economy">· Model economy: {economy}</span>
      </p>
      <ol className="pg-dots" aria-label={`Essay ${essayNo} parts`}>
        {parts.map((p) => (
          <li key={p.part} className={`pg-dot ${p.state}`} aria-current={p.state === "next" ? "step" : undefined}>
            <span className="pg-dot-circle">{p.state === "done" ? <CheckIcon size={14} /> : p.part}</span>
            <span className="pg-dot-label">{p.short}</span>
            <span className="pg-dot-note">{p.state === "done" ? `${p.mark}/4` : p.state === "next" ? "next" : ""}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** The button label: "Start essay (Part 1 of 5)" at the start of an essay, else "Continue essay (Part N of 5)". */
export function essayButtonLabel(nextPart: number): string {
  return nextPart === 1 ? "Start essay (Part 1 of 5)" : `Continue essay (Part ${nextPart} of 5)`;
}
