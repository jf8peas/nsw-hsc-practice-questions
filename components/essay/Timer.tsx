"use client";

import { useEffect, useRef, useState } from "react";

// The optional 50-minute timer (spec 010 FR-022): started by the student, never enforced, and kept only in this
// page (a reload shows it unstarted). At zero it says so in a polite status and leaves Submit exactly as it was.
// No animation, so reduced motion needs nothing.

export const TIMER_SECONDS = 50 * 60;

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function Timer({ seconds = TIMER_SECONDS }: { seconds?: number }) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [left, setLeft] = useState(seconds);
  const announced = useRef(false);

  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => setLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const done = endsAt !== null && left === 0;
  useEffect(() => {
    if (done) announced.current = true;
  }, [done]);

  if (endsAt === null) {
    return (
      <div className="es-timer">
        <button type="button" className="rd-btn xl" onClick={() => setEndsAt(Date.now() + seconds * 1000)}>
          Start {Math.round(seconds / 60)}-minute timer
        </button>
        <span className="es-item-note">Optional. It never stops you submitting.</span>
      </div>
    );
  }
  return (
    <div className="es-timer">
      <span className="es-timer-clock" aria-hidden={!done}>
        {done ? "00:00" : `${clock(left)} left`}
      </span>
      <span className="es-timer-note" role="status" aria-live="polite">
        {done ? "Time is up. You can still submit." : ""}
      </span>
    </div>
  );
}
