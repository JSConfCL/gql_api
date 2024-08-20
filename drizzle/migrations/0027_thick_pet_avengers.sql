CREATE EXTENSION IF NOT EXISTS "pg_trgm";;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "btree_gin";;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_index" ON "users" USING gin ("email" gin_trgm_ops );--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_name_index" ON "users" USING gin ("name" gin_trgm_ops );;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_last_name_index" ON "users" USING gin ("lastName" gin_trgm_ops );--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_username_index" ON "users" USING gin ("username" gin_trgm_ops );
