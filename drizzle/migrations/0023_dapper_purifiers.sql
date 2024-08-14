CREATE TABLE IF NOT EXISTS "user_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"country_of_residence" text NOT NULL,
	"city" text NOT NULL,
	"works_in_organization" boolean NOT NULL,
	"organization_name" text,
	"role_in_organization" text,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_data" ADD CONSTRAINT "user_data_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_id_index" ON "user_data" USING btree ("user_id");