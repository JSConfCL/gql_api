CREATE TABLE `events` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text(1024) NOT NULL,
  `description` text(4096),
  `status` text DEFAULT 'inactive' NOT NULL,
  `visibility` text DEFAULT 'unlisted' NOT NULL,
  `start_date_time` integer NOT NULL,
  `end_date_time` integer,
  `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` integer
);

--> statement-breakpoint
CREATE TABLE `events_communities` (
  `event_id` text NOT NULL,
  `community_id` text NOT NULL,
  `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` integer,
  PRIMARY KEY(`community_id`, `event_id`),
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no ACTION ON DELETE no ACTION,
  FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no ACTION ON DELETE no ACTION
);

--> statement-breakpoint
CREATE TABLE `events_tags` (
  `event_id` text NOT NULL,
  `tag_id` text NOT NULL,
  `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` integer,
  PRIMARY KEY(`event_id`, `tag_id`),
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no ACTION ON DELETE no ACTION,
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no ACTION ON DELETE no ACTION
);

--> statement-breakpoint
CREATE TABLE `events_users_roles` (
  `event_id` text NOT NULL,
  `user_id` text NOT NULL,
  `role` text DEFAULT 'member' NOT NULL,
  `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` integer,
  PRIMARY KEY(`event_id`, `user_id`),
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no ACTION ON DELETE no ACTION,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no ACTION ON DELETE no ACTION
);

--> statement-breakpoint
CREATE TABLE `events_users` (
  `event_id` text NOT NULL,
  `user_id` text NOT NULL,
  `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` integer,
  PRIMARY KEY(`event_id`, `user_id`),
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no ACTION ON DELETE no ACTION,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no ACTION ON DELETE no ACTION
);

/*
 SQLite does not support "Set not null to column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
 https://www.sqlite.org/lang_altertable.html
 https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3
 
 Due to that we don't generate migration automatically and it has to be done manually
 */
--> statement-breakpoint
CREATE UNIQUE INDEX `events_id_unique` ON `events` (`id`);

--> statement-breakpoint
CREATE UNIQUE INDEX `events_name_unique` ON `events` (`name`);