"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Dialog } from "@/components/unseen/Dialog";

// "Discard this attempt" (spec 010 FR-002a): offered only on the open, unmarked essay, behind a confirm that says
// what is deleted. Marked essays are never touched.

export function DiscardButton({
  attemptId,
  attemptToken,
  questionId,
  endpoint = "/api/essay/discard",
}: {
  attemptId: string;
  attemptToken: string;
  questionId: string;
  /** The discard route; the Economics essay's by default (spec 011 passes the English one). */
  endpoint?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function discard() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId, attemptToken, questionId }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(
        body?.error === "marking_in_progress"
          ? "Your essay is being marked right now, so it can’t be discarded. Try again in a minute."
          : body?.error === "already_finished"
            ? "This essay has already been marked, so it can’t be discarded."
            : "That didn’t work. Try again.",
      );
    } catch {
      setError("Could not reach the server. Try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <button type="button" className="rd-btn xl" onClick={() => setOpen(true)}>
        Discard this attempt
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} label="Discard this attempt?" className="es-dialog">
        <p>This deletes your plan and anything you have written for this attempt. Essays you have already had marked are not affected.</p>
        {error && (
          <p className="es-error" role="alert">
            {error}
          </p>
        )}
        <div className="es-actions">
          <button type="button" className="rd-btn xl" onClick={() => setOpen(false)} disabled={busy}>
            Keep it
          </button>
          <button type="button" className="rw-btn" onClick={() => void discard()} disabled={busy}>
            {busy ? "Discarding…" : "Discard"}
          </button>
        </div>
      </Dialog>
    </>
  );
}
