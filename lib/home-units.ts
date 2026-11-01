// Pure home-page unit filtering for per-student archiving. No React, no database:
// the page and its tests share exactly the same logic.

import { unitCanArchive, type YearGroup } from "@/content";
import type { Unit, Year } from "@/lib/types";

export interface HomeUnitRow {
  unit: Unit;
  /** The signed-in student has archived this unit (shown muted, with "Unarchive"). */
  archived: boolean;
  /** Old enough to archive (14+ Sydney days) and not already archived. */
  canArchive: boolean;
  /** Shown now: not archived, or "Show all" is on. */
  visible: boolean;
}

export interface HomeYearRow {
  year: Year;
  /** The year has no units at all ("More units coming soon"). */
  isComingSoon: boolean;
  units: HomeUnitRow[];
  /** The rows to render with the current "Show all" setting. */
  visibleUnits: HomeUnitRow[];
  /** Every unit in the year is archived and "Show all" is off: show the notice. */
  allArchivedNote: boolean;
}

export interface HomeUnitsView {
  years: HomeYearRow[];
  /** Anything is archived or old enough to archive, so the "Show all" switch is worth showing. */
  showSwitch: boolean;
}

export function homeUnitsView(
  groups: readonly YearGroup[],
  archivedIds: ReadonlySet<string>,
  showAll: boolean,
  now: Date = new Date(),
): HomeUnitsView {
  const years = groups.map((group) => {
    const rows = group.units.map((unit) => {
      const archived = archivedIds.has(unit.id);
      return {
        unit,
        archived,
        canArchive: !archived && unitCanArchive(unit, now),
        visible: showAll || !archived,
      };
    });
    return {
      year: group.year,
      isComingSoon: group.isEmpty,
      units: rows,
      visibleUnits: rows.filter((r) => r.visible),
      allArchivedNote: !showAll && !group.isEmpty && rows.length > 0 && rows.every((r) => r.archived),
    };
  });

  const showSwitch =
    years.some((y) => y.units.some((u) => u.archived)) ||
    years.some((y) => y.units.some((u) => u.canArchive));

  return { years, showSwitch };
}
