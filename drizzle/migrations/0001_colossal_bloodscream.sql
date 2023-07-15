CREATE TABLE `communities` (
  `id` text NOT NULL,
  `name` text NOT NULL,
  `descrtiption` text(1024),
  `created_at` integer DEFAULT CURRENT_TIMESTAMP,
  `updated_at` integer
);

--> statement-breakpoint
CREATE UNIQUE INDEX `communities_id_unique` ON `communities` (`id`);
