CREATE TABLE IF NOT EXISTS "payments_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"external_product_reference" text,
	"platform" text NOT NULL,
	"transaction_amount" numeric NOT NULL,
	"external_creation_date" timestamp(6) with time zone,
	"currency_id" text NOT NULL,
	"original_response_blob" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "payments_logs_external_id_platform_unique" UNIQUE("external_id","platform")
);
--> statement-breakpoint
ALTER TABLE "confirmation_token" DROP CONSTRAINT "confirmation_token_id_unique";--> statement-breakpoint
ALTER TABLE "salaries" DROP CONSTRAINT "salaries_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_id_unique";--> statement-breakpoint
ALTER TABLE "work_role" DROP CONSTRAINT "work_role_id_unique";--> statement-breakpoint
ALTER TABLE "work_seniority" DROP CONSTRAINT "work_seniority_id_unique";--> statement-breakpoint
ALTER TABLE "work_seniority_and_role" DROP CONSTRAINT "work_seniority_and_role_id_unique";--> statement-breakpoint
ALTER TABLE "events_tags" ALTER COLUMN "event_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events_tags" ALTER COLUMN "tag_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tags_communities" ALTER COLUMN "tag_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tags_communities" ALTER COLUMN "community_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users_tags" ALTER COLUMN "tag_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users_tags" ALTER COLUMN "user_id" SET NOT NULL;