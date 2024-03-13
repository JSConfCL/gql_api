CREATE TABLE IF NOT EXISTS "prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"price" integer,
	"currency_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tickets_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"price_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_currency_allowed_currencies_id_fk";
--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "price";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN IF EXISTS "currency";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prices" ADD CONSTRAINT "prices_currency_id_allowed_currencies_id_fk" FOREIGN KEY ("currency_id") REFERENCES "allowed_currencies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets_prices" ADD CONSTRAINT "tickets_prices_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets_prices" ADD CONSTRAINT "tickets_prices_price_id_prices_id_fk" FOREIGN KEY ("price_id") REFERENCES "prices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
