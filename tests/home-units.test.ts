// The pure home-page filtering behind per-student archiving (lib/home-units.ts): archived
// units are hidden by default, come back under "show all", a year whose every unit is archived
// is hidden entirely (no heading, no note), and when that hides every year with units the
// page-level allArchived flag is set. A failed/degraded archive load (empty id set) simply
// shows everything.

import { describe, expect, it } from "vitest";

import { homeUnitsView, type HomeYearRow } from "@/lib/home-units";
import { sydneyDate } from "@/lib/sydney";
import type { YearGroup } from "@/content";
import type { Unit } from "@/lib/types";

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
    expect(yearOf(view).hidden).toBe(false); // partly archived: the heading stays
    expect(view.allArchived).toBe(false);
    expect(view.showSwitch).toBe(true); // something is archived
  });

  it("?all=1 shows archived units too", () => {
    const view = homeUnitsView(year12(archiveUnits()), new Set([OLD]), true);
    expect(yearOf(view).visibleUnits.map((r) => r.unit.id)).toEqual([OLD, FRESH]);
    expect(yearOf(view).hidden).toBe(false);
    expect(view.allArchived).toBe(false);
  });

  it("offers Archive on an old, unarchived unit", () => {
    const view = homeUnitsView(year12(archiveUnits()), new Set(), false);
    const old = yearOf(view).units.find((r) => r.unit.id === OLD)!;
    expect(old.canArchive).toBe(true);
    expect(old.visible).toBe(true);
    expect(view.showSwitch).toBe(true); // OLD is archivable
  });

  it("hides an all-archived year when Show all is off, and shows it when on", () => {
    const bothArchived = homeUnitsView(year12(archiveUnits()), new Set([OLD, FRESH]), false);
    expect(yearOf(bothArchived).hidden).toBe(true);
    expect(yearOf(bothArchived).visibleUnits).toHaveLength(0);
    expect(bothArchived.allArchived).toBe(true);

    const showAll = homeUnitsView(year12(archiveUnits()), new Set([OLD, FRESH]), true);
    expect(yearOf(showAll).hidden).toBe(false); // the group is back
    expect(yearOf(showAll).visibleUnits.map((r) => r.unit.id)).toEqual([OLD, FRESH]);
    expect(showAll.allArchived).toBe(false);
  });

  it("allArchived is true only when every year with units is hidden", () => {
    const y12 = unit("y12", daysAgo(30));
    const y11 = unit("y11", daysAgo(30));
    const groups: YearGroup[] = [
      { year: "Year 12", isEmpty: false, units: [y12] },
      { year: "Year 11", isEmpty: false, units: [y11] },
    ];

    // only Year 12 fully archived → Year 12 hidden, Year 11 still shows, not allArchived
    const one = homeUnitsView(groups, new Set(["y12"]), false);
    expect(one.years.find((y) => y.year === "Year 12")!.hidden).toBe(true);
    expect(one.years.find((y) => y.year === "Year 11")!.hidden).toBe(false);
    expect(one.allArchived).toBe(false);

    // both fully archived → both hidden, allArchived
    const both = homeUnitsView(groups, new Set(["y12", "y11"]), false);
    expect(both.years.every((y) => y.hidden)).toBe(true);
    expect(both.allArchived).toBe(true);

    // Show all on → nothing hidden, not allArchived
    const showAll = homeUnitsView(groups, new Set(["y12", "y11"]), true);
    expect(showAll.years.every((y) => y.hidden)).toBe(false);
    expect(showAll.allArchived).toBe(false);
  });

  it("coming-soon groups are unaffected and never count toward allArchived", () => {
    const y12 = unit("y12", daysAgo(30));
    const groups: YearGroup[] = [
      { year: "Year 12", isEmpty: false, units: [y12] },
      { year: "Year 11", isEmpty: true, units: [] },
    ];

    const view = homeUnitsView(groups, new Set(["y12"]), false);
    const y12Row = view.years.find((y) => y.year === "Year 12")!;
    const y11Row = view.years.find((y) => y.year === "Year 11")!;
    expect(y12Row.hidden).toBe(true);
    expect(y11Row.isComingSoon).toBe(true);
    expect(y11Row.hidden).toBe(false); // coming-soon groups always render
    expect(view.allArchived).toBe(true); // the only year with units is hidden

    // with no year with units at all, there is nothing to have archived
    const onlyComingSoon = homeUnitsView(
      [{ year: "Year 12", isEmpty: true, units: [] }],
      new Set(),
      false,
    );
    expect(onlyComingSoon.allArchived).toBe(false);
  });

  it("an empty archive load (degraded/failed) shows everything with no switch and no note", () => {
    const view = homeUnitsView(year12(archiveUnits()), new Set(), false);
    expect(yearOf(view).visibleUnits.map((r) => r.unit.id)).toEqual([OLD, FRESH]);
    expect(yearOf(view).hidden).toBe(false);
    expect(view.allArchived).toBe(false);

    // nothing archived and nothing old enough → no switch at all
    const youngOnly = homeUnitsView(year12([unit(FRESH, daysAgo(5))]), new Set(), false);
    expect(youngOnly.showSwitch).toBe(false);
  });

  it("keeps the existing empty-year 'coming soon' group working", () => {
    const view = homeUnitsView(year12([]), new Set(), false);
    expect(view.years[0].isComingSoon).toBe(true);
    expect(view.years[0].hidden).toBe(false);
    expect(view.allArchived).toBe(false);
    expect(view.showSwitch).toBe(false);
  });
});
