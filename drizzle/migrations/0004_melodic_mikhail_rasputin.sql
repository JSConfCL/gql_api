ALTER TABLE "communities" ADD COLUMN "logo_image_sanity_ref" text;--> statement-breakpoint
ALTER TABLE "communities" ADD COLUMN "banner_image_sanity_ref" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "sanity_event_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "banner_image_sanity_ref" text;