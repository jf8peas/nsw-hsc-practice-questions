CREATE TABLE "reference_texts" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"content_hash" text NOT NULL,
	"loaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "essay_phases" DROP CONSTRAINT "essay_phases_scaffold_words";--> statement-breakpoint
ALTER TABLE "essay_phases" DROP CONSTRAINT "essay_phases_marked_fields";--> statement-breakpoint
ALTER TABLE "essay_phases" ADD COLUMN "final_band" smallint;--> statement-breakpoint
ALTER TABLE "essay_phases" ADD COLUMN "question_focus" text;--> statement-breakpoint
ALTER TABLE "essay_phases" ADD COLUMN "question_focus_reason" text;--> statement-breakpoint
ALTER TABLE "essay_phases" ADD COLUMN "knowledge_errors" jsonb;--> statement-breakpoint
ALTER TABLE "essay_phases" ADD COLUMN "quote_results" jsonb;--> statement-breakpoint
ALTER TABLE "essay_phases" ADD COLUMN "reference_text_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_english_essay_incomplete_unique" ON "attempts" USING btree ("user_id") WHERE "attempts"."unit_id" = 'y12-english-essay-writing' and "attempts"."completed_at" is null;--> statement-breakpoint
ALTER TABLE "essay_phases" ADD CONSTRAINT "essay_phases_question_focus" CHECK ("essay_phases"."question_focus" is null or "essay_phases"."question_focus" in ('fully', 'partly', 'barely'));--> statement-breakpoint
ALTER TABLE "essay_phases" ADD CONSTRAINT "essay_phases_final_band" CHECK ("essay_phases"."final_band" is null or "essay_phases"."final_band" between 1 and 5);--> statement-breakpoint
ALTER TABLE "essay_phases" ADD CONSTRAINT "essay_phases_scaffold_words" CHECK ("essay_phases"."scaffold_words" >= 0 and "essay_phases"."scaffold_words" <= case when "essay_phases"."unit_id" = 'y12-english-essay-writing' then 150 else 250 end);--> statement-breakpoint
ALTER TABLE "essay_phases" ADD CONSTRAINT "essay_phases_marked_fields" CHECK (("essay_phases"."unit_id" <> 'y12-english-essay-writing' and ("essay_phases"."final_mark" is null or ("essay_phases"."final_mark" between 1 and 20 and "essay_phases"."raw_mark" between 1 and 20 and "essay_phases"."band" between 1 and 5 and "essay_phases"."essay_text" is not null and "essay_phases"."essay_words" between 600 and 800 and "essay_phases"."criteria" is not null and "essay_phases"."prompt_version" is not null and "essay_phases"."model" is not null))) or ("essay_phases"."unit_id" = 'y12-english-essay-writing' and ("essay_phases"."final_mark" is null or ("essay_phases"."final_mark" between 1 and 20 and "essay_phases"."raw_mark" between 0 and 20 and "essay_phases"."band" between 1 and 5 and "essay_phases"."final_band" between 1 and 5 and "essay_phases"."essay_text" is not null and "essay_phases"."essay_words" between 800 and 1200 and "essay_phases"."criteria" ?& array['argument','analysis','knowledge','expression'] and "essay_phases"."question_focus" is not null and "essay_phases"."question_focus_reason" is not null and "essay_phases"."knowledge_errors" is not null and "essay_phases"."quote_results" is not null and length("essay_phases"."reference_text_hash") = 64 and "essay_phases"."prompt_version" is not null and "essay_phases"."model" is not null))));