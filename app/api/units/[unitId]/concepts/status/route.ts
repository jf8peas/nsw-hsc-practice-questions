import { NextResponse } from "next/server";

import { getUnit } from "@/content";
import { authenticate } from "@/lib/api-auth.server";
import { conceptProgress } from "@/lib/concepts/progress";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { loadConceptContentView } from "@/lib/db/queries/concepts.server";
import { listUnitResultsForProgress } from "@/lib/db/queries/results.server";

export const runtime = "nodejs";

const POLL_TIMEOUT_MS = 2_500;

/**
 * A cheap poll for the unit page while content is being prepared (spec 002 contracts/api.md):
 * is a worker still busy on one of this student's listed concepts, and has what they can see
 * changed? Read-only, and it returns nothing but those two facts.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ unitId: string }> }) {
  const auth = await authenticate();
  if (auth.response) return auth.response;

  const { unitId } = await ctx.params;
  const unit = getUnit(unitId);
  if (!unit || !unit.conceptsReady) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    const view = await dbCall(async (db) => {
      const states = conceptProgress(unit, await listUnitResultsForProgress(db, auth.user.id, unit.id));
      return loadConceptContentView(db, states.map((s) => s.conceptId), new Date());
    }, POLL_TIMEOUT_MS);
    return NextResponse.json({ pending: view.pending, version: view.version });
  } catch (error) {
    if (error instanceof DbUnavailableError) {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    throw error;
  }
}
