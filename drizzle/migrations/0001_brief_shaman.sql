CREATE TABLE `users_tags` (
	`tag_id` text,
	`user_id` text,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer,
	PRIMARY KEY(`tag_id`, `user_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
