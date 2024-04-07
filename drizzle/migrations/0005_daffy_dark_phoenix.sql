ALTER TABLE "user_tickets" ALTER COLUMN "approval_status" SET DEFAULT 'not_required';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "address_descriptive_name" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "address" text;