CREATE TABLE IF NOT EXISTS "galleries" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"event_id" uuid,
	"slug" text NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6),
	CONSTRAINT "galleries_id_unique" UNIQUE("id"),
	CONSTRAINT "galleries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "images" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"hosting" text NOT NULL,
	"gallery_id" uuid,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6),
	CONSTRAINT "images_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "galleries" ADD CONSTRAINT "galleries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "galleries" ADD CONSTRAINT "galleries_slug_tags_id_fk" FOREIGN KEY ("slug") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "images" ADD CONSTRAINT "images_gallery_id_galleries_id_fk" FOREIGN KEY ("gallery_id") REFERENCES "public"."galleries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gallery_slug_index" ON "galleries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "images_tags_index" ON "images" USING btree ("tags");