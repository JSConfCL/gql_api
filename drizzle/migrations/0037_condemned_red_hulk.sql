CREATE TABLE IF NOT EXISTS "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"coupon" text NOT NULL,
	"description" text,
	"event_id" uuid NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6)
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "coupon_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "coupons" ADD CONSTRAINT "coupons_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupons_event_id_index" ON "coupons" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupons_code_index" ON "coupons" USING btree ("coupon");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "coupons_event_code_unique_index" ON "coupons" USING btree ("event_id","coupon");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
