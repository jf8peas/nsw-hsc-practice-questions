import { Shell } from "@/components/Shell";
import { UnitCard } from "@/components/UnitCard";
import { requirePageUser } from "@/lib/auth.server";
import { loadHomeReviewCounts } from "@/lib/db/queries/concepts.server";
import { unitsByYear } from "@/content";

export default async function HomePage() {
  const { user, degraded } = await requirePageUser();
  const groups = unitsByYear();

  // The database being down must never break the home page: no "to review" pills, no error.
  let reviewCounts: ReadonlyMap<string, number> = new Map();
  if (!degraded) {
    const loaded = await loadHomeReviewCounts(user.id, groups.flatMap((g) => g.units));
    if (loaded.status === "ok") reviewCounts = loaded.data;
  }

  return (
    <Shell>
      <h1 className="page-h1">Units</h1>
      <p className="page-sub">
        Pick a unit to practice topic questions or a milestone test.
      </p>

      {groups.map((group) => (
        <div key={group.year} style={{ marginBottom: 28 }}>
          <div className="eyebrow">{group.year}</div>
          {group.isEmpty ? (
            <div className="coming-soon">More units coming soon</div>
          ) : (
            group.units.map((unit) => (
              <UnitCard key={unit.id} unit={unit} toReview={reviewCounts.get(unit.id)} />
            ))
          )}
        </div>
      ))}
    </Shell>
  );
}
