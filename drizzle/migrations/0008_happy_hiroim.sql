ALTER TABLE "communities" ADD COLUMN "payment_success_redirect_url" text;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "payment_cancel_redirect_url" text;--> statement-breakpoint
ALTER TABLE "events_communities" ADD COLUMN "payment_success_redirect_url" text;--> statement-breakpoint
ALTER TABLE "events_communities" ADD COLUMN "payment_cancel_redirect_url" text;