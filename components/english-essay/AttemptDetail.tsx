import Link from "next/link";

import { PlanText } from "./PlanReadout";
import { EnglishEssayResult } from "./Result";
import { EnglishEssayHeader } from "./shared";
import type { EnglishEssayResultView, EnglishEssayScaffold, PublicEnglishEssay } from "@/lib/english-essay/types";

// One English essay attempt in full (spec 011 FR-029). A finished attempt shows the student's own result, including the
// band 1 model essay; an unfinished one shows the public question, the plan and the draft only, never the model essay or any
// marking field (Principle I). A server component: it takes plain data built by lib/english-essay/results.server.ts.

export function EnglishEssayAttemptDetail({
  essay,
  result,
  plan,
  draft,
  backHref,
}: {
  essay: PublicEnglishEssay;
  result: EnglishEssayResultView | null;
  plan: EnglishEssayScaffold;
  draft: string;
  backHref: string;
}) {
  if (result) return <EnglishEssayResult result={result} />;
  return (
    <div className="es-card">
      <EnglishEssayHeader essay={essay} />
      <p className="pg-notice" role="status">
        This essay is not finished yet. <Link href={backHref}>Go back to the essays</Link> to carry on.
      </p>
      <section>
        <h3>Your plan</h3>
        <PlanText plan={plan} />
      </section>
      {draft && (
        <section>
          <h3>Your essay so far</h3>
          <p className="es-essay-text">{draft}</p>
        </section>
      )}
    </div>
  );
}
