ALTER TABLE "communities" ADD COLUMN "resend_audience_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "resend_audience_id" text;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "resend_audience_id" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "resend_audience_id" text;