CREATE TABLE IF NOT EXISTS "user_ticket_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_ticket_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"transfer_message" text,
	"expiration_date" timestamp NOT NULL,
	"is_return" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6)
);
--> statement-breakpoint
ALTER TABLE "user_tickets" DROP CONSTRAINT "user_tickets_purchase_order_id_purchase_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "user_tickets" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_ticket_transfers" ADD CONSTRAINT "user_ticket_transfers_user_ticket_id_user_tickets_id_fk" FOREIGN KEY ("user_ticket_id") REFERENCES "public"."user_tickets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_ticket_transfers" ADD CONSTRAINT "user_ticket_transfers_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_ticket_transfers" ADD CONSTRAINT "user_ticket_transfers_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_ticket_transfers_user_ticket_id_index" ON "user_ticket_transfers" USING btree ("user_ticket_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_ticket_transfers_sender_user_id_index" ON "user_ticket_transfers" USING btree ("sender_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_ticket_transfers_recipient_user_id_index" ON "user_ticket_transfers" USING btree ("recipient_user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_tickets" ADD CONSTRAINT "user_tickets_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_event_id_index" ON "tickets" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_tickets_ticket_template_id_index" ON "user_tickets" USING btree ("ticket_template_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_tickets_user_id_index" ON "user_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_tickets_approval_status_index" ON "user_tickets" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_tickets_purchase_order_id_index" ON "user_tickets" USING btree ("purchase_order_id");