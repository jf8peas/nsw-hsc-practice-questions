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
  uuid,
} from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

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

export type User = typeof users.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type ResultRow = typeof results.$inferSelect;
export type NewResultRow = typeof results.$inferInsert;
