ALTER TABLE "users" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;