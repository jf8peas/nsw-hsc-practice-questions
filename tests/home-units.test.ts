// The pure home-page filtering behind per-student archiving (lib/home-units.ts): archived
// units are hidden by default, come back under "show all", the notice appears when a year is
// fully archived, and a failed/degraded archive load (empty id set) simply shows everything.

import { describe, expect, it } from "vitest";

import { homeUnitsView, type HomeYearRow } from "@/lib/home-units";
import { sydneyDate } from "@/lib/sydney";
import type { Unit, YearGroup } from "@/lib/types";

const OLD = "fx-old";
const FRESH = "fx-fresh";

const unit = (id: string, created: string): Unit => ({
  id,
  year: "Year 12",
  topic: "Fixtures",
  type: "Topic Quiz",
  title: id,
  description: "",
  created,
  order: 0,
  questions: [],
});

const daysAgo = (n: number) => sydneyDate(new Date(Date.now() - n * 86_400_000));

function year12(units: Unit[]): YearGroup[] {
  return [{ year: "Year 12", isEmpty: units.length === 0, units }];
}

const yearOf = (view: ReturnType<typeof homeUnitsView>, year: string = "Year 12"): HomeYearRow =>
  view.years.find((y) => y.year === year)!;

function archiveUnits(): Unit[] {
  return [unit(OLD, daysAgo(30)), unit(FRESH, daysAgo(5))];
}

describe("homeUnitsView", () => {
  it("hides archived units by default and keeps the archivable/archived flags", () => {
    const view = homeUnitsView(year12(archiveUnits()), new Set([OLD]), false);

    const old = yearOf(view).units.find((r) => r.unit.id === OLD)!;
    const fresh = yearOf(view).units.find((r) => r.unit.id === FRESH)!;
    expect(old.archived).toBe(true);
    expect(old.visible).toBe(false);
    expect(old.canArchive).toBe(false); // already archived: no Archive button
    expect(fresh.visible).toBe(true);
    expect(fresh.canArchive).toBe(false); // too young
    expect(yearOf(view).visibleUnits.map((r) => r.unit.id)).toEqual([FRESH]);
    expect(yearOf(view).allArchivedNote).toBe(false);
    expect(view.showSwitch).toBe(true); // something is archived
  });

  it("?all=1 shows archived units too", () => {
    const view = homeUnitsView(year12(archiveUnits()), new Set([OLD]), true);
    expect(yearOf(view).visibleUnits.map((r) => r.unit.id)).toEqual([OLD, FRESH]);
    expect(yearOf(view).allArchivedNote).toBe(false);
  });

  it("offers Archive on an old, unarchived unit", () => {
    const view = homeUnitsView(year12(archiveUnits()), new Set(), false);
    const old = yearOf(view).units.find((r) => r.unit.id === OLD)!;
    expect(old.canArchive).toBe(true);
    expect(old.visible).toBe(true);
    expect(view.showSwitch).toBe(true); // OLD is archivable
  });

  it("shows the notice when every unit in the year is archived (and only then)", () => {
    const bothArchived = homeUnitsView(year12(archiveUnits()), new Set([OLD, FRESH]), false);
    expect(bothArchived.years[0].visibleUnits).toHaveLength(0);
    expect(yearOf(bothArchived).allArchivedNote).toBe(true);

    const showAll = homeUnitsView(year12(archiveUnits()), new Set([OLD, FRESH]), true);
    expect(yearOf(showAll).allArchivedNote).toBe(false); // units are back
  });

  it("an empty archive load (degraded/failed) shows everything with no switch and no note", () => {
    const view = homeUnitsView(year12(archiveUnits()), new Set(), false);
    expect(yearOf(view).visibleUnits.map((r) => r.unit.id)).toEqual([OLD, FRESH]);
    expect(yearOf(view).allArchivedNote).toBe(false);

    // nothing archived and nothing old enough → no switch at all
    const youngOnly = homeUnitsView(year12([unit(FRESH, daysAgo(5))]), new Set(), false);
    expect(youngOnly.showSwitch).toBe(false);
  });

  it("keeps the existing empty-year 'coming soon' group working", () => {
    const view = homeUnitsView(year12([]), new Set(), false);
    expect(view.years[0].isComingSoon).toBe(true);
    expect(view.years[0].allArchivedNote).toBe(false);
    expect(view.showSwitch).toBe(false);
  });
});
