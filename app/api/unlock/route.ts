import { NextResponse } from "next/server";

import { codeMatches, gateEnabled, grantAccess } from "@/lib/gate.server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!gateEnabled()) {
    return NextResponse.json({ ok: true });
  }

  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  if (!codeMatches(code)) {
    return NextResponse.json({ error: "Incorrect class code" }, { status: 403 });
  }

  await grantAccess();
  return NextResponse.json({ ok: true });
}
