import { NextResponse } from "next/server";

import { getUnit, unitCanArchive } from "@/content";
import { authenticate } from "@/lib/api-auth.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { archiveUnit, unarchiveUnit } from "@/lib/db/queries/unitArchives.server";

export const runtime = "nodejs";

const UNAVAILABLE = NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });

/**
 * Per-student unit archiving on the home page: POST archives, DELETE unarchives. The server
 * re-checks the unit exists and, for archive, that it is 14+ days old in Sydney time. Only the
 * session user's own row is ever touched (Principle IX); unit ids are plain text like all
 * content references. Unarchive is always allowed, so a unit can be restored no matter how old.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ unitId: string }> }) {
  const auth = await authenticate();
  if (auth.response) return auth.response;

  const { unitId } = await ctx.params;
  const unit = getUnit(unitId);
  if (!unit) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!unitCanArchive(unit)) return NextResponse.json({ error: "too_young" }, { status: 400 });

  try {
    await dbCall((db) => archiveUnit(db, auth.user.id, unitId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DbUnavailableError) return UNAVAILABLE;
    throw error;
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ unitId: string }> }) {
  const auth = await authenticate();
  if (auth.response) return auth.response;

  const { unitId } = await ctx.params;
  if (!getUnit(unitId)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    await dbCall((db) => unarchiveUnit(db, auth.user.id, unitId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DbUnavailableError) return UNAVAILABLE;
    throw error;
  }
}
