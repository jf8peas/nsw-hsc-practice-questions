import Link from "next/link";

import { EssayHeader, PlanText } from "@/components/essay/shared";
import { EssayResult } from "@/components/essay/Result";
import type { EssayResultView, PublicEssay } from "@/lib/essay/types";
import type { EssayScaffold } from "@/lib/essay/scaffold";

// One essay attempt in full (spec 010 R11). A finished attempt shows the student's own result, including the band 1
// model essay; an unfinished one shows the plan and the draft only, never the model essay (Principle I). A server
// component: it takes plain data built by lib/essay/results.server.ts.

export function EssayAttemptDetail({
  essay,
  result,
  plan,
  draft,
  backHref,
}: {
  essay: PublicEssay;
  result: EssayResultView | null;
  plan: EssayScaffold;
  draft: string;
  backHref: string;
}) {
  if (result) return <EssayResult result={result} />;
  return (
    <div className="es-card">
      <EssayHeader essay={essay} />
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
