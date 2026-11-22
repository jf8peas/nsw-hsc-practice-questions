import "server-only";

import { NextResponse } from "next/server";

import { dbCall } from "@/lib/db/index.server";
import { refundAiSlot, type AiSlot } from "@/lib/usage.server";

// Small helpers the essay handlers share (spec 010, plan Structure Decision). The paragraph, unseen-text and
// comparative handlers keep their own copies; they are not refactored to use this (live code, not in the
// shippable slice).

export const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });

export const bad = (error: string, status = 400, extra: Record<string, unknown> = {}) => json({ error, ...extra }, status);

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Refund a reserved AI slot. Best effort: a failure only costs the student one slot for the day. */
export async function giveBack(slot: AiSlot): Promise<void> {
  try {
    await dbCall((db) => refundAiSlot(db, slot));
  } catch (error) {
    console.error("could not refund an AI slot", error);
  }
}
