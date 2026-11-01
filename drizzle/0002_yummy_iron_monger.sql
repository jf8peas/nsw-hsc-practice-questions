CREATE TABLE "unit_archives" (
	"user_id" uuid NOT NULL,
	"unit_id" text NOT NULL,
	"archived_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unit_archives_user_id_unit_id_pk" PRIMARY KEY("user_id","unit_id")
);
--> statement-breakpoint
ALTER TABLE "unit_archives" ADD CONSTRAINT "unit_archives_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;