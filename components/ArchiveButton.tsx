"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * The Archive / Unarchive action on a home-page unit card. Purely per-student and server
 * validated (the route re-checks the unit exists and, for archive, that it is 14+ days old):
 * this component only sends the request and refreshes on success.
 */
export function ArchiveButton({ unitId, archived }: { unitId: string; archived: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const label = archived ? "Unarchive" : "Archive";
  const busy = archived ? "Unarchiving…" : "Archiving…";

  function onToggle() {
    startTransition(async () => {
      const res = await fetch(`/api/units/${unitId}/archive`, {
        method: archived ? "DELETE" : "POST",
      });
      if (res.ok) router.refresh();
    });
  }

  return (
    <button
      type="button"
      className="unit-archive-btn"
      onClick={onToggle}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? busy : label}
    </button>
  );
}
