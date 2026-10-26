import { HISTORY_UNAVAILABLE } from "@/lib/format";

/** Shown instead of the history sections while the database cannot be reached (never a 500). */
export function HistoryUnavailable() {
  return (
    <div className="notice" role="status">
      {HISTORY_UNAVAILABLE}
    </div>
  );
}
