ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DEFAULT 'open';--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_tickets" ALTER COLUMN "approval_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "user_tickets" DROP COLUMN IF EXISTS "status";