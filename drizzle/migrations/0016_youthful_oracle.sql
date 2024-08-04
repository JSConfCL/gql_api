CREATE TABLE IF NOT EXISTS "schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_at" timestamp (6) NOT NULL,
	"end_at" timestamp (6) NOT NULL,
	"status" text,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6),
	CONSTRAINT "schedule_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_at" timestamp (6) NOT NULL,
	"end_at" timestamp (6) NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6),
	CONSTRAINT "sessions_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session_to_speakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"speaker_id" uuid NOT NULL,
	CONSTRAINT "session_to_speakers_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "speakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"avatar" text,
	"event_id" uuid,
	"social_links" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6),
	CONSTRAINT "speakers_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "tags" text[] DEFAULT ARRAY[]::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "external_link" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule" ADD CONSTRAINT "schedule_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_schedule_id_schedule_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedule"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session_to_speakers" ADD CONSTRAINT "session_to_speakers_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session_to_speakers" ADD CONSTRAINT "session_to_speakers_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "speakers" ADD CONSTRAINT "speakers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
