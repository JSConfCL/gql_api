CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`external_id` text NOT NULL,
	`created_at` integer DEFAULT SELECT TIME(‘now’),
	`updated_at` integer
);
