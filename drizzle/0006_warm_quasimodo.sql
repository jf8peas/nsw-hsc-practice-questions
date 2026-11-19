CREATE TABLE "unseen_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"unit_id" text NOT NULL,
	"question_id" text NOT NULL,
	"max_marks" smallint NOT NULL,
	"status" text NOT NULL,
	"ending" text,
	"try1_text" text NOT NULL,
	"try1_mark" smallint NOT NULL,
	"try1_verdicts" jsonb NOT NULL,
	"try1_feedback" text NOT NULL,
	"try1_biggest_gap" text NOT NULL,
	"try1_prompt_version" text NOT NULL,
	"try1_model" text NOT NULL,
	"try1_graded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"try2_text" text,
	"try2_mark" smallint,
	"try2_verdicts" jsonb,
	"try2_feedback" text,
	"try2_biggest_gap" text,
	"try2_prompt_version" text,
	"try2_model" text,
	"try2_graded_at" timestamp with time zone,
	"recorded_mark" smallint,
	"flagged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unseen_phases_attempt_question_unique" UNIQUE("attempt_id","question_id"),
	CONSTRAINT "unseen_phases_status" CHECK ("unseen_phases"."status" in ('try1', 'final')),
	CONSTRAINT "unseen_phases_ending" CHECK ("unseen_phases"."ending" is null or "unseen_phases"."ending" in ('full_marks', 'retried', 'declined', 'no_retry')),
	CONSTRAINT "unseen_phases_max" CHECK ("unseen_phases"."max_marks" >= 1 and "unseen_phases"."max_marks" <= 6),
	CONSTRAINT "unseen_phases_try1_mark" CHECK ("unseen_phases"."try1_mark" >= 0 and "unseen_phases"."try1_mark" <= "unseen_phases"."max_marks"),
	CONSTRAINT "unseen_phases_try2_mark" CHECK ("unseen_phases"."try2_mark" is null or ("unseen_phases"."try2_mark" >= 0 and "unseen_phases"."try2_mark" <= "unseen_phases"."max_marks" - 1)),
	CONSTRAINT "unseen_phases_try2_shape" CHECK (("unseen_phases"."try2_text" is null) = ("unseen_phases"."try2_mark" is null) and ("unseen_phases"."try2_text" is null) = ("unseen_phases"."try2_verdicts" is null)),
	CONSTRAINT "unseen_phases_final_shape" CHECK ("unseen_phases"."status" <> 'final' or ("unseen_phases"."recorded_mark" is not null and "unseen_phases"."ending" is not null)),
	CONSTRAINT "unseen_phases_ending_shape" CHECK ("unseen_phases"."ending" is null
        or ("unseen_phases"."ending" = 'retried' and "unseen_phases"."try2_mark" is not null)
        or ("unseen_phases"."ending" in ('full_marks', 'declined', 'no_retry') and "unseen_phases"."try2_mark" is null)),
	CONSTRAINT "unseen_phases_recorded_is_higher" CHECK ("unseen_phases"."recorded_mark" is null or "unseen_phases"."recorded_mark" = greatest("unseen_phases"."try1_mark", coalesce("unseen_phases"."try2_mark", 0))),
	CONSTRAINT "unseen_phases_flag_when_final" CHECK ("unseen_phases"."flagged_at" is null or "unseen_phases"."status" = 'final')
);
--> statement-breakpoint
ALTER TABLE "unseen_phases" ADD CONSTRAINT "unseen_phases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unseen_phases" ADD CONSTRAINT "unseen_phases_attempt_owner_fk" FOREIGN KEY ("attempt_id","user_id") REFERENCES "public"."attempts"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unseen_phases_user_unit_idx" ON "unseen_phases" USING btree ("user_id","unit_id");--> statement-breakpoint
CREATE INDEX "unseen_phases_flagged_idx" ON "unseen_phases" USING btree ("flagged_at") WHERE "unseen_phases"."flagged_at" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_unseen_incomplete_unique" ON "attempts" USING btree ("user_id") WHERE "attempts"."unit_id" = 'y12-english-advanced-unseen-texts' and "attempts"."completed_at" is null;