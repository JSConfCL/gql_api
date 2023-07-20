CREATE TABLE `tags` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`description` text(1024)
);
--> statement-breakpoint
CREATE TABLE `tags_communities` (
	`tag_id` text NOT NULL,
	`community_id` text NOT NULL,
	PRIMARY KEY(`community_id`, `tag_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE communities ADD `slug` text(64);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_id_unique` ON `tags` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `communities_slug_unique` ON `communities` (`slug`);