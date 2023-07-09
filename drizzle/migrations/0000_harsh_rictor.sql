CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid DEFAULT gen_random_uuid(),
	"name" text,
	"email" text,
	"external_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp
);
