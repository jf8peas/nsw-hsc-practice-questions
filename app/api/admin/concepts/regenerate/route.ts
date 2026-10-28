import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { authenticateAdmin } from "@/lib/admin.server";
import { runInBackground } from "@/lib/background.server";
import { createConceptLlmPort } from "@/lib/concepts/llm.server";
import { startTeacherRegeneration } from "@/lib/concepts/pipeline.server";
import { getConceptModels, getConfig } from "@/lib/config.server";
import { DbUnavailableError, getDb } from "@/lib/db/index.server";
import { toSydneyIso } from "@/lib/sydney";

export const runtime = "nodejs";
// the model work runs after the response, inside this function's time limit
export const maxDuration = 60;

/** Stop starting model calls this long after the request began (the limit is `maxDuration`). */
const WORK_BUDGET_MS = 50_000;

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });

/**
 * A teacher asks for a fresh summary or illustration of one concept (spec 002 FR-054, FR-055;
 * contracts/api.md). Everything that can be refused is decided before any model call; on 202 the
 * generation and review run after the response. The version students see stays as it is until a
 * replacement is approved.
 */
export async function POST(req: Request) {
  const auth = await authenticateAdmin();
  if (auth.response) return auth.response;

  let body: { conceptId?: unknown; kind?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  const conceptId = typeof body.conceptId === "string" ? body.conceptId : "";
  const kind = body.kind === "summary" || body.kind === "illustration" ? body.kind : null;
  if (!conceptId || !kind) return json({ error: "invalid_request" }, 400);

  let started;
  try {
    started = await startTeacherRegeneration({
      db: getDb(),
      port: createConceptLlmPort(),
      conceptId,
      kind,
      cap: getConfig().conceptDailyCap,
      models: getConceptModels(),
      now: () => new Date(),
      deadline: new Date(Date.now() + WORK_BUDGET_MS),
      owner: randomUUID(),
    });
  } catch (error) {
    if (error instanceof DbUnavailableError) return json({ error: "temporarily_unavailable" }, 503);
    throw error;
  }

  switch (started.status) {
    case "not_found":
      return json({ error: "not_found" }, 404);
    case "no_brief":
      return json({ error: "no_illustration_brief" }, 404);
    case "busy":
      return json({ error: "busy" }, 409);
    case "cap_reached":
      return json({ error: "cap_reached", resetsAt: toSydneyIso(started.resetsAt) }, 429);
    case "reviewer_unavailable":
      return json({ error: "reviewer_unavailable" }, 503);
    case "started":
      runInBackground(async () => {
        await started.run();
      });
      return json({ queued: true }, 202);
  }
}
