import { NextResponse } from "next/server";

import { getConcept } from "@/content";
import { authenticateAdmin } from "@/lib/admin.server";
import { SVG_HEADERS } from "@/lib/concepts/svg-headers";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { getIllustrationSvgForTeacher } from "@/lib/db/queries/concepts.server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A teacher's preview of ANY version of a concept's illustration, including a pending or flagged
 * replacement (contracts/api.md). Same image-only security headers as the student route, but not
 * cached: the version may still change. A version that belongs to another concept is a 404.
 */
export async function GET(req: Request, ctx: { params: Promise<{ conceptId: string }> }) {
  const auth = await authenticateAdmin();
  if (auth.response) return auth.response;

  const { conceptId } = await ctx.params;
  const version = new URL(req.url).searchParams.get("v") ?? "";
  const notFound = () => NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!getConcept(conceptId) || !UUID.test(version)) return notFound();

  let svg: string | null;
  try {
    svg = await dbCall((db) => getIllustrationSvgForTeacher(db, conceptId, version));
  } catch (error) {
    if (error instanceof DbUnavailableError) {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    throw error;
  }
  if (!svg) return notFound();

  return new Response(svg, { status: 200, headers: { ...SVG_HEADERS, "cache-control": "private, no-store" } });
}
