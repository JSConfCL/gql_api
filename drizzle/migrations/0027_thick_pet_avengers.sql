CREATE INDEX IF NOT EXISTS "users_email_index" ON "users" USING gin ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_name_index" ON "users" USING gin ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_last_name_index" ON "users" USING gin ("lastName");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_username_index" ON "users" USING gin ("username");