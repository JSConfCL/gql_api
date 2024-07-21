ALTER TABLE "users" ALTER COLUMN "isSuperAdmin" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "emailVerified" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "emailVerified" SET NOT NULL;