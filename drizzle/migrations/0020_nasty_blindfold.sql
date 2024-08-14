CREATE TABLE IF NOT EXISTS "user_tickets_email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_ticket_id" uuid NOT NULL,
	"email_type" text NOT NULL,
	"sent_at" timestamp (6),
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6),
	CONSTRAINT "user_tickets_email_logs_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_tickets_email_logs" ADD CONSTRAINT "user_tickets_email_logs_user_ticket_id_user_tickets_id_fk" FOREIGN KEY ("user_ticket_id") REFERENCES "public"."user_tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_tickets_email_logs_email_type_index" ON "user_tickets_email_logs" USING btree ("email_type");