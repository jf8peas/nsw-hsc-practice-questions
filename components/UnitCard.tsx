import Link from "next/link";

import { unitIsNew } from "@/content";
import type { Unit } from "@/content";

import { ArchiveButton } from "./ArchiveButton";

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
 *
 * The card is a link over the main area; the Archive/Unarchive button sits alongside it
 * (never nested in the anchor). `archived` mutes the card and offers "Unarchive",
 * `canArchive` (14+ days old and not archived) offers "Archive", and `archivesOk` gates
 * both: while the database is down or the archive load failed there are no buttons at all.
 */
export function UnitCard({
  unit,
  toReview,
  archived = false,
  canArchive = false,
  archivesOk = false,
}: {
  unit: Unit;
  toReview?: number;
  archived?: boolean;
  canArchive?: boolean;
  archivesOk?: boolean;
}) {
  const showArchive = archivesOk && (archived || canArchive);

  return (
    <div className={`unit-card${archived ? " archived" : ""}`}>
      <Link href={`/unit/${unit.id}`} className="unit-card-main">
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
      </Link>
      {showArchive && <ArchiveButton unitId={unit.id} archived={archived} />}
      <span className="chev" aria-hidden="true">
        ›
      </span>
    </div>
  );
}
