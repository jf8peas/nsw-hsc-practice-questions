"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { startAttempt } from "@/lib/startAttempt";
import type { EssayListItem, EssayUnitData } from "@/lib/essay/progress.server";

import { DiscardButton } from "./DiscardButton";
import { ECONOMY_LINE } from "./shared";

// The essay unit's list (spec 010 FR-001 to FR-005): the live essays in the offered order, each with its latest
// mark and one button: Start, Redo (it has a mark) or Resume (it has the open attempt). While an attempt is open
// every other essay is disabled with a reason; the server also refuses a second one.

const ECONOMY_PILL = { china: "China", nepal: "Nepal", both: "China and Nepal" } as const;

export function UnitEssays({ unitId, data }: { unitId: string; data: Pick<EssayUnitData, "essays" | "openAttempt"> }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(item: EssayListItem) {
    if (busy) return;
    setBusy(item.question.id);
    setError(null);
    const result = await startAttempt(unitId, item.question.id);
    if (result.ok) {
      router.push(`/unit/${unitId}/quiz?attempt=${result.attemptId}`);
      return; // stay busy while navigating
    }
    if (result.openEssay) router.refresh(); // another essay is open: the list now says which
    setError(result.error);
    setBusy(null);
  }

  if (data.essays.length === 0) {
    return (
      <p className="pg-notice" role="status">
        Essays are being checked and will appear here.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <p className="es-error" role="alert">
          {error}
        </p>
      )}
      <ul className="es-list">
        {data.essays.map((item) => {
          const q = item.question;
          const blockedByOther = data.openAttempt !== null && !item.open;
          const label = item.open ? "Resume" : item.latest ? "Redo" : "Start";
          return (
            <li key={q.id} className="es-item">
              <div className="es-item-meta">
                <span className="rd-pill blue">{ECONOMY_PILL[q.economy]}</span>
                {item.nextUp && !data.openAttempt && <span className="rd-pill new-pill">Next up</span>}
                {q.source && <span className="es-item-note">{q.source}</span>}
              </div>
              <p className="es-item-q">{q.prompt}</p>
              <p className="es-item-note">{ECONOMY_LINE[q.economy]}</p>
              {item.latest && (
                <p className="es-item-note">
                  Latest mark: <strong>{item.latest.mark} / 20</strong>
                  {item.latest.band ? ` · band ${item.latest.band}` : ""} ·{" "}
                  <Link href={`/attempts/${item.latest.attemptId}`}>see the result</Link>
                </p>
              )}
              <div className="es-item-actions">
                <button
                  type="button"
                  className={`rd-btn ${item.open || item.nextUp ? "primary " : ""}xl`}
                  onClick={() => void start(item)}
                  disabled={blockedByOther || busy !== null}
                  aria-describedby={blockedByOther ? "es-open-note" : undefined}
                >
                  {busy === q.id ? "Starting…" : label}
                </button>
                {item.open && data.openAttempt && (
                  <DiscardButton attemptId={data.openAttempt.attemptId} attemptToken={data.openAttempt.attemptToken} questionId={q.id} />
                )}
                {blockedByOther && (
                  <span id="es-open-note" className="es-item-note">
                    Finish your open essay first.
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
