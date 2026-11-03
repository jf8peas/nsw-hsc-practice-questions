CREATE TABLE "rewrite_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"unit_id" text NOT NULL,
	"question_id" text NOT NULL,
	"phase1_draft" text DEFAULT '' NOT NULL,
	"phase2_draft" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rewrite_drafts_attempt_question_unique" UNIQUE("attempt_id","question_id")
);
--> statement-breakpoint
ALTER TABLE "rewrite_phases" ADD COLUMN "display_data" jsonb;--> statement-breakpoint
ALTER TABLE "rewrite_drafts" ADD CONSTRAINT "rewrite_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewrite_drafts" ADD CONSTRAINT "rewrite_drafts_attempt_owner_fk" FOREIGN KEY ("attempt_id","user_id") REFERENCES "public"."attempts"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rewrite_drafts_user_unit_idx" ON "rewrite_drafts" USING btree ("user_id","unit_id");