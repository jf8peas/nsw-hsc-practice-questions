CREATE TABLE "concept_slots" (
	"concept_id" text NOT NULL,
	"kind" text NOT NULL,
	"unit_id" text NOT NULL,
	"live_version_id" uuid,
	"replacement_version_id" uuid,
	"lease_owner" uuid,
	"lease_until" timestamp with time zone,
	"retry_after" timestamp with time zone,
	"last_error" text,
	"last_error_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "concept_slots_concept_id_kind_pk" PRIMARY KEY("concept_id","kind"),
	CONSTRAINT "concept_slots_kind" CHECK ("concept_slots"."kind" in ('summary', 'illustration')),
	CONSTRAINT "concept_slots_distinct_pointers" CHECK ("concept_slots"."live_version_id" is null or "concept_slots"."replacement_version_id" is null or "concept_slots"."live_version_id" <> "concept_slots"."replacement_version_id")
);
--> statement-breakpoint
CREATE TABLE "concept_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"concept_id" text NOT NULL,
	"kind" text NOT NULL,
	"unit_id" text NOT NULL,
	"status" text NOT NULL,
	"origin" text NOT NULL,
	"attempt_no" smallint NOT NULL,
	"summary_bullets" text[],
	"illustration_brief" text,
	"illustration_alt" text,
	"illustration_svg" text,
	"generator_model" text NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"reviewer_model" text,
	"reviewer_reason" text,
	"reviewed_at" timestamp with time zone,
	"approved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "concept_versions_kind" CHECK ("concept_versions"."kind" in ('summary', 'illustration')),
	CONSTRAINT "concept_versions_status" CHECK ("concept_versions"."status" in ('pending_review', 'approved', 'failed_review')),
	CONSTRAINT "concept_versions_origin" CHECK ("concept_versions"."origin" in ('first', 'teacher', 'auto_retry')),
	CONSTRAINT "concept_versions_attempt_no" CHECK ("concept_versions"."attempt_no" in (1, 2)),
	CONSTRAINT "concept_versions_approved_by" CHECK ("concept_versions"."approved_by" is null or "concept_versions"."approved_by" in ('reviewer', 'teacher')),
	CONSTRAINT "concept_versions_kind_shape" CHECK (("concept_versions"."kind" = 'summary' and "concept_versions"."summary_bullets" is not null
            and cardinality("concept_versions"."summary_bullets") between 3 and 6 and "concept_versions"."illustration_svg" is null)
          or ("concept_versions"."kind" = 'illustration' and "concept_versions"."illustration_svg" is not null
            and "concept_versions"."illustration_brief" is not null and "concept_versions"."illustration_alt" is not null
            and "concept_versions"."summary_bullets" is null)),
	CONSTRAINT "concept_versions_approved_fields" CHECK ("concept_versions"."status" <> 'approved'
          or ("concept_versions"."approved_by" is not null and "concept_versions"."reviewed_at" is not null
            and ("concept_versions"."approved_by" <> 'reviewer' or "concept_versions"."reviewer_model" is not null))),
	CONSTRAINT "concept_versions_failed_fields" CHECK ("concept_versions"."status" <> 'failed_review' or ("concept_versions"."reviewer_reason" is not null and "concept_versions"."reviewed_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "daily_concept_usage" (
	"sydney_date" date PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "daily_concept_usage_count" CHECK ("daily_concept_usage"."count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "concept_slots" ADD CONSTRAINT "concept_slots_live_version_id_concept_versions_id_fk" FOREIGN KEY ("live_version_id") REFERENCES "public"."concept_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept_slots" ADD CONSTRAINT "concept_slots_replacement_version_id_concept_versions_id_fk" FOREIGN KEY ("replacement_version_id") REFERENCES "public"."concept_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "concept_slots_unit_idx" ON "concept_slots" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "concept_versions_concept_kind_idx" ON "concept_versions" USING btree ("concept_id","kind");--> statement-breakpoint
CREATE INDEX "results_user_unit_created_idx" ON "results" USING btree ("user_id","unit_id","created_at","id");