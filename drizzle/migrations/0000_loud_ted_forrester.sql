CREATE TABLE `communities` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`description` text(1024),
	`status` text DEFAULT 'inactive' NOT NULL,
	`created_at` integer DEFAULT current_timestamp,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text NOT NULL,
	`name` text,
	`bio` text(1024),
	`email` text,
	`username` text(64) NOT NULL,
	`external_id` text NOT NULL,
	`created_at` integer DEFAULT current_timestamp,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `users_communities` (
	`user_id` text NOT NULL,
	`community_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	PRIMARY KEY(`community_id`, `user_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `communities_id_unique` ON `communities` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_id_unique` ON `users` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);