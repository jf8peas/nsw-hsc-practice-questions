import { conceptsOf } from "@/content";
import { ConceptLive } from "@/components/ConceptLive";
import { SectionHead } from "@/components/SectionHead";
import type { ApprovedContent, ConceptContentView } from "@/lib/db/queries/concepts.server";
import type { Loaded } from "@/lib/db/queries/history.server";
import type { ConceptState } from "@/lib/concepts/progress";
import type { Unit } from "@/lib/types";

/** What the student sees when the weak-concept list cannot be loaded (never an error). */
export const CONCEPTS_UNAVAILABLE = "We could not load your weak concepts right now.";

const countLabel = (count: number) => `${count} more correct ${count === 1 ? "answer" : "answers"} needed`;

/** Correct answers in a row that clear a concept (a miss sets the count back to this). */
const TO_CLEAR = 3;

/**
 * How close a concept is to being cleared: one pip per correct answer needed, filled as they
 * are earned, with "n to go" beside them. Screen readers get the full sentence instead.
 */
function ConceptProgress({ count }: { count: number }) {
  const earned = TO_CLEAR - count;
  return (
    <span className="concept-progress">
      <span className="concept-pips" aria-hidden="true">
        {Array.from({ length: TO_CLEAR }, (_, i) => (
          <span key={i} className={i < earned ? "pip on" : "pip"} />
        ))}
      </span>
      <span className="concept-togo" aria-hidden="true">
        {count} to go
      </span>
      <span className="visually-hidden">{countLabel(count)}</span>
    </span>
  );
}

/**
 * "Concepts to review": the student's uncleared concepts in a unit, highest count first,
 * each with its one-line description and how many correct answers are still needed. A concept
 * whose summary has been reviewed and approved opens to show it (and its picture, if any); one
 * that has not is just its description, with no error and no empty space (spec 002 FR-031).
 * Pictures are `<img>` elements only, never inline markup (constitution Principle VII).
 * A server component; the only client code is the invisible ConceptLive refresher.
 */
export function ConceptPanel({
  unit,
  progress,
  view,
}: {
  unit: Unit;
  progress: Loaded<ConceptState[]>;
  /** Approved content for the listed concepts. Absent or unavailable means descriptions only. */
  view?: Loaded<ConceptContentView>;
}) {
  if (!unit.conceptsReady) return null;
  const descriptions = new Map(conceptsOf(unit).map((c) => [c.id, c.description]));
  const content: Map<string, ApprovedContent> = view?.status === "ok" ? view.data.content : new Map();

  const states = progress.status === "ok" ? progress.data : [];
  const needsContent = states.some((s) => !content.get(s.conceptId)?.summary);

  return (
    <section className="unit-section concept-panel" aria-labelledby="concepts-title">
      <SectionHead
        id="concepts-title"
        title="Concepts to review"
        aside={states.length > 0 ? <span className="rd-pill review">{states.length} to review</span> : undefined}
        sub={
          states.length > 0
            ? `Ideas you have missed in this quiz. Answer each one correctly ${TO_CLEAR} times in a row to clear it; your next attempts include extra questions on them.`
            : undefined
        }
      />

      {progress.status === "unavailable" ? (
        <div className="notice" role="status">
          {CONCEPTS_UNAVAILABLE}
        </div>
      ) : states.length === 0 ? (
        <div className="section-empty">
          All clear — nothing to review right now. Any concept you miss in a quiz will show up here.
        </div>
      ) : (
        <ul className="concept-list">
          {states.map((state) => {
            const description = descriptions.get(state.conceptId) ?? state.conceptId;
            const approved = content.get(state.conceptId);
            if (!approved?.summary) {
              return (
                <li key={state.conceptId} className="concept-item">
                  <span className="concept-desc">{description}</span>
                  <ConceptProgress count={state.count} />
                </li>
              );
            }
            return (
              <li key={state.conceptId} className="concept-item concept-has-detail">
                <details className="concept-details">
                  <summary>
                    <span className="concept-desc">{description}</span>
                    <span className="concept-end">
                      <ConceptProgress count={state.count} />
                      <span className="concept-chev" aria-hidden="true" />
                    </span>
                  </summary>
                  <ul className="concept-bullets">
                    {approved.summary.bullets.map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                  {approved.illustration && (
                    // eslint-disable-next-line @next/next/no-img-element -- a same-origin SVG route, never inline markup
                    <img
                      className="concept-illustration"
                      src={`/api/concepts/${state.conceptId}/illustration?v=${approved.illustration.versionId}`}
                      alt={approved.illustration.alt}
                      loading="lazy"
                    />
                  )}
                </details>
              </li>
            );
          })}
        </ul>
      )}

      {progress.status === "ok" && states.length > 0 && view?.status === "ok" && (
        <ConceptLive
          unitId={unit.id}
          needsContent={needsContent}
          initialPending={view.data.pending}
          initialVersion={view.data.version}
        />
      )}
    </section>
  );
}
