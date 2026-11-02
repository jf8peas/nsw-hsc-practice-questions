import { Shell } from "@/components/Shell";
import { UnitCard } from "@/components/UnitCard";
import { requirePageUser } from "@/lib/auth.server";
import { loadHomeReviewCounts } from "@/lib/db/queries/concepts.server";
import { loadArchivedUnitIds } from "@/lib/db/queries/unitArchives.server";
import { unitsByYear } from "@/content";
import { homeUnitsView } from "@/lib/home-units";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const { user, degraded } = await requirePageUser();
  const groups = unitsByYear();
  const params = (await searchParams) ?? {};
  const showAll = params.all === "1";

  // The database being down must never break the home page: no "to review" pills, no archive
  // actions, no switch, no error.
  let reviewCounts: ReadonlyMap<string, number> = new Map();
  let archivedIds: ReadonlySet<string> = new Set();
  let archivesOk = false;
  if (!degraded) {
    const [reviews, archived] = await Promise.all([
      loadHomeReviewCounts(user.id, groups.flatMap((g) => g.units)),
      loadArchivedUnitIds(user.id),
    ]);
    if (reviews.status === "ok") reviewCounts = reviews.data;
    if (archived.status === "ok") {
      archivedIds = new Set(archived.data);
      archivesOk = true;
    }
  }

  const view = homeUnitsView(groups, archivedIds, showAll);
  const showSwitch = archivesOk && view.showSwitch;

  return (
    <Shell>
      <div className="units-head">
        <div style={{ minWidth: 0 }}>
          <h1 className="page-h1">Units</h1>
          <p className="page-sub">
            Pick a unit to practice topic questions or a milestone test.
          </p>
        </div>
        {showSwitch && (
          <a
            className={`show-all-switch${showAll ? " on" : ""}`}
            href={showAll ? "/" : "/?all=1"}
            role="switch"
            aria-checked={showAll}
          >
            <span className="show-all-knob" aria-hidden="true" />
            <span className="show-all-label">{showAll ? "Show all on" : "Show all"}</span>
          </a>
        )}
      </div>

      {view.allArchived && (
        <div className="units-archived-note">
          All units archived. Turn on Show all to see them.
        </div>
      )}

      {view.years.map((group) => {
        if (group.hidden) return null;
        return (
          <div key={group.year} style={{ marginBottom: 28 }}>
            <div className="eyebrow">{group.year}</div>
            {group.isComingSoon ? (
              <div className="coming-soon">More units coming soon</div>
            ) : (
              group.visibleUnits.map(({ unit, archived, canArchive }) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  toReview={reviewCounts.get(unit.id)}
                  archived={archived}
                  canArchive={canArchive}
                  archivesOk={archivesOk}
                />
              ))
            )}
          </div>
        );
      })}
    </Shell>
  );
}
