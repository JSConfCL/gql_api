CREATE TABLE IF NOT EXISTS "addon_constraints" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"addon_id" uuid NOT NULL,
	"related_addon_id" uuid NOT NULL,
	"constraint_type" text NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6),
	CONSTRAINT "addon_constraints_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addons" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"total_stock" integer,
	"max_per_ticket" integer,
	"tags" text[] DEFAULT ARRAY[]::text[],
	"is_free" boolean DEFAULT false NOT NULL,
	"is_unlimited" boolean DEFAULT false NOT NULL,
	"stripe_product_id" text,
	"event_id" uuid NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6),
	CONSTRAINT "addons_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ticket_addons" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"addon_id" uuid NOT NULL,
	"order_display" integer NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6),
	CONSTRAINT "ticket_addons_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addons_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"addon_id" uuid NOT NULL,
	"price_id" uuid NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_ticket_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_ticket_id" uuid NOT NULL,
	"addon_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_in_cents" integer NOT NULL,
	"approval_status" text DEFAULT 'pending' NOT NULL,
	"redemption_status" text DEFAULT 'pending' NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"created_at" timestamp (6) DEFAULT now() NOT NULL,
	"updated_at" timestamp (6),
	"deleted_at" timestamp (6)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addon_constraints" ADD CONSTRAINT "addon_constraints_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addon_constraints" ADD CONSTRAINT "addon_constraints_related_addon_id_addons_id_fk" FOREIGN KEY ("related_addon_id") REFERENCES "public"."addons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addons" ADD CONSTRAINT "addons_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ticket_addons" ADD CONSTRAINT "ticket_addons_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ticket_addons" ADD CONSTRAINT "ticket_addons_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addons_prices" ADD CONSTRAINT "addons_prices_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addons_prices" ADD CONSTRAINT "addons_prices_price_id_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "public"."prices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_ticket_addons" ADD CONSTRAINT "user_ticket_addons_user_ticket_id_user_tickets_id_fk" FOREIGN KEY ("user_ticket_id") REFERENCES "public"."user_tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_ticket_addons" ADD CONSTRAINT "user_ticket_addons_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_ticket_addons" ADD CONSTRAINT "user_ticket_addons_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_addon_constraints_unique" ON "addon_constraints" USING btree ("addon_id","related_addon_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_addon_constraints_addon_id" ON "addon_constraints" USING btree ("addon_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_addon_constraints_related_addon_id" ON "addon_constraints" USING btree ("related_addon_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_addon_relationships_constraint_type" ON "addon_constraints" USING btree ("constraint_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_addons_name" ON "addons" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ticket_addons_ticket_id" ON "ticket_addons" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ticket_addons_addon_id" ON "ticket_addons" USING btree ("addon_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ticket_addons_unique" ON "ticket_addons" USING btree ("ticket_id","addon_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ticket_addons_order_display" ON "ticket_addons" USING btree ("ticket_id","order_display");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_ticket_addons_user_ticket_id" ON "user_ticket_addons" USING btree ("user_ticket_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_ticket_addons_addon_id" ON "user_ticket_addons" USING btree ("addon_id");