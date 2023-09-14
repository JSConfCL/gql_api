CREATE TABLE `companies` (
	`company_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`domain` text NOT NULL,
	`logo` text,
	`website` text,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `salaries` (
	`company_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text,
	`work_role_id` text,
	`years_of_experience` integer NOT NULL,
	`country_code` text NOT NULL,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`currency`) REFERENCES `allowed_currencies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_role_id`) REFERENCES `work_role`(`company_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_email` (
	`company_id` text,
	`user_id` text NOT NULL,
	`work_email` text NOT NULL,
	`confirmation_token` text NOT NULL,
	`is_confirmed` integer DEFAULT false,
	`confirmation_date` integer,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`company_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_role` (
	`company_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer
); --> statement-breakpoint
ALTER TABLE users ADD `gender` text;--> statement-breakpoint
ALTER TABLE users ADD `gender_other_text` text;--> statement-breakpoint
CREATE UNIQUE INDEX `companies_company_id_unique` ON `companies` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `salaries_company_id_unique` ON `salaries` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `work_email_company_id_unique` ON `work_email` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `work_role_company_id_unique` ON `work_role` (`company_id`);