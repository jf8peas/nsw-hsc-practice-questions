"use client";

import { useEffect, useState } from "react";

import { computeStats, resetScores, type UnitStats } from "@/lib/scores";

const EMPTY: UnitStats = {
  hasScores: false,
  attempts: 0,
  allTime: null,
  last3: null,
  last: null,
};

export function UnitStatsPanel({ unitId }: { unitId: string }) {
  const [stats, setStats] = useState<UnitStats>(EMPTY);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setStats(computeStats(unitId));
    setMounted(true);
  }, [unitId]);

  function handleReset() {
    if (!window.confirm("Reset all saved scores for this unit? This cannot be undone.")) {
      return;
    }
    resetScores(unitId);
    setStats(computeStats(unitId));
  }

  const show = (v: number | null) => (mounted && v !== null ? `${v}%` : "—");

  return (
    <>
      <div className="stat-grid">
        <div className="rd-card stat">
          <div className="label">All-time avg</div>
          <div className="value">{show(stats.allTime)}</div>
          <div className="note">
            {stats.hasScores
              ? `${stats.attempts} ${stats.attempts === 1 ? "attempt" : "attempts"}`
              : ""}
          </div>
        </div>
        <div className="rd-card stat">
          <div className="label">Last 3 avg</div>
          <div className="value">{show(stats.last3)}</div>
        </div>
        <div className="rd-card stat">
          <div className="label">Last score</div>
          <div className="value">{show(stats.last)}</div>
        </div>
      </div>

      {stats.hasScores ? (
        <button className="link-btn" onClick={handleReset}>
          Reset all scores for this unit
        </button>
      ) : (
        <div style={{ height: 20 }} />
      )}
    </>
  );
}
