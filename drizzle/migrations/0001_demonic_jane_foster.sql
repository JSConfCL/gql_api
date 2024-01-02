CREATE TABLE IF NOT EXISTS "work_seniority" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "work_seniority_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_seniority_and_role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_role_id" uuid,
	"work_seniority_id" uuid,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "work_seniority_and_role_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "salaries" DROP CONSTRAINT "salaries_work_role_id_work_role_id_fk";
--> statement-breakpoint
ALTER TABLE "work_role" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "salaries" ADD COLUMN "work_seniority_and_role_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "salaries" ADD CONSTRAINT "salaries_work_seniority_and_role_id_work_seniority_and_role_id_fk" FOREIGN KEY ("work_seniority_and_role_id") REFERENCES "work_seniority_and_role"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "salaries" DROP COLUMN IF EXISTS "work_role_id";--> statement-breakpoint
ALTER TABLE "work_role" DROP COLUMN IF EXISTS "seniority";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_seniority_and_role" ADD CONSTRAINT "work_seniority_and_role_work_role_id_work_role_id_fk" FOREIGN KEY ("work_role_id") REFERENCES "work_role"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_seniority_and_role" ADD CONSTRAINT "work_seniority_and_role_work_seniority_id_work_seniority_id_fk" FOREIGN KEY ("work_seniority_id") REFERENCES "work_seniority"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
