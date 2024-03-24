ALTER TABLE "confirmation_token" DROP CONSTRAINT "confirmation_token_old_user_id_users_old_id_fk";
--> statement-breakpoint
ALTER TABLE "confirmation_token" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "confirmation_token" ADD CONSTRAINT "confirmation_token_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "confirmation_token" DROP COLUMN IF EXISTS "old_user_id";
