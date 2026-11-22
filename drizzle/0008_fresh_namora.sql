ALTER TABLE "unseen_phases" DROP CONSTRAINT "unseen_phases_max";--> statement-breakpoint
DROP INDEX "unseen_phases_flagged_idx";--> statement-breakpoint
ALTER TABLE "rewrite_drafts" ADD COLUMN "picked_text_ids" text[];--> statement-breakpoint
ALTER TABLE "unseen_phases" ADD COLUMN "picked_text_ids" text[];--> statement-breakpoint
CREATE UNIQUE INDEX "attempts_comparative_incomplete_unique" ON "attempts" USING btree ("user_id") WHERE "attempts"."unit_id" = 'y12-english-advanced-comparative-texts' and "attempts"."completed_at" is null;--> statement-breakpoint
ALTER TABLE "unseen_phases" ADD CONSTRAINT "unseen_phases_pick_shape" CHECK ("unseen_phases"."picked_text_ids" is null or cardinality("unseen_phases"."picked_text_ids") between 1 and 2);--> statement-breakpoint
ALTER TABLE "unseen_phases" ADD CONSTRAINT "unseen_phases_max" CHECK ("unseen_phases"."max_marks" >= 1 and "unseen_phases"."max_marks" <= 8);