DROP INDEX IF EXISTS "coupons_code_index";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "coupons_code_index" ON "coupons" USING btree (lower("coupon"));