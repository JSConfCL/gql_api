ALTER TABLE "user_tickets_email_logs" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_tickets_email_logs" ADD CONSTRAINT "user_tickets_email_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
