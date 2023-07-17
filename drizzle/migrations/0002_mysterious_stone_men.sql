CREATE TABLE `users_to_groups` (
	`user_id` integer NOT NULL,
	`community_id` integer NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	PRIMARY KEY(`community_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE communities ADD `description` text(1024);--> statement-breakpoint
ALTER TABLE communities ADD `status` text DEFAULT 'inactive' NOT NULL;--> statement-breakpoint
ALTER TABLE `communities` DROP COLUMN `descrtiption`;