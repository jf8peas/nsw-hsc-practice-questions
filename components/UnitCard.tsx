import Link from "next/link";

import { unitIsNew } from "@/content";
import type { Unit } from "@/content";

function quizSize(unit: Unit): string {
  if (!unit.quiz) return `${unit.questions.length} questions`;
  const n = unit.quiz.groups
    ? unit.quiz.groups.reduce((s, g) => s + g.n, 0)
    : unit.quiz.short + unit.quiz.mc;
  return `${n} questions per attempt`;
}

/**
 * One unit on the home page. `toReview` is how many concepts are not yet cleared, so the
 * card can show "{n} to review" (absent when there is nothing to review).
 */
export function UnitCard({ unit, toReview }: { unit: Unit; toReview?: number }) {
  return (
    <Link href={`/unit/${unit.id}`} className="unit-card">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="unit-badges">
          {toReview !== undefined && toReview > 0 && (
            <span className="rd-pill review">{toReview} to review</span>
          )}
          {unitIsNew(unit) && <span className="rd-pill new-pill">NEW</span>}
          <span className="rd-pill blue">{unit.type}</span>
          <span className="rd-pill date-pill">{unit.created}</span>
        </div>
        <div className="unit-title" style={{ marginTop: 6 }}>
          {unit.title}
        </div>
        <div className="unit-meta">{quizSize(unit)}</div>
      </div>
      <span className="chev">›</span>
    </Link>
  );
}
