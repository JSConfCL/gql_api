CREATE TABLE IF NOT EXISTS "prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"price" integer,
	"currency_id" uuid,
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
