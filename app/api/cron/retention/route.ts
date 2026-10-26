import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { DbUnavailableError, dbCall } from "@/lib/db/index.server";
import { runRetention } from "@/lib/retention.server";

export const runtime = "nodejs";

/** The retention job may touch many rows; give it more room than a marking request. */
const JOB_TIMEOUT_MS = 25_000;

/** Constant-time comparison of two strings of any length (compares fixed-size digests). */
function safeEqual(a: string, b: string): boolean {
  const da = createHash("sha256").update(a).digest();
  const db = createHash("sha256").update(b).digest();
  return timingSafeEqual(da, db);
}

/**
 * The scheduled retention job (weekly, see vercel.json). The one route that is
 * not behind a Google sign-in (constitution Principle II): it requires the
 * CRON_SECRET bearer token, rejects every other caller, only performs
 * retention deletion, and returns counts only, never student data.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ") || !safeEqual(header.slice("Bearer ".length), secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { deletedStudents, prunedUsageRows } = await dbCall((db) => runRetention(db), JOB_TIMEOUT_MS);
    return NextResponse.json({ deletedStudents, prunedUsageRows });
  } catch (error) {
    if (error instanceof DbUnavailableError) {
      return NextResponse.json({ error: "temporarily_unavailable" }, { status: 503 });
    }
    throw error;
  }
}
