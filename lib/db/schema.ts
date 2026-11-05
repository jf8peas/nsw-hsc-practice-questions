// Database schema. See specs/001-student-saved-scores/data-model.md.
//
// Only the fields permitted by constitution Principle II are stored. Unit and
// question ids are plain text (not foreign keys): content lives in code, and
// removing a question must never delete its results (Principle III).

import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

/**
 * spec 006: the display-only grading data stored with a rewrite question's phase row. Display
 * only — never read by lib/concepts/progress.ts or the draw, and never changes marks or concept
 * tracking (constitution Principle II, amended 2.13.0).
 */
export interface RewriteDisplayData {
  phase1: { spanByTerm: Record<string, string> }; // credited spans, found only
  phase2?: { spanByTerm: Record<string, string> }; // credited spans, found only
  phase2TermOutcomes?: Array<{ conceptId: string; correct: boolean }>; // display only
  languageNote?: { spelling?: Array<{ wrong: string; fix: string }>; grammar?: string };
}

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    googleSub: text("google_sub").notNull().unique(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
    lastSignInAt: ts("last_sign_in_at").notNull().defaultNow(),
    lastAnswerAt: ts("last_answer_at"),
  },
  (t) => [index("users_email_lower_idx").on(sql`lower(${t.email})`)],
);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    unitId: text("unit_id").notNull(),
    startedAt: ts("started_at").notNull().defaultNow(),
    completedAt: ts("completed_at"),
    /** The ordered list of question ids drawn for this attempt. */
    questionIds: text("question_ids").array().notNull(),
    /** { [questionId]: optionOrder } where optionOrder[displayIndex] = original index. */
    mcOptionOrder: jsonb("mc_option_order")
      .$type<Record<string, number[]>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
  },
  (t) => [
    // lets `results` reference (id, user_id) so a result can never disagree with its attempt's owner
    unique("attempts_id_user_unique").on(t.id, t.userId),
    index("attempts_user_unit_started_idx").on(t.userId, t.unitId, t.startedAt.desc()),
    index("attempts_incomplete_idx")
      .on(t.userId, t.unitId)
      .where(sql`${t.completedAt} is null`),
    // spec 007: a paragraph-unit part can have only one attempt per student, so two tabs starting
    // at once end up on the same attempt (research R1). Partial: other units are unaffected.
    uniqueIndex("attempts_paragraph_part_unique")
      .on(t.userId, sql`(${t.questionIds}[1])`)
      .where(sql`${t.unitId} = 'y12-economics-paragraph-writing'`),
  ],
);

export const results = pgTable(
  "results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    unitId: text("unit_id").notNull(),
    questionId: text("question_id").notNull(),
    /** MC: the chosen option's text. Short: the student's text. */
    answer: text("answer").notNull(),
    marksAwarded: smallint("marks_awarded").notNull(),
    maxMarks: smallint("max_marks").notNull(),
    /** auto | llm | self */
    gradedBy: text("graded_by").notNull(),
    /** AI-graded only, as shown to the student. Never the model answer or rubric text. */
    feedback: text("feedback"),
    rubricHits: text("rubric_hits").array(),
    rubricMisses: text("rubric_misses").array(),
    /** `rewrite` only (spec 005): per-term outcomes from phase 1, `[{ conceptId, correct }]`. */
    conceptOutcomes: jsonb("concept_outcomes").$type<Array<{ conceptId: string; correct: boolean }>>(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "results_attempt_owner_fk",
      columns: [t.attemptId, t.userId],
      foreignColumns: [attempts.id, attempts.userId],
    }).onDelete("cascade"),
    // the idempotency key (FR-007)
    unique("results_attempt_question_unique").on(t.attemptId, t.questionId),
    check("results_marks_range", sql`${t.marksAwarded} >= 0 and ${t.marksAwarded} <= ${t.maxMarks}`),
    check("results_graded_by", sql`${t.gradedBy} in ('auto', 'llm', 'self')`),
    index("results_user_created_idx").on(t.userId, t.createdAt.desc()),
    index("results_unit_question_idx").on(t.unitId, t.questionId),
    index("results_unit_created_idx").on(t.unitId, t.createdAt),
    index("results_attempt_idx").on(t.attemptId),
    // concept progress (spec 002): one student, one unit, in answer order
    index("results_user_unit_created_idx").on(t.userId, t.unitId, t.createdAt, t.id),
  ],
);

/**
 * One row per question in a writing-practice attempt (spec 005): the phase 1 and phase 2
 * sentences, their marks, the per-term outcomes and the feedback shown. Created at phase 1,
 * kept for the attempt detail page, deleted with the student. A `results` row is created
 * only when the question is final, so "a results row means answered" still holds.
 */
export const rewritePhases = pgTable(
  "rewrite_phases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    unitId: text("unit_id").notNull(),
    questionId: text("question_id").notNull(),
    /** phase1 | phase2 | final */
    status: text("status").notNull(),
    phase1Answer: text("phase1_answer").notNull(),
    phase1Marks: smallint("phase1_marks").notNull(),
    phase1Feedback: text("phase1_feedback"),
    phase1TermOutcomes: jsonb("phase1_term_outcomes").$type<Array<{ conceptId: string; correct: boolean }>>(),
    phase1GradedAt: ts("phase1_graded_at").notNull().defaultNow(),
    phase2Answer: text("phase2_answer"),
    phase2Marks: smallint("phase2_marks"),
    phase2Feedback: text("phase2_feedback"),
    phase2GradedAt: ts("phase2_graded_at"),
    recordedMark: smallint("recorded_mark"),
    /**
     * spec 006: the display-only grading data (credited spans per phase, phase 2 term outcomes,
     * optional language note). Display only; never read by lib/concepts/progress.ts or the draw.
     */
    displayData: jsonb("display_data").$type<RewriteDisplayData>(),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "rewrite_phases_attempt_owner_fk",
      columns: [t.attemptId, t.userId],
      foreignColumns: [attempts.id, attempts.userId],
    }).onDelete("cascade"),
    unique("rewrite_phases_attempt_question_unique").on(t.attemptId, t.questionId),
    check("rewrite_phases_status", sql`${t.status} in ('phase1', 'phase2', 'final')`),
    check("rewrite_phases_phase1_marks", sql`${t.phase1Marks} >= 0 and ${t.phase1Marks} <= 3`),
    check(
      "rewrite_phases_phase2_marks",
      sql`${t.phase2Marks} is null or (${t.phase2Marks} >= 0 and ${t.phase2Marks} <= 2)`,
    ),
    check("rewrite_phases_final_mark", sql`${t.status} <> 'final' or ${t.recordedMark} is not null`),
    index("rewrite_phases_user_unit_idx").on(t.userId, t.unitId),
  ],
);

/** spec 007: one criterion's verdict with the marker's one-line reason. */
export interface ParagraphCriterionVerdict {
  met: boolean;
  /** The marker's one line; "" on the self-mark path. */
  reason: string;
  /** Criterion d only: the halves of the conventions criterion. */
  subs?: { preciseLanguage: boolean; noPadding: boolean; withinLimit: boolean };
}
export type ParagraphVerdicts = Record<"a" | "b" | "c" | "d", ParagraphCriterionVerdict>;

/**
 * spec 007: one row per question in a paragraph-writing attempt. Phase 1 and phase 2 text, marks,
 * the four per-criterion verdicts with the marker's reasons, the prompt version and model that
 * marked each phase, how the question ended, and the once-only flag. Created at phase 1, kept for
 * the attempt detail page, deleted with the student. A `results` row is created only when the
 * question is final. Verdicts, reasons and the flag never change marks or concept tracking.
 */
export const paragraphPhases = pgTable(
  "paragraph_phases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    unitId: text("unit_id").notNull(),
    questionId: text("question_id").notNull(),
    /** phase1 | final */
    status: text("status").notNull(),
    /** marker | self_mark */
    mode: text("mode").notNull(),
    /** full_marks | corrected | no_correction | self_mark; null until final */
    ending: text("ending"),
    phase1Text: text("phase1_text").notNull(),
    phase1Mark: smallint("phase1_mark").notNull(),
    phase1Verdicts: jsonb("phase1_verdicts").$type<ParagraphVerdicts>().notNull(),
    phase1Feedback: text("phase1_feedback"),
    phase1PromptVersion: text("phase1_prompt_version"),
    phase1Model: text("phase1_model"),
    phase1GradedAt: ts("phase1_graded_at").notNull().defaultNow(),
    phase2Text: text("phase2_text"),
    phase2Mark: smallint("phase2_mark"),
    phase2Verdicts: jsonb("phase2_verdicts").$type<ParagraphVerdicts>(),
    phase2Feedback: text("phase2_feedback"),
    phase2PromptVersion: text("phase2_prompt_version"),
    phase2Model: text("phase2_model"),
    phase2GradedAt: ts("phase2_graded_at"),
    recordedMark: smallint("recorded_mark"),
    /** Set once, when the student presses "This mark seems wrong". Never changes a mark. */
    flaggedAt: ts("flagged_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "paragraph_phases_attempt_owner_fk",
      columns: [t.attemptId, t.userId],
      foreignColumns: [attempts.id, attempts.userId],
    }).onDelete("cascade"),
    unique("paragraph_phases_attempt_question_unique").on(t.attemptId, t.questionId),
    check("paragraph_phases_status", sql`${t.status} in ('phase1', 'final')`),
    check("paragraph_phases_mode", sql`${t.mode} in ('marker', 'self_mark')`),
    check(
      "paragraph_phases_ending",
      sql`${t.ending} is null or ${t.ending} in ('full_marks', 'corrected', 'no_correction', 'self_mark')`,
    ),
    check("paragraph_phases_phase1_mark", sql`${t.phase1Mark} >= 0 and ${t.phase1Mark} <= 4`),
    check(
      "paragraph_phases_phase2_mark",
      sql`${t.phase2Mark} is null or (${t.phase2Mark} >= 0 and ${t.phase2Mark} <= 3)`,
    ),
    check(
      "paragraph_phases_final_shape",
      sql`${t.status} <> 'final' or (${t.recordedMark} is not null and ${t.ending} is not null)`,
    ),
    check(
      "paragraph_phases_recorded_is_higher",
      sql`${t.recordedMark} is null or ${t.recordedMark} = greatest(${t.phase1Mark}, coalesce(${t.phase2Mark}, 0))`,
    ),
    check("paragraph_phases_flag_needs_marker", sql`${t.flaggedAt} is null or ${t.mode} = 'marker'`),
    index("paragraph_phases_user_unit_idx").on(t.userId, t.unitId),
    index("paragraph_phases_flagged_idx")
      .on(t.flaggedAt)
      .where(sql`${t.flaggedAt} is not null`),
  ],
);

/**
 * spec 006: one row per question in a writing-practice attempt holding the student's in-progress
 * draft text per phase, so a resume on another device restores what the student had typed
 * (FR-053, FR-054). Created on the first draft save; deleted with the student (cascade).
 */
export const rewriteDrafts = pgTable(
  "rewrite_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    unitId: text("unit_id").notNull(),
    questionId: text("question_id").notNull(),
    phase1Draft: text("phase1_draft").notNull().default(""),
    phase2Draft: text("phase2_draft").notNull().default(""),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "rewrite_drafts_attempt_owner_fk",
      columns: [t.attemptId, t.userId],
      foreignColumns: [attempts.id, attempts.userId],
    }).onDelete("cascade"),
    unique("rewrite_drafts_attempt_question_unique").on(t.attemptId, t.questionId),
    index("rewrite_drafts_user_unit_idx").on(t.userId, t.unitId),
  ],
);

export const dailyAiUsage = pgTable(
  "daily_ai_usage",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sydneyDate: date("sydney_date", { mode: "string" }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.sydneyDate] }),
    check("daily_ai_usage_count", sql`${t.count} >= 0`),
  ],
);

/**
 * One row per student per unit they have archived off the home page. Unit ids are plain
 * text (not foreign keys), like results.unit_id: content lives in code, and archiving a
 * unit must never touch attempts, results or concept progress (Principle III).
 */
export const unitArchives = pgTable(
  "unit_archives",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    unitId: text("unit_id").notNull(),
    archivedAt: ts("archived_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.unitId] })],
);

// ---- Learn From Mistakes (spec 002) ---------------------------------------
// Shared concept content. None of these tables holds a student id, name, email or answer
// (Principle II): they are not student data. See specs/002-learn-from-mistakes/data-model.md.

/** One generated version of a concept's summary or illustration. Immutable but for review fields. */
export const conceptVersions = pgTable(
  "concept_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conceptId: text("concept_id").notNull(),
    /** summary | illustration */
    kind: text("kind").notNull(),
    unitId: text("unit_id").notNull(),
    /** pending_review | approved | failed_review ("not generated" is the absence of a version) */
    status: text("status").notNull(),
    /** first | teacher | auto_retry */
    origin: text("origin").notNull(),
    /** 1 for the first generation of a run, 2 for the single automatic regeneration */
    attemptNo: smallint("attempt_no").notNull(),
    /** summary only: 3 to 6 bullets */
    summaryBullets: text("summary_bullets").array(),
    /** the brief the picture is drawn from (illustration) or the decision to illustrate (summary; null = none) */
    illustrationBrief: text("illustration_brief"),
    illustrationAlt: text("illustration_alt"),
    /** illustration only: the sanitised SVG */
    illustrationSvg: text("illustration_svg"),
    generatorModel: text("generator_model").notNull(),
    generatedAt: ts("generated_at").notNull(),
    reviewerModel: text("reviewer_model"),
    /** May quote model answers or rubrics, so it is teacher-only. */
    reviewerReason: text("reviewer_reason"),
    reviewedAt: ts("reviewed_at"),
    /** reviewer | teacher */
    approvedBy: text("approved_by"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("concept_versions_concept_kind_idx").on(t.conceptId, t.kind),
    check("concept_versions_kind", sql`${t.kind} in ('summary', 'illustration')`),
    check("concept_versions_status", sql`${t.status} in ('pending_review', 'approved', 'failed_review')`),
    check("concept_versions_origin", sql`${t.origin} in ('first', 'teacher', 'auto_retry')`),
    check("concept_versions_attempt_no", sql`${t.attemptNo} in (1, 2)`),
    check("concept_versions_approved_by", sql`${t.approvedBy} is null or ${t.approvedBy} in ('reviewer', 'teacher')`),
    check(
      "concept_versions_kind_shape",
      sql`(${t.kind} = 'summary' and ${t.summaryBullets} is not null
            and cardinality(${t.summaryBullets}) between 3 and 6 and ${t.illustrationSvg} is null)
          or (${t.kind} = 'illustration' and ${t.illustrationSvg} is not null
            and ${t.illustrationBrief} is not null and ${t.illustrationAlt} is not null
            and ${t.summaryBullets} is null)`,
    ),
    check(
      "concept_versions_approved_fields",
      sql`${t.status} <> 'approved'
          or (${t.approvedBy} is not null and ${t.reviewedAt} is not null
            and (${t.approvedBy} <> 'reviewer' or ${t.reviewerModel} is not null))`,
    ),
    check(
      "concept_versions_failed_fields",
      sql`${t.status} <> 'failed_review' or (${t.reviewerReason} is not null and ${t.reviewedAt} is not null)`,
    ),
  ],
);

/**
 * One row per concept and kind: which version is live, which is the pending or failed
 * replacement, and whether a worker holds the generation lease. "A live version plus at
 * most one replacement" holds by construction (one pointer of each kind).
 */
export const conceptSlots = pgTable(
  "concept_slots",
  {
    conceptId: text("concept_id").notNull(),
    kind: text("kind").notNull(),
    unitId: text("unit_id").notNull(),
    liveVersionId: uuid("live_version_id").references(() => conceptVersions.id, { onDelete: "set null" }),
    replacementVersionId: uuid("replacement_version_id").references(() => conceptVersions.id, {
      onDelete: "set null",
    }),
    leaseOwner: uuid("lease_owner"),
    leaseUntil: ts("lease_until"),
    retryAfter: ts("retry_after"),
    lastError: text("last_error"),
    lastErrorAt: ts("last_error_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.conceptId, t.kind] }),
    index("concept_slots_unit_idx").on(t.unitId),
    check("concept_slots_kind", sql`${t.kind} in ('summary', 'illustration')`),
    check(
      "concept_slots_distinct_pointers",
      sql`${t.liveVersionId} is null or ${t.replacementVersionId} is null or ${t.liveVersionId} <> ${t.replacementVersionId}`,
    ),
  ],
);

/** Model calls made per Sydney day across all students; bounds concept-generation spend (Principle VII). */
export const dailyConceptUsage = pgTable(
  "daily_concept_usage",
  {
    sydneyDate: date("sydney_date", { mode: "string" }).primaryKey(),
    count: integer("count").notNull().default(0),
  },
  (t) => [check("daily_concept_usage_count", sql`${t.count} >= 0`)],
);

export type ConceptVersionRow = typeof conceptVersions.$inferSelect;
export type NewConceptVersionRow = typeof conceptVersions.$inferInsert;
export type ConceptSlotRow = typeof conceptSlots.$inferSelect;

export type User = typeof users.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type ResultRow = typeof results.$inferSelect;
export type NewResultRow = typeof results.$inferInsert;
export type RewritePhaseRow = typeof rewritePhases.$inferSelect;
export type ParagraphPhaseRow = typeof paragraphPhases.$inferSelect;
export type NewParagraphPhaseRow = typeof paragraphPhases.$inferInsert;
export type NewRewritePhaseRow = typeof rewritePhases.$inferInsert;
export type RewriteDraftRow = typeof rewriteDrafts.$inferSelect;
export type NewRewriteDraftRow = typeof rewriteDrafts.$inferInsert;
