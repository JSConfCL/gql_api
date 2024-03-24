ALTER TABLE "users" RENAME COLUMN "id" TO "old_id";--> statement-breakpoint
ALTER TABLE "confirmation_token" DROP CONSTRAINT "confirmation_token_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "events_users" DROP CONSTRAINT "events_users_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "salaries" DROP CONSTRAINT "salaries_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users_communities" DROP CONSTRAINT "users_communities_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_tickets" DROP CONSTRAINT "user_tickets_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users_tags" DROP CONSTRAINT "users_tags_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "work_email" DROP CONSTRAINT "work_email_user_id_users_id_fk";
--> statement-breakpoint
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
