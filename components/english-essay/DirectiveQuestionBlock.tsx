import { splitAtDirective } from "@/content/units/y12-english-essay-writing/directives";
import type { PublicEnglishEssay } from "@/lib/english-essay/types";

// The English essay question in curly quotes with its directive phrase highlighted (bold, not colour alone) and defined
// (spec 011 FR-005, data-model §1.3). The highlight is the whole stored phrase, whitespace-tolerant, on letter boundaries:
// "how" is never highlighted inside "show" or "however". NESA glossary meanings are shown plainly; the two unit-written
// meanings carry the "Unit guidance (not a NESA glossary definition)" label.

export function DirectiveQuestionBlock({ essay }: { essay: PublicEnglishEssay }) {
  const parts = splitAtDirective(essay.prompt, essay.directive);
  return (
    <div className="pg-question">
      <div className="pg-label">ESSAY QUESTION</div>
      <p className="pg-question-text">
        {"“"}
        {parts ? (
          <>
            {parts.before}
            <mark className="pg-verb">{parts.match}</mark>
            {parts.after}
          </>
        ) : (
          essay.prompt
        )}
        {"”"}
      </p>
      <p className="pg-verb-def">
        <strong>{parts?.match ?? essay.directive}</strong> — {essay.directiveDefinition}
        {essay.directiveGuidance === "unit" && <span className="es-guidance-label"> (Unit guidance, not a NESA glossary definition)</span>}
      </p>
    </div>
  );
}
