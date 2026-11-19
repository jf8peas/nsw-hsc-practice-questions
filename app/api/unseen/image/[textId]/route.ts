import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { authenticate } from "@/lib/api-auth.server";
import { findVisualText, imageDirectory } from "@/lib/unseen/images.server";

export const runtime = "nodejs";

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const notFound = () => NextResponse.json({ error: "not_found" }, { status: 404 });

/**
 * GET /api/unseen/image/<text id>: the cropped visual stimulus of an unseen-text question (spec 008
 * FR-004, constitution Principle V exception). Signed-in students only. Bytes only: never the
 * description, never a list. A malformed id, an unknown id and a text that is not an image all answer
 * the same 404, so ids cannot be probed, and the file path comes from the matched record, never from
 * the request string.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ textId: string }> }) {
  const auth = await authenticate();
  if (auth.response) return auth.response;

  const { textId } = await ctx.params;
  if (!ID_RE.test(textId)) return notFound();
  const text = findVisualText(textId);
  if (!text) return notFound();

  try {
    const bytes = await readFile(path.join(imageDirectory(), `${text.body.image}.webp`));
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "content-type": "image/webp",
        "cache-control": "private, max-age=86400",
        "x-content-type-options": "nosniff",
        vary: "Cookie",
      },
    });
  } catch {
    return notFound();
  }
}
