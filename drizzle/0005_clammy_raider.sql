CREATE TABLE "paragraph_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"unit_id" text NOT NULL,
	"question_id" text NOT NULL,
	"status" text NOT NULL,
	"mode" text NOT NULL,
	"ending" text,
	"phase1_text" text NOT NULL,
	"phase1_mark" smallint NOT NULL,
	"phase1_verdicts" jsonb NOT NULL,
	"phase1_feedback" text,
	"phase1_prompt_version" text,
	"phase1_model" text,
	"phase1_graded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"phase2_text" text,
	"phase2_mark" smallint,
	"phase2_verdicts" jsonb,
	"phase2_feedback" text,
	"phase2_prompt_version" text,
	"phase2_model" text,
	"phase2_graded_at" timestamp with time zone,
	"recorded_mark" smallint,
	"flagged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paragraph_phases_attempt_question_unique" UNIQUE("attempt_id","question_id"),
	CONSTRAINT "paragraph_phases_status" CHECK ("paragraph_phases"."status" in ('phase1', 'final')),
	CONSTRAINT "paragraph_phases_mode" CHECK ("paragraph_phases"."mode" in ('marker', 'self_mark')),
	CONSTRAINT "paragraph_phases_ending" CHECK ("paragraph_phases"."ending" is null or "paragraph_phases"."ending" in ('full_marks', 'corrected', 'no_correction', 'self_mark')),
	CONSTRAINT "paragraph_phases_phase1_mark" CHECK ("paragraph_phases"."phase1_mark" >= 0 and "paragraph_phases"."phase1_mark" <= 4),
	CONSTRAINT "paragraph_phases_phase2_mark" CHECK ("paragraph_phases"."phase2_mark" is null or ("paragraph_phases"."phase2_mark" >= 0 and "paragraph_phases"."phase2_mark" <= 3)),
	CONSTRAINT "paragraph_phases_final_shape" CHECK ("paragraph_phases"."status" <> 'final' or ("paragraph_phases"."recorded_mark" is not null and "paragraph_phases"."ending" is not null)),
	CONSTRAINT "paragraph_phases_recorded_is_higher" CHECK ("paragraph_phases"."recorded_mark" is null or "paragraph_phases"."recorded_mark" = greatest("paragraph_phases"."phase1_mark", coalesce("paragraph_phases"."phase2_mark", 0))),
	CONSTRAINT "paragraph_phases_flag_needs_marker" CHECK ("paragraph_phases"."flagged_at" is null or "paragraph_phases"."mode" = 'marker')
);
--> statement-breakpoint
ALTER TABLE "paragraph_phases" ADD CONSTRAINT "paragraph_phases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paragraph_phases" ADD CONSTRAINT "paragraph_phases_attempt_owner_fk" FOREIGN KEY ("attempt_id","user_id") REFERENCES "public"."attempts"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "paragraph_phases_user_unit_idx" ON "paragraph_phases" USING btree ("user_id","unit_id");--> statement-breakpoint
CREATE INDEX "paragraph_phases_flagged_idx" ON "paragraph_phases" USING btree ("flagged_at") WHERE "paragraph_phases"."flagged_at" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_paragraph_part_unique" ON "attempts" USING btree ("user_id",("question_ids"[1])) WHERE "attempts"."unit_id" = 'y12-economics-paragraph-writing';