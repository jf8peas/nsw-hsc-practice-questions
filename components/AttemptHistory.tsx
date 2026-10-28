import Link from "next/link";

import { SectionHead } from "@/components/SectionHead";
import { formatWhen } from "@/lib/format";
import type { UnitHistory } from "@/lib/db/queries/history.server";

/**
 * Two sections of the unit page: "Your results" (best, latest and how many attempts) and
 * "Past attempts" (each attempt, newest first, opening to its answers). Best and latest come
 * from COMPLETED attempts only; unfinished attempts are listed and labelled "incomplete".
 */
export function AttemptHistory({ history }: { history: UnitHistory }) {
  const { attempts, best, latest, completed } = history;
  const show = (v: number | null) => (v === null ? "—" : `${v}%`);

  // Change in the latest completed score since the completed attempt before it.
  const done = attempts.filter((a) => a.completedAt !== null); // newest first
  const change = done.length >= 2 ? done[0].percent - done[1].percent : null;
  const inProgress = attempts.length - completed;

  return (
    <>
      <section className="unit-section" aria-labelledby="results-title">
        <SectionHead id="results-title" title="Your results" />

        {attempts.length === 0 ? (
          <div className="section-empty">
            No attempts yet. Your scores will appear here after your first quiz, on any device.
          </div>
        ) : (
          <div className="rd-card stat-strip">
            <div className="stat-cell">
              <div className="stat-label">Best</div>
              <div className="stat-value">{show(best)}</div>
              <div className="stat-note">
                {completed > 0 ? `from ${completed} completed` : "none completed yet"}
              </div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Latest</div>
              <div className="stat-value">{show(latest)}</div>
              <div className={`stat-note${change === null ? "" : change > 0 ? " up" : change < 0 ? " down" : ""}`}>
                {change === null
                  ? completed === 1
                    ? "first result"
                    : ""
                  : change === 0
                    ? "same as before"
                    : `${change > 0 ? "↑" : "↓"} ${Math.abs(change)} pts on last`}
              </div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Attempts</div>
              <div className="stat-value">{attempts.length}</div>
              <div className="stat-note">{inProgress > 0 ? `${inProgress} in progress` : ""}</div>
            </div>
          </div>
        )}
      </section>

      {attempts.length > 0 && (
        <section className="unit-section" aria-labelledby="attempt-history-title">
          <SectionHead
            id="attempt-history-title"
            title="Past attempts"
            sub="Open an attempt to see each of your answers with its marks and feedback."
          />
          <ul className="attempt-list">
            {attempts.map((a, i) => (
              <li key={a.id}>
                <Link href={`/attempts/${a.id}`} className="unit-attempt">
                  <span className="unit-attempt-main">
                    <span className="unit-attempt-name">
                      Attempt {attempts.length - i}
                      {a.completedAt === null && (
                        <span className="rd-pill warn" title={`${a.answered} of ${a.total} answered`}>
                          incomplete
                        </span>
                      )}
                    </span>
                    <span className="unit-attempt-when">{formatWhen(a.startedAt)}</span>
                  </span>
                  <span className="unit-attempt-bar" aria-hidden="true">
                    <span style={{ width: `${Math.max(0, Math.min(100, a.percent))}%` }} />
                  </span>
                  <span className="unit-attempt-score">
                    <span className="unit-attempt-pct">{a.percent}%</span>
                    <span className="unit-attempt-marks">
                      {a.marks}/{a.max}
                    </span>
                  </span>
                  <span className="chev" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
