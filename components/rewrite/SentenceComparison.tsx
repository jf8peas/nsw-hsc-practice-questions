import type { RewriteCreditedSpan, RewriteLanguageNote } from "@/lib/grading";
import { countWords } from "@/lib/wordcount";

import { findSpanOffsets, HighlightedSegments, HighlightedText } from "./highlight";

/**
 * The sentence comparison (spec 006 FR-026, FR-027): the student's final sentence ("YOUR RETRY",
 * or "YOUR SENTENCE" when phase 1 was final) with every credited term highlighted, beside the
 * "MODEL SENTENCE" card with the target terms in bold and one commentary line. A validated
 * language note underlines the wrong word in the sentence (wavy danger-500) and adds one note
 * line below; absent → nothing extra.
 */
export function SentenceComparison({
  finalLabel,
  finalSentence,
  finalSpans,
  languageNote,
  modelSentences,
  modelTerms,
}: {
  finalLabel: "YOUR RETRY" | "YOUR SENTENCE";
  finalSentence: string;
  finalSpans: RewriteCreditedSpan[];
  languageNote?: RewriteLanguageNote;
  modelSentences: string[];
  modelTerms: string[];
}) {
  const creditSegments = finalSpans.flatMap((s) =>
    findSpanOffsets(finalSentence, s.span).map(([start, end]) => ({ start, end, className: "rw-credit" })),
  );
  const misspellSegments = (languageNote?.spelling ?? []).flatMap((s) =>
    findSpanOffsets(finalSentence, s.wrong).map(([start, end]) => ({ start, end, className: "rw-misspell" })),
  );
  const model = modelSentences[0] ?? "";
  const modelRanges = modelTerms.flatMap((t) => findSpanOffsets(model, t));
  const wordCount = countWords(model);

  return (
    <div className="rw-compare">
      <div className="rw-compare-card">
        <span className="rw-compare-label">{finalLabel}</span>
        <p className="rw-compare-text">
          <HighlightedSegments text={finalSentence} segments={[...creditSegments, ...misspellSegments]} />
        </p>
        {languageNote && <LanguageNote note={languageNote} />}
      </div>
      <div className="rw-compare-card model">
        <span className="rw-compare-label">Model sentence</span>
        <p className="rw-compare-text">
          <HighlightedText text={model} ranges={modelRanges} className="rw-model-term" />
        </p>
        <p className="rw-compare-note">
          {wordCount} {wordCount === 1 ? "word" : "words"} — the terms do the work, so it can be short.
        </p>
      </div>
    </div>
  );
}

function LanguageNote({ note }: { note: RewriteLanguageNote }) {
  const parts: string[] = [];
  for (const s of note.spelling ?? []) {
    parts.push(`Spelling: ${s.wrong} → ${s.fix}.`);
  }
  if (note.grammar) parts.push(note.grammar);
  if (parts.length === 0) return null;
  return (
    <p className="rw-compare-note">
      <WavyIcon />
      <span>{parts.join(" ")}</span>
    </p>
  );
}

function WavyIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--rd-danger-500)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20h16" />
      <path d="M6 16l6-12 6 12" />
      <path d="M8.5 11h7" />
    </svg>
  );
}