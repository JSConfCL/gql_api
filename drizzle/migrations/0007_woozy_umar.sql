CREATE TABLE `companies` (
	`company_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
/*
 SQLite does not support "Set not null to column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
ALTER TABLE users ADD `gender` text;--> statement-breakpoint
ALTER TABLE users ADD `gender_other_text` text;--> statement-breakpoint
CREATE UNIQUE INDEX `companies_company_id_unique` ON `companies` (`company_id`);