import Link from "next/link";

import { Shell } from "@/components/Shell";
import type { Unit } from "@/content";
import { unitsByYear } from "@/content";

function quizSize(unit: Unit): string {
  if (!unit.quiz) return `${unit.questions.length} questions`;
  const n = unit.quiz.groups
    ? unit.quiz.groups.reduce((s, g) => s + g.n, 0)
    : unit.quiz.short + unit.quiz.mc;
  return `${n} questions per attempt`;
}

function UnitCard({ unit }: { unit: Unit }) {
  return (
    <Link href={`/unit/${unit.id}`} className="unit-card">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="unit-badges">
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

export default function HomePage() {
  const groups = unitsByYear();

  return (
    <Shell>
      <h1 className="page-h1">Units</h1>
      <p className="page-sub">
        Pick a unit to practice topic questions or a milestone test.
      </p>

      {groups.map((group) => (
        <div key={group.year} style={{ marginBottom: 28 }}>
          <div className="eyebrow">{group.year}</div>
          {group.isEmpty ? (
            <div className="coming-soon">More units coming soon</div>
          ) : (
            group.units.map((unit) => <UnitCard key={unit.id} unit={unit} />)
          )}
        </div>
      ))}
    </Shell>
  );
}
