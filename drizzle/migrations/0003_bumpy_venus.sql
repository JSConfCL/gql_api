ALTER TABLE allowed_currencies ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE communities ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE events ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE events_communities ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE events_tags ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE events_users_roles ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE events_users ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE tags ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE tags_communities ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE tickets ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE userTickets ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE users ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE users_communities ADD `deleted_at` integer;