CREATE TABLE "rewrite_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"unit_id" text NOT NULL,
	"question_id" text NOT NULL,
	"status" text NOT NULL,
	"phase1_answer" text NOT NULL,
	"phase1_marks" smallint NOT NULL,
	"phase1_feedback" text,
	"phase1_term_outcomes" jsonb,
	"phase1_graded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"phase2_answer" text,
	"phase2_marks" smallint,
	"phase2_feedback" text,
	"phase2_graded_at" timestamp with time zone,
	"recorded_mark" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rewrite_phases_attempt_question_unique" UNIQUE("attempt_id","question_id"),
	CONSTRAINT "rewrite_phases_status" CHECK ("rewrite_phases"."status" in ('phase1', 'phase2', 'final')),
	CONSTRAINT "rewrite_phases_phase1_marks" CHECK ("rewrite_phases"."phase1_marks" >= 0 and "rewrite_phases"."phase1_marks" <= 3),
	CONSTRAINT "rewrite_phases_phase2_marks" CHECK ("rewrite_phases"."phase2_marks" is null or ("rewrite_phases"."phase2_marks" >= 0 and "rewrite_phases"."phase2_marks" <= 2)),
	CONSTRAINT "rewrite_phases_final_mark" CHECK ("rewrite_phases"."status" <> 'final' or "rewrite_phases"."recorded_mark" is not null)
);
--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "concept_outcomes" jsonb;--> statement-breakpoint
ALTER TABLE "rewrite_phases" ADD CONSTRAINT "rewrite_phases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewrite_phases" ADD CONSTRAINT "rewrite_phases_attempt_owner_fk" FOREIGN KEY ("attempt_id","user_id") REFERENCES "public"."attempts"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rewrite_phases_user_unit_idx" ON "rewrite_phases" USING btree ("user_id","unit_id");