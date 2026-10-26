CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"unit_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"question_ids" text[] NOT NULL,
	"mc_option_order" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "attempts_id_user_unique" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "daily_ai_usage" (
	"user_id" uuid NOT NULL,
	"sydney_date" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_ai_usage_user_id_sydney_date_pk" PRIMARY KEY("user_id","sydney_date"),
	CONSTRAINT "daily_ai_usage_count" CHECK ("daily_ai_usage"."count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"unit_id" text NOT NULL,
	"question_id" text NOT NULL,
	"answer" text NOT NULL,
	"marks_awarded" smallint NOT NULL,
	"max_marks" smallint NOT NULL,
	"graded_by" text NOT NULL,
	"feedback" text,
	"rubric_hits" text[],
	"rubric_misses" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "results_attempt_question_unique" UNIQUE("attempt_id","question_id"),
	CONSTRAINT "results_marks_range" CHECK ("results"."marks_awarded" >= 0 and "results"."marks_awarded" <= "results"."max_marks"),
	CONSTRAINT "results_graded_by" CHECK ("results"."graded_by" in ('auto', 'llm', 'self'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_sub" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sign_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_answer_at" timestamp with time zone,
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_ai_usage" ADD CONSTRAINT "daily_ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_attempt_owner_fk" FOREIGN KEY ("attempt_id","user_id") REFERENCES "public"."attempts"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempts_user_unit_started_idx" ON "attempts" USING btree ("user_id","unit_id","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "attempts_incomplete_idx" ON "attempts" USING btree ("user_id","unit_id") WHERE "attempts"."completed_at" is null;--> statement-breakpoint
CREATE INDEX "results_user_created_idx" ON "results" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "results_unit_question_idx" ON "results" USING btree ("unit_id","question_id");--> statement-breakpoint
CREATE INDEX "results_unit_created_idx" ON "results" USING btree ("unit_id","created_at");--> statement-breakpoint
CREATE INDEX "results_attempt_idx" ON "results" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "users_email_lower_idx" ON "users" USING btree (lower("email"));