"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { startAttempt } from "@/lib/startAttempt";

/**
 * "Start quiz" / "Start new attempt": asks the server to draw a new attempt,
 * then opens it. Works whether or not the attempt could be stored (`persisted`).
 */
export function StartQuiz({
  unitId,
  label = "Start quiz",
  primary = true,
}: {
  unitId: string;
  label?: string;
  primary?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);

  async function start() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await startAttempt(unitId);
    if (result.ok) {
      router.push(`/unit/${unitId}/quiz?attempt=${result.attemptId}`);
      return; // keep the button busy while navigating
    }
    setError(result.error);
    setSignedOut(Boolean(result.unauthenticated));
    setBusy(false);
  }

  return (
    <>
      <button
        type="button"
        className={`rd-btn ${primary ? "primary " : ""}xl`}
        style={{ width: "100%", justifyContent: "center", fontWeight: 600 }}
        onClick={start}
        disabled={busy}
      >
        {busy ? "Starting…" : label}
      </button>
      {error && (
        <div style={{ color: "var(--rd-danger-500)", fontSize: 13, marginTop: 8 }} role="alert">
          {error}{" "}
          {signedOut && (
            <a href={`/signin?callbackUrl=${encodeURIComponent(`/unit/${unitId}`)}`}>Sign in</a>
          )}
        </div>
      )}
    </>
  );
}
