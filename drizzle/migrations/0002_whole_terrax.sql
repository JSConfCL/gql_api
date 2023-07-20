ALTER TABLE tags ADD `created_at` integer DEFAULT current_timestamp;--> statement-breakpoint
ALTER TABLE tags ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE tags_communities ADD `created_at` integer DEFAULT current_timestamp;--> statement-breakpoint
ALTER TABLE tags_communities ADD `updated_at` integer;--> statement-breakpoint
ALTER TABLE users_communities ADD `created_at` integer DEFAULT current_timestamp;--> statement-breakpoint
ALTER TABLE users_communities ADD `updated_at` integer;