ALTER TABLE "users" RENAME COLUMN "id" TO "old_id";--> statement-breakpoint
ALTER TABLE "confirmation_token" DROP CONSTRAINT IF EXISTS "confirmation_token_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "events_users" DROP CONSTRAINT IF EXISTS "events_users_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "salaries" DROP CONSTRAINT IF EXISTS "salaries_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users_communities" DROP CONSTRAINT IF EXISTS "users_communities_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_tickets" DROP CONSTRAINT IF EXISTS "user_tickets_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users_tags" DROP CONSTRAINT IF EXISTS "users_tags_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "work_email" DROP CONSTRAINT IF EXISTS "work_email_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_old_id_unique" UNIQUE("old_id");
--> statement-breakpoint
/*
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'users'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually

    Hope to release this update as soon as possible
*/

-- ALTER TABLE "users" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "confirmation_token" ADD CONSTRAINT "confirmation_token_user_id_users_old_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("old_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events_users" ADD CONSTRAINT "events_users_user_id_users_old_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("old_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "salaries" ADD CONSTRAINT "salaries_user_id_users_old_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("old_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_communities" ADD CONSTRAINT "users_communities_user_id_users_old_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("old_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_tickets" ADD CONSTRAINT "user_tickets_user_id_users_old_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("old_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_tags" ADD CONSTRAINT "users_tags_user_id_users_old_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("old_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_email" ADD CONSTRAINT "work_email_user_id_users_old_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("old_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
