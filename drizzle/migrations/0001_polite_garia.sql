CREATE TABLE `confirmation_token` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`source_id` text NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'pending',
	`valid_until` integer NOT NULL,
	`confirmation_date` integer,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
ALTER TABLE `work_email` RENAME COLUMN `confirmation_token` TO `confirmation_token_id`;--> statement-breakpoint
ALTER TABLE salaries ADD `work_email_id` text REFERENCES work_email(id);--> statement-breakpoint
ALTER TABLE salaries ADD `gender` text;--> statement-breakpoint
ALTER TABLE salaries ADD `gender_other_text` text;--> statement-breakpoint
ALTER TABLE work_email ADD `status` text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE work_role ADD `seniority` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `confirmation_token_id_unique` ON `confirmation_token` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `confirmation_token_token_unique` ON `confirmation_token` (`token`);--> statement-breakpoint
ALTER TABLE `work_email` DROP COLUMN `is_confirmed`;