import "server-only";

import { getConcept } from "@/content";
import { getReviewMaterial } from "@/lib/grading.server";
import type { ConceptModels } from "@/lib/config.server";
import type { Db } from "@/lib/db/index.server";
import type { ConceptSlotRow, ConceptVersionRow } from "@/lib/db/schema";
import { sameModel } from "@/lib/concepts/llm.server";
import type {
  CallFailed,
  ConceptContext,
  ConceptLlmPort,
  ContentRejected,
  ReviewMaterial,
  ReviewVerdict,
  UnitContext,
} from "@/lib/concepts/port";
import { overlapsAnswerKey } from "@/lib/concepts/precheck";
import { nextSydneyMidnight } from "@/lib/sydney";
import {
  claimLease,
  clearBackoff,
  ensureSlot,
  getSlot,
  getVersion,
  insertReplacement,
  markReviewed,
  promote,
  cleanupOrphans,
  conceptCallsToday,
  refundConceptCall,
  releaseLease,
  reserveConceptCall,
  setBackoff,
  type ConceptKind,
  type NewVersion,
} from "@/lib/concepts/store.server";

// generate → pre-check → review → one automatic regeneration → flag
// (spec 002 research R5, data-model.md state transitions, contracts/llm.md).
//
// Every model call first reserves one slot from the concept cap (Principle VII) and refunds it
// if the model could not be reached. A student only ever reads a version that has been
// promoted, and promotion needs a passing review (or a teacher), so nothing in here can show
// unreviewed content.

export const OVERLAP_REASON = "Verbatim overlap with an answer key.";

export type PipelineOutcome =
  | "approved"
  | "flagged"
  | "pending_reviewer_unavailable"
  | "pending_cap"
  | "pending_deadline"
  | "failed_call"
  | "lease_busy"
  | "backoff"
  | "no_brief"
  | "nothing_to_do";

export type Origin = "first" | "teacher";

/** What a run should do next for one concept item, given what is stored. */
export type PipelineAction = "generate" | "review" | "regenerate" | "none";

/**
 * The four cases in which generation may run (constitution Principle VII): nothing stored
 * (`generate`), a retry of a pending review (`review`), the single automatic regeneration after
 * a first failed review (`regenerate`), and a teacher's regeneration (always `generate`).
 * A version that failed review twice is terminal until a teacher acts.
 */
export function pipelineAction(
  slot: Pick<ConceptSlotRow, "liveVersionId"> | null,
  replacement: Pick<ConceptVersionRow, "status" | "attemptNo"> | null,
  origin: Origin,
): PipelineAction {
  if (origin === "teacher") return "generate";
  if (replacement) {
    if (replacement.status === "pending_review") return "review";
    if (replacement.status === "failed_review" && replacement.attemptNo === 1) return "regenerate";
    return "none";
  }
  return slot?.liveVersionId ? "none" : "generate";
}

export interface PipelineInput {
  db: Db;
  port: ConceptLlmPort;
  conceptId: string;
  kind: ConceptKind;
  origin: Origin;
  /** Concept-generation calls allowed per Sydney day. */
  cap: number;
  models: ConceptModels;
  now: () => Date;
  /** Stop starting model calls at this time (a few seconds before the function's limit). */
  deadline: Date;
  /** Random id of this worker; it holds the lease. */
  owner: string;
  /** The caller has already claimed the lease for `owner` (the teacher route does). */
  leaseHeld?: boolean;
}

export interface PipelineResult {
  outcome: PipelineOutcome;
  /** Present when a summary run continued into its illustration. */
  illustration?: PipelineOutcome;
}

interface Ctx extends PipelineInput {
  unit: UnitContext;
  concept: ConceptContext;
  questionPrompts: string[];
  material: ReviewMaterial;
}

type Generated = { ok: true; fields: Partial<NewVersion> } | CallFailed | ContentRejected;
type Review = { ok: true; verdict: ReviewVerdict } | CallFailed;

interface Ops {
  generatorModel: string;
  generate(attemptNo: 1 | 2): Promise<Generated>;
  /** A free check before the reviewer; returns a reason to fail the version without a review call. */
  precheck?(version: ConceptVersionRow): string | null;
  review(version: ConceptVersionRow, reviewerModel: string): Promise<Review>;
}

const late = (ctx: Ctx) => ctx.now().getTime() >= ctx.deadline.getTime();

async function reserve(ctx: Ctx) {
  return reserveConceptCall(ctx.db, ctx.cap);
}

function reviewable(version: ConceptVersionRow, models: ConceptModels): string | null {
  const reviewer = models.reviewer;
  if (!reviewer) return null;
  return sameModel(reviewer, version.generatorModel) ? null : reviewer;
}

/** The generate/review loop for one kind, from whatever state the slot is in. */
async function cycle(ctx: Ctx, ops: Ops, action: PipelineAction, replacement: ConceptVersionRow | null): Promise<PipelineOutcome> {
  const { db, conceptId, kind, unit } = { ...ctx, unit: ctx.unit };
  let version: ConceptVersionRow | null = action === "review" ? replacement : null;
  let attemptNo: 1 | 2 = action === "regenerate" ? 2 : action === "review" && replacement ? (replacement.attemptNo as 1 | 2) : 1;
  const unitId = unit.id;

  for (let guard = 0; guard < 4; guard++) {
    // ---- generate ----
    if (!version) {
      if (late(ctx)) return "pending_deadline";
      const slot = await reserve(ctx);
      if (!slot) return "pending_cap";
      const gen = await ops.generate(attemptNo);
      if (!gen.ok && gen.kind === "call_failed") {
        await refundConceptCall(db, slot);
        await setBackoff(db, conceptId, kind, ctx.now(), `generation failed: ${gen.reason}`);
        return "failed_call";
      }
      if (!gen.ok) {
        // the model answered but broke the content rules: that is a failed attempt, not a stored version
        if (attemptNo === 1) {
          attemptNo = 2;
          continue;
        }
        await setBackoff(db, conceptId, kind, ctx.now(), `generation rejected twice: ${gen.reason}`);
        return "failed_call";
      }
      version = await insertReplacement(db, {
        conceptId,
        kind,
        unitId,
        origin: attemptNo === 2 ? "auto_retry" : ctx.origin === "teacher" ? "teacher" : "first",
        attemptNo,
        generatorModel: ops.generatorModel,
        generatedAt: ctx.now(),
        ...gen.fields,
      });
    }

    // ---- review ----
    const failure = ops.precheck?.(version);
    let verdict: ReviewVerdict | null = null;
    let reviewerModel: string | null = null;

    if (failure) {
      verdict = { pass: false, reason: failure, checks: {} };
    } else {
      reviewerModel = reviewable(version, ctx.models);
      if (!reviewerModel) return "pending_reviewer_unavailable"; // unset, or the same model as the generator
      if (late(ctx)) return "pending_deadline";
      const slot = await reserve(ctx);
      if (!slot) return "pending_cap";
      const rev = await ops.review(version, reviewerModel);
      if (!rev.ok) {
        await refundConceptCall(db, slot);
        await setBackoff(db, conceptId, kind, ctx.now(), `review unavailable: ${rev.reason}`);
        return "pending_reviewer_unavailable";
      }
      verdict = rev.verdict;
    }

    if (verdict.pass) {
      const done = await promote(db, conceptId, kind, version.id, "reviewer", {
        reviewerModel,
        reason: null,
        at: ctx.now(),
      });
      await clearBackoff(db, conceptId, kind);
      if (done) await cleanupOrphans(db, conceptId, kind);
      return done ? "approved" : "nothing_to_do";
    }

    await markReviewed(db, version.id, {
      status: "failed_review",
      reviewerModel,
      reason: verdict.reason,
      at: ctx.now(),
    });
    if ((version.attemptNo as number) >= 2 || attemptNo === 2) return "flagged";
    // first failure: regenerate once, automatically
    attemptNo = 2;
    version = null;
  }
  return "nothing_to_do";
}

function summaryOps(ctx: Ctx): Ops {
  return {
    generatorModel: ctx.models.generator,
    generate: async (attemptNo) => {
      const r = await ctx.port.generateSummary({
        model: ctx.models.generator,
        unit: ctx.unit,
        concept: ctx.concept,
        questionPrompts: ctx.questionPrompts,
        attemptNo,
      });
      if (!r.ok) return r;
      return {
        ok: true,
        fields: {
          summaryBullets: r.value.bullets,
          illustrationBrief: r.value.illustration?.brief ?? null,
          illustrationAlt: r.value.illustration?.alt ?? null,
        },
      };
    },
    precheck: (version) => {
      const material = ctx.material.questions.flatMap((q) => [q.modelAnswer, q.correctText, ...q.rubric]).filter((x): x is string => Boolean(x));
      return overlapsAnswerKey((version.summaryBullets ?? []).join(" "), material) ? OVERLAP_REASON : null;
    },
    review: (version, reviewerModel) =>
      ctx.port.reviewSummary({
        model: reviewerModel,
        unit: ctx.unit,
        concept: ctx.concept,
        questionPrompts: ctx.questionPrompts,
        bullets: version.summaryBullets ?? [],
        material: ctx.material,
      }),
  };
}

function illustrationOps(ctx: Ctx, source: { bullets: string[]; brief: string; alt: string }): Ops {
  const generatorModel = ctx.models.illustration ?? "";
  return {
    generatorModel,
    generate: async (attemptNo) => {
      const r = await ctx.port.generateIllustration({
        model: generatorModel,
        unit: ctx.unit,
        concept: ctx.concept,
        bullets: source.bullets,
        brief: source.brief,
        alt: source.alt,
        attemptNo,
      });
      if (!r.ok) return r;
      return { ok: true, fields: { illustrationSvg: r.svg, illustrationBrief: source.brief, illustrationAlt: source.alt } };
    },
    review: (version, reviewerModel) =>
      ctx.port.reviewIllustration({
        model: reviewerModel,
        unit: ctx.unit,
        concept: ctx.concept,
        bullets: source.bullets,
        brief: source.brief,
        alt: source.alt,
        svg: version.illustrationSvg ?? "",
        material: ctx.material,
      }),
  };
}

/** The summary text and illustration brief to draw from: the live summary, else the replacement. */
async function summarySource(db: Db, conceptId: string) {
  const slot = await getSlot(db, conceptId, "summary");
  for (const id of [slot?.liveVersionId, slot?.replacementVersionId]) {
    if (!id) continue;
    const v = await getVersion(db, id);
    if (v?.summaryBullets && v.illustrationBrief && v.illustrationAlt) {
      return { bullets: v.summaryBullets, brief: v.illustrationBrief, alt: v.illustrationAlt };
    }
    if (v && id === slot?.liveVersionId) return null; // the live summary decided no picture is needed
  }
  return null;
}

async function runKind(ctx: Ctx, kind: ConceptKind, ops: () => Promise<Ops | PipelineOutcome>, origin: Origin): Promise<PipelineOutcome> {
  const { db, conceptId } = ctx;
  await ensureSlot(db, conceptId, kind, ctx.unit.id);
  const slot = await getSlot(db, conceptId, kind);
  const replacement = slot?.replacementVersionId ? await getVersion(db, slot.replacementVersionId) : null;
  const action = pipelineAction(slot, replacement, origin);
  if (action === "none") return "nothing_to_do";
  const built = await ops();
  if (typeof built === "string") return built;
  return cycle({ ...ctx, kind, origin }, built, action, replacement);
}

/**
 * Run the pipeline for one concept item. A run that starts at `summary` continues into the
 * illustration when the approved summary asked for one and an illustration model is set. The
 * lease is claimed here (unless the caller already holds it) and always released.
 */
async function runConceptPipelineUnlogged(input: PipelineInput): Promise<PipelineResult> {
  const found = getConcept(input.conceptId);
  if (!found || !found.unit.conceptsReady) return { outcome: "nothing_to_do" };
  const { unit, concept } = found;
  const material = getReviewMaterial(unit.id, concept.id) ?? { questions: [] };
  const ctx: Ctx = {
    ...input,
    unit: { id: unit.id, title: unit.title, topic: unit.topic, description: unit.description },
    concept: { id: concept.id, description: concept.description },
    questionPrompts: unit.questions.filter((q) => q.concept === concept.id).map((q) => q.prompt),
    material,
  };

  const { db, conceptId, kind, owner } = ctx;
  await ensureSlot(db, conceptId, kind, unit.id);
  if (!input.leaseHeld) {
    const got = await claimLease(db, conceptId, kind, owner, ctx.now(), { ignoreBackoff: ctx.origin === "teacher" });
    if (!got) {
      const slot = await getSlot(db, conceptId, kind);
      const backedOff = slot?.retryAfter && slot.retryAfter.getTime() > ctx.now().getTime();
      return { outcome: backedOff ? "backoff" : "lease_busy" };
    }
  }

  const held: ConceptKind[] = [kind];
  try {
    if (kind === "summary") {
      const outcome = await runKind(ctx, "summary", async () => summaryOps(ctx), ctx.origin);
      let illustration: PipelineOutcome | undefined;
      if (outcome === "approved" && ctx.models.illustration) {
        const source = await summarySource(db, conceptId);
        if (source) {
          await ensureSlot(db, conceptId, "illustration", unit.id);
          if (await claimLease(db, conceptId, "illustration", owner, ctx.now(), { ignoreBackoff: ctx.origin === "teacher" })) {
            held.push("illustration");
            illustration = await runKind(ctx, "illustration", async () => illustrationOps(ctx, source), "first");
          } else {
            illustration = "lease_busy";
          }
        }
      }
      return { outcome, ...(illustration ? { illustration } : {}) };
    }

    // a run that starts at the illustration
    if (!ctx.models.illustration) return { outcome: "nothing_to_do" };
    const source = await summarySource(db, conceptId);
    if (!source) return { outcome: "no_brief" };
    const outcome = await runKind(ctx, "illustration", async () => illustrationOps(ctx, source), ctx.origin);
    return { outcome };
  } finally {
    for (const k of held) await releaseLease(db, conceptId, k, owner);
  }
}

/** Outcomes that are the normal end of a run and need no log line. */
const QUIET: ReadonlySet<PipelineOutcome> = new Set(["approved", "nothing_to_do"]);

/**
 * Run the pipeline and log, once per run, any outcome that leaves content pending or flagged:
 * `[concepts] <outcome> <conceptId> <kind>`. Only codes and ids are logged (no student data, no
 * reviewer reasons, no answer-key text), so an operator can see why content is not showing
 * without any of that reaching a log.
 */
export async function runConceptPipeline(input: PipelineInput): Promise<PipelineResult> {
  const result = await runConceptPipelineUnlogged(input);
  if (!QUIET.has(result.outcome)) {
    console.warn(`[concepts] ${result.outcome} ${input.conceptId} ${input.kind}`);
  }
  if (result.illustration && !QUIET.has(result.illustration)) {
    console.warn(`[concepts] ${result.illustration} ${input.conceptId} illustration`);
  }
  return result;
}

export interface TeacherRegenerationInput {
  db: Db;
  port: ConceptLlmPort;
  conceptId: string;
  kind: ConceptKind;
  cap: number;
  models: ConceptModels;
  now: () => Date;
  /** Stop starting model calls at this time. */
  deadline: Date;
  /** Random id of this worker; it holds the lease. */
  owner: string;
}

export type TeacherRegenerationStart =
  | { status: "not_found" }
  /** An illustration was asked for, but no summary carries a brief for one. */
  | { status: "no_brief" }
  /** A worker already holds the lease. */
  | { status: "busy" }
  /** Today's concept cap is used up; nothing was created and the live version is untouched. */
  | { status: "cap_reached"; resetsAt: Date }
  /** No usable reviewer, so a replacement could never be approved. */
  | { status: "reviewer_unavailable" }
  /** The lease is held; call `run()` (in the background) to generate and review the replacement. */
  | { status: "started"; run: () => Promise<PipelineResult> };

/**
 * A teacher's regeneration of one concept item (spec 002 FR-054, FR-055). Everything that can
 * be refused is checked here, before any model call, so the route can answer at once; on
 * `started` the lease is held and `run()` does the work. The live version stays on show until a
 * replacement is approved, and the replacement gets the same single automatic regeneration as
 * any other. A teacher's run ignores a backoff but not a held lease or the daily cap.
 */
export async function startTeacherRegeneration(input: TeacherRegenerationInput): Promise<TeacherRegenerationStart> {
  const { db, conceptId, kind, models, cap, owner } = input;
  const found = getConcept(conceptId);
  if (!found || !found.unit.conceptsReady) return { status: "not_found" };
  if (kind === "illustration" && !models.illustration) return { status: "not_found" };

  const reviewer = models.reviewer;
  const generator = kind === "illustration" ? models.illustration : models.generator;
  if (!reviewer || (generator && sameModel(reviewer, generator))) return { status: "reviewer_unavailable" };

  if (kind === "illustration" && !(await summarySource(db, conceptId))) return { status: "no_brief" };

  if (cap <= 0 || (await conceptCallsToday(db)) >= cap) {
    return { status: "cap_reached", resetsAt: nextSydneyMidnight(input.now()) };
  }

  await ensureSlot(db, conceptId, kind, found.unit.id);
  if (!(await claimLease(db, conceptId, kind, owner, input.now(), { ignoreBackoff: true }))) return { status: "busy" };

  return {
    status: "started",
    run: () =>
      runConceptPipeline({
        db,
        port: input.port,
        conceptId,
        kind,
        origin: "teacher",
        cap,
        models,
        now: input.now,
        deadline: input.deadline,
        owner,
        leaseHeld: true,
      }),
  };
}
