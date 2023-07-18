CREATE TABLE `users_communities` (
	`user_id` integer NOT NULL,
	`community_id` integer NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	PRIMARY KEY(`community_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `communities` RENAME COLUMN `descrtiption` TO `description`;--> statement-breakpoint
ALTER TABLE communities ADD `status` text DEFAULT 'inactive' NOT NULL;