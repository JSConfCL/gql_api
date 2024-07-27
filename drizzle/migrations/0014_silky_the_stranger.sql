ALTER TABLE "users" DROP CONSTRAINT "users_externalId_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "externalId" DROP NOT NULL;