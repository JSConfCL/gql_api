CREATE TABLE `communities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text(64),
	`description` text(1024),
	`status` text DEFAULT 'inactive' NOT NULL,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(1024) NOT NULL,
	`description` text(4096),
	`status` text DEFAULT 'inactive' NOT NULL,
	`visibility` text DEFAULT 'unlisted' NOT NULL,
	`start_date_time` integer NOT NULL,
	`end_date_time` integer,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `events_communities` (
	`event_id` text,
	`community_id` text,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	PRIMARY KEY(`community_id`, `event_id`),
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events_tags` (
	`event_id` text,
	`tag_id` text,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	PRIMARY KEY(`event_id`, `tag_id`),
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events_users_roles` (
	`event_id` text,
	`user_id` text,
	`role` text DEFAULT 'member',
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	PRIMARY KEY(`event_id`, `user_id`),
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events_users` (
	`event_id` text,
	`user_id` text,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text(1024),
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `tags_communities` (
	`tag_id` text,
	`community_id` text,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	PRIMARY KEY(`community_id`, `tag_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`lastName` text,
	`bio` text(1024) DEFAULT '',
	`email` text,
	`emailVerified` integer,
	`imageUrl` text,
	`username` text(64) NOT NULL,
	`twoFactorEnabled` integer,
	`unsafeMetadata` blob,
	`publicMetadata` blob,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `users_communities` (
	`user_id` text,
	`community_id` text,
	`role` text DEFAULT 'member',
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `communities_slug_unique` ON `communities` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `events_name_unique` ON `events` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);