import Link from "next/link";

import { formatWhen } from "@/lib/format";
import type { UnitHistory } from "@/lib/db/queries/history.server";

/**
 * The student's attempts at a unit. Best and latest come from COMPLETED
 * attempts only; unfinished attempts are listed and labelled "incomplete".
 */
export function AttemptHistory({ history }: { history: UnitHistory }) {
  const { attempts, best, latest, completed } = history;
  const show = (v: number | null) => (v === null ? "—" : `${v}%`);

  return (
    <section aria-labelledby="attempt-history-title" style={{ marginBottom: 20 }}>
      <div className="stat-grid">
        <div className="rd-card stat">
          <div className="label">Best</div>
          <div className="value">{show(best)}</div>
          <div className="note">{completed > 0 ? `${completed} completed` : ""}</div>
        </div>
        <div className="rd-card stat">
          <div className="label">Latest</div>
          <div className="value">{show(latest)}</div>
        </div>
        <div className="rd-card stat">
          <div className="label">Attempts</div>
          <div className="value">{attempts.length}</div>
        </div>
      </div>

      <h2 id="attempt-history-title" className="eyebrow" style={{ margin: "16px 0 8px" }}>
        Your attempts
      </h2>

      {attempts.length === 0 ? (
        <p className="page-sub" style={{ margin: 0 }}>
          No attempts yet. Start a quiz and your results will appear here, on any device.
        </p>
      ) : (
        <ul className="attempt-list">
          {attempts.map((a) => (
            <li key={a.id}>
              <Link href={`/attempts/${a.id}`} className="attempt-row">
                <span className="attempt-when">{formatWhen(a.startedAt)}</span>
                <span className="attempt-score">
                  {a.marks}/{a.max} · {a.percent}%
                </span>
                {a.completedAt === null && (
                  <span className="rd-pill warn" title={`${a.answered} of ${a.total} answered`}>
                    incomplete
                  </span>
                )}
                <span className="chev" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
