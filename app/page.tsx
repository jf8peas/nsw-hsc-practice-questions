import Link from "next/link";

import { Shell } from "@/components/Shell";
import { unitsByYear } from "@/content";
import { daysUntil, upcomingExams } from "@/content/exams";

export default function HomePage() {
  const groups = unitsByYear();
  const exams = upcomingExams();

  return (
    <Shell>
      <h1 className="page-h1">Units</h1>
      <p className="page-sub">
        Pick a unit to practice topic questions or a milestone test.
      </p>

      {exams.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow">Upcoming</div>
          {exams.map((exam) => {
            const d = daysUntil(exam.date);
            return (
              <div className="rd-card exam-card" key={exam.id}>
                <span className="when">
                  {d === 0 ? "Today" : d === 1 ? "1 day" : `${d} days`}
                </span>
                <span>
                  <span className="exam-title">{exam.title}</span>
                  <br />
                  <span className="exam-date">{exam.date}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {groups.map((group) => (
        <div key={group.year} style={{ marginBottom: 28 }}>
          <div className="eyebrow">{group.year}</div>

          {group.isEmpty ? (
            <div className="coming-soon">More units coming soon</div>
          ) : (
            group.topics.map((topic) => (
              <div key={topic.topic} style={{ marginBottom: 8 }}>
                {topic.units.map((unit) => (
                  <Link
                    key={unit.id}
                    href={`/unit/${unit.id}`}
                    className="unit-card"
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="rd-pill blue">{unit.type}</span>
                      <div className="unit-title" style={{ marginTop: 6 }}>
                        {unit.title}
                      </div>
                      <div className="unit-meta">
                        {unit.quiz
                          ? `${
                              unit.quiz.groups
                                ? unit.quiz.groups.reduce((s, g) => s + g.n, 0)
                                : unit.quiz.short + unit.quiz.mc
                            } questions per attempt`
                          : `${unit.questions.length} questions`}
                      </div>
                    </div>
                    <span className="chev">›</span>
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>
      ))}
    </Shell>
  );
}
