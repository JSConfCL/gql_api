ALTER TABLE "confirmation_token" DROP CONSTRAINT "confirmation_token_old_user_id_users_old_id_fk";
--> statement-breakpoint
ALTER TABLE "events_users" DROP CONSTRAINT "events_users_old_user_id_users_old_id_fk";
--> statement-breakpoint
ALTER TABLE "salaries" DROP CONSTRAINT "salaries_old_user_id_users_old_id_fk";
--> statement-breakpoint
ALTER TABLE "users_communities" DROP CONSTRAINT "users_communities_old_user_id_users_old_id_fk";
--> statement-breakpoint
ALTER TABLE "user_tickets" DROP CONSTRAINT "user_tickets_old_user_id_users_old_id_fk";
--> statement-breakpoint
ALTER TABLE "users_tags" DROP CONSTRAINT "users_tags_old_user_id_users_old_id_fk";
--> statement-breakpoint
ALTER TABLE "work_email" DROP CONSTRAINT "work_email_old_user_id_users_old_id_fk";
--> statement-breakpoint
ALTER TABLE "users_tags" DROP CONSTRAINT "users_tags_tag_id_old_user_id_pk";--> statement-breakpoint
ALTER TABLE "users_tags" ADD CONSTRAINT "users_tags_tag_id_id_pk" PRIMARY KEY("tag_id","id");--> statement-breakpoint
ALTER TABLE "confirmation_token" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "events_users" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "salaries" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users_communities" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "user_tickets" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users_tags" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "work_email" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "confirmation_token" ADD CONSTRAINT "confirmation_token_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events_users" ADD CONSTRAINT "events_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "salaries" ADD CONSTRAINT "salaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_communities" ADD CONSTRAINT "users_communities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_tickets" ADD CONSTRAINT "user_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_tags" ADD CONSTRAINT "users_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "work_email" ADD CONSTRAINT "work_email_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "confirmation_token" DROP COLUMN IF EXISTS "old_user_id";--> statement-breakpoint
ALTER TABLE "events_users" DROP COLUMN IF EXISTS "old_user_id";--> statement-breakpoint
ALTER TABLE "salaries" DROP COLUMN IF EXISTS "old_user_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "old_id";--> statement-breakpoint
ALTER TABLE "users_communities" DROP COLUMN IF EXISTS "old_user_id";--> statement-breakpoint
ALTER TABLE "user_tickets" DROP COLUMN IF EXISTS "old_user_id";--> statement-breakpoint
ALTER TABLE "users_tags" DROP COLUMN IF EXISTS "old_user_id";--> statement-breakpoint
ALTER TABLE "work_email" DROP COLUMN IF EXISTS "old_user_id";