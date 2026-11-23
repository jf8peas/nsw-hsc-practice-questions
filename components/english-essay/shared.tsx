import type { PublicEnglishEssay } from "@/lib/english-essay/types";

import { DirectiveQuestionBlock } from "./DirectiveQuestionBlock";

// Pieces the English essay unit's screens share (spec 011): the question with its directive highlighted and defined, the
// school-trial source credit and the prescribed text.

export function EnglishEssayHeader({ essay }: { essay: PublicEnglishEssay }) {
  return (
    <div className="es-header">
      <DirectiveQuestionBlock essay={essay} />
      <p className="es-source">Source: {essay.source}</p>
      <p className="es-economy">You write about your prescribed text, Michael Gow’s Away.</p>
    </div>
  );
}
