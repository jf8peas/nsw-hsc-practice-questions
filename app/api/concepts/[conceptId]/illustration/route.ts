import { NextResponse } from "next/server";

import { getConcept } from "@/content";
import { authenticate } from "@/lib/api-auth.server";
import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { SVG_HEADERS } from "@/lib/concepts/svg-headers";
import { getLiveIllustrationSvg } from "@/lib/db/queries/concepts.server";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A concept's illustration, for `<img src>` only (constitution Principle VII). Serves the
 * concept's LIVE APPROVED illustration and nothing else: any other version id, a superseded or
 * flagged one, or an unknown concept is the same plain 404. The URL carries the version id, so
 * the response can be cached for good.
 */
export async function GET(req: Request, ctx: { params: Promise<{ conceptId: string }> }) {
  const auth = await authenticate();
  if (auth.response) return auth.response;

  const { conceptId } = await ctx.params;
  const version = new URL(req.url).searchParams.get("v") ?? "";
  const notFound = () => NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!getConcept(conceptId) || !UUID.test(version)) return notFound();

  let svg: string | null;
  try {
    svg = await dbCall((db) => getLiveIllustrationSvg(db, conceptId, version));
  } catch (error) {
    if (error instanceof DbUnavailableError) {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    throw error;
  }
  if (!svg) return notFound();

  return new Response(svg, {
    status: 200,
    headers: { ...SVG_HEADERS, "cache-control": "private, max-age=31536000, immutable" },
  });
}
