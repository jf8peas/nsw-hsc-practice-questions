import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getUnit } from "@/content";
import { authenticate } from "@/lib/api-auth.server";
import { runInBackground } from "@/lib/background.server";
import { createConceptLlmPort, sameModel } from "@/lib/concepts/llm.server";
import { runConceptPipeline } from "@/lib/concepts/pipeline.server";
import { planConceptWork, type PlannedWork } from "@/lib/concepts/plan.server";
import { conceptProgress } from "@/lib/concepts/progress";
import { claimLease, ensureSlot, releaseLease } from "@/lib/concepts/store.server";
import { getConceptModels, getConfig } from "@/lib/config.server";
import { DbUnavailableError, dbCall, getDb } from "@/lib/db/index.server";
import { loadConceptContentView } from "@/lib/db/queries/concepts.server";
import { listUnitResultsForProgress } from "@/lib/db/queries/results.server";
import { checkConceptRateLimit } from "@/lib/ratelimit.server";

export const runtime = "nodejs";
// the model work runs after the response, inside this function's time limit
export const maxDuration = 60;

/** Stop starting model calls this long after the request began (the limit is `maxDuration`). */
const WORK_BUDGET_MS = 50_000;
/** The plan and claim queries may take a little longer than a marking request. */
const PLAN_TIMEOUT_MS = 3_000;

const json = (body: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers });

/**
 * Start preparing concept content for the signed-in student's own uncleared concepts in this
 * unit (spec 002 contracts/api.md). It claims work and answers at once; the model calls run
 * after the response, so the unit page never waits. The client chooses nothing: the concepts
 * come from the student's own results, and only in the cases the constitution allows.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ unitId: string }> }) {
  const auth = await authenticate();
  if (auth.response) return auth.response;
  const user = auth.user;

  const { unitId } = await ctx.params;
  const unit = getUnit(unitId);
  if (!unit || !unit.conceptsReady) return json({ error: "not_found" }, 404);

  const limited = await checkConceptRateLimit(user.id);
  if (!limited.ok) {
    return json(
      { error: "rate_limited", retryAfter: limited.retryAfter },
      429,
      limited.retryAfter ? { "retry-after": String(limited.retryAfter) } : undefined,
    );
  }

  const models = getConceptModels();
  const cap = getConfig().conceptDailyCap;
  const now = new Date();
  const owner = randomUUID();

  // Without a usable reviewer nothing could be approved, so do not spend a generation call.
  const reviewer = models.reviewer;
  const canWork = cap > 0 && reviewer !== null && !sameModel(reviewer, models.generator);

  let claimed: PlannedWork[];
  let view;
  try {
    ({ claimed, view } = await dbCall(async (db) => {
      const states = conceptProgress(unit, await listUnitResultsForProgress(db, user.id, unit.id));
      const planned = canWork ? await planConceptWork(db, states, models, now) : [];
      const won: PlannedWork[] = [];
      for (const work of planned) {
        // a picture needs a reviewer that is not the model that drew it
        if (work.kind === "illustration" && models.illustration && reviewer && sameModel(reviewer, models.illustration)) continue;
        await ensureSlot(db, work.conceptId, work.kind, unit.id);
        if (await claimLease(db, work.conceptId, work.kind, owner, now)) won.push(work);
      }
      const content = await loadConceptContentView(db, states.map((s) => s.conceptId), now);
      return { claimed: won, view: content };
    }, PLAN_TIMEOUT_MS));
  } catch (error) {
    if (error instanceof DbUnavailableError) return json({ error: "temporarily_unavailable" }, 503);
    throw error;
  }

  if (claimed.length > 0) {
    runInBackground(async () => {
      const db = getDb();
      const port = createConceptLlmPort();
      const deadline = new Date(Date.now() + WORK_BUDGET_MS);
      const handled = new Set<PlannedWork>();
      try {
        for (const work of claimed) {
          handled.add(work);
          await runConceptPipeline({
            db,
            port,
            conceptId: work.conceptId,
            kind: work.kind,
            origin: "first",
            cap,
            models,
            now: () => new Date(),
            deadline,
            owner,
            leaseHeld: true,
          });
        }
      } finally {
        // leases for work never reached (an error, or the budget ran out) must not block the next visit
        for (const work of claimed) if (!handled.has(work)) await releaseLease(db, work.conceptId, work.kind, owner);
      }
    });
  }

  return json(
    {
      queued: [...new Set(claimed.map((w) => w.conceptId))],
      pending: claimed.length > 0 || view.pending,
      version: view.version,
    },
    claimed.length > 0 ? 202 : 200,
  );
}
