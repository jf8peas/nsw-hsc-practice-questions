import Link from "next/link";

import { HistoryUnavailable } from "@/components/HistoryUnavailable";
import { Shell } from "@/components/Shell";
import { getUnit } from "@/content";
import { requirePageUser } from "@/lib/auth.server";
import { loadProgress } from "@/lib/db/queries/history.server";
import { TREND_ARROW, TREND_LABEL, formatWhen } from "@/lib/format";

export default async function ProgressPage() {
  const { user, degraded } = await requirePageUser();
  const loaded = degraded ? ({ status: "unavailable" } as const) : await loadProgress(user.id);

  return (
    <Shell backHref="/">
      <h1 className="page-h1">My progress</h1>
      <p className="page-sub">Every unit you have attempted, on any device you sign in on.</p>

      {loaded.status === "unavailable" ? (
        <HistoryUnavailable />
      ) : loaded.data.length === 0 ? (
        <div className="rd-card" style={{ padding: 20 }}>
          <p style={{ margin: "0 0 12px" }}>
            You haven&apos;t attempted anything yet. Pick a unit and your results will show up here.
          </p>
          <Link href="/" className="rd-btn primary">
            Browse units
          </Link>
        </div>
      ) : (
        loaded.data.map((p) => {
          const unit = getUnit(p.unitId);
          return (
            <section className="rd-card progress-card" key={p.unitId}>
              <h2>
                <Link href={`/unit/${p.unitId}`}>{unit?.title ?? p.unitId}</Link>
              </h2>
              <div className="progress-meta">
                <span>
                  Attempts <strong>{p.attemptCount}</strong>
                </span>
                <span>
                  Latest <strong>{p.latest === null ? "—" : `${p.latest}%`}</strong>
                </span>
                <span>
                  Best <strong>{p.best === null ? "—" : `${p.best}%`}</strong>
                </span>
                <span className={`trend ${p.trend.kind}`}>
                  {TREND_ARROW[p.trend.kind]} {TREND_LABEL[p.trend.kind]}
                </span>
              </div>
              <ul className="attempt-list">
                {p.recent.map((a) => (
                  <li key={a.id}>
                    <Link href={`/attempts/${a.id}`} className="attempt-row">
                      <span className="attempt-when">{formatWhen(a.startedAt)}</span>
                      <span className="attempt-score">
                        {a.marks}/{a.max} · {a.percent}%
                      </span>
                      {a.completedAt === null && <span className="rd-pill warn">incomplete</span>}
                      <span className="chev" aria-hidden="true">
                        ›
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </Shell>
  );
}
