CREATE TABLE `users` (
	`id` text NOT NULL,
	`name` text,
	`bio` text(1024),
	`email` text,
	`username` text(64),
	`external_id` text NOT NULL,
	`created_at` integer DEFAULT current_timestamp,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_id_unique` ON `users` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);