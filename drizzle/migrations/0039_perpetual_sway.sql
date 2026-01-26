CREATE TABLE IF NOT EXISTS "ticket_requirements" (
	"ticket_id" uuid NOT NULL,
	"required_ticket_id" uuid NOT NULL,
	"requirement_type" text NOT NULL,
	"description" text,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ticket_requirements" ADD CONSTRAINT "ticket_requirements_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ticket_requirements" ADD CONSTRAINT "ticket_requirements_required_ticket_id_tickets_id_fk" FOREIGN KEY ("required_ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_ticket_requirement" ON "ticket_requirements" USING btree ("ticket_id","required_ticket_id");