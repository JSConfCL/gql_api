ALTER TABLE "prices" ALTER COLUMN "price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "requires_approval" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "payment_platform_payment_link" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD COLUMN "payment_platform_expiration_date" date;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "is_unlimited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "stripe_product_id" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "mercado_pago_product_id" text;