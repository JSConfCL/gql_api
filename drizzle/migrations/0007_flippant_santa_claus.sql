ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "externalId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "twoFactorEnabled";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "unsafeMetadata";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_externalId_unique" UNIQUE("externalId");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");