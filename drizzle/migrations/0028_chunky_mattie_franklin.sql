DROP INDEX IF EXISTS "users_email_index";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_index" ON "users" USING btree ("email");