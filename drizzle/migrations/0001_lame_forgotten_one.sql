CREATE TABLE `communities` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`descrtiption` text(1024),
	`created_at` integer DEFAULT current_timestamp,
	`updated_at` integer
);
--> statement-breakpoint
/*
 SQLite does not support "Set not null to column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
CREATE UNIQUE INDEX `communities_id_unique` ON `communities` (`id`);