"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatWhen } from "@/lib/format";

// Teacher control on /admin/concepts (spec 002 FR-054, FR-055): asks the server to generate a
// replacement for one concept item. The server decides everything; this only reports the answer
// and refreshes the page once. No polling: the teacher reloads to see the result.

type Kind = "summary" | "illustration";

const REFUSALS: Record<string, string> = {
  busy: "A run is already in progress for this item.",
  not_found: "This item cannot be regenerated (not found, or its model is not set).",
  no_illustration_brief: "The summary decided no picture is needed, so there is nothing to draw.",
  reviewer_unavailable: "No usable review model is set, so a replacement could not be approved.",
  temporarily_unavailable: "The database is temporarily unavailable.",
  forbidden: "You are not allowed to do this.",
};

export function RegenerateButton({ conceptId, kind }: { conceptId: string; kind: Kind }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function regenerate() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/concepts/regenerate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conceptId, kind }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; resetsAt?: string };
      if (res.status === 202) {
        setMessage("Queued");
        router.refresh();
      } else if (res.status === 429) {
        setMessage(
          `Today's concept generation limit is used up${body.resetsAt ? `; it resets ${formatWhen(body.resetsAt)}` : ""}.`,
        );
      } else {
        setMessage(REFUSALS[body.error ?? ""] ?? "That did not work. Try again.");
      }
    } catch {
      setMessage("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="regen">
      <button type="button" className="rd-btn" onClick={regenerate} disabled={busy}>
        {busy ? "Asking…" : `Regenerate ${kind === "summary" ? "summary" : "picture"}`}
      </button>
      {message && (
        <span className="regen-msg" role="status">
          {message}
        </span>
      )}
    </span>
  );
}
