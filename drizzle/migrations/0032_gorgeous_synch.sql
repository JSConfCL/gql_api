ALTER TABLE "events" ADD COLUMN "public_share_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "logo_image" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "preview_image" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "banner_image" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "mobile_banner_image" uuid;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "public_id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_logo_image_images_id_fk" FOREIGN KEY ("logo_image") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_preview_image_images_id_fk" FOREIGN KEY ("preview_image") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_banner_image_images_id_fk" FOREIGN KEY ("banner_image") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_mobile_banner_image_images_id_fk" FOREIGN KEY ("mobile_banner_image") REFERENCES "public"."images"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN IF EXISTS "logo_id";--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_public_id_unique" UNIQUE("public_id");