CREATE TABLE `allowed_currencies` (
	`id` text PRIMARY KEY NOT NULL,
	`currency` text(3) NOT NULL,
	`payment_methods` text,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `communities` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text(64),
	`description` text(1024),
	`status` text DEFAULT 'inactive' NOT NULL,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`company_id` text PRIMARY KEY NOT NULL,
	`name` text(512),
	`description` text(4096),
	`domain` text NOT NULL,
	`logo` text,
	`website` text,
	`status` text DEFAULT 'draft',
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `confirmation_token` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`user_id` text NOT NULL,
	`source_id` text NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'pending',
	`valid_until` integer NOT NULL,
	`confirmation_date` integer,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
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
	`timezone` text(64),
	`geo_latitude` text,
	`geo_longitude` text,
	`geo_address_json` text,
	`meeting_url` text,
	`max_attendees` integer,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `events_communities` (
	`event_id` text NOT NULL,
	`community_id` text NOT NULL,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer,
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
	`deleted_at` integer,
	PRIMARY KEY(`event_id`, `tag_id`),
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `events_users` (
	`event_id` text,
	`user_id` text,
	`role` text DEFAULT 'member',
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `salaries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`company_id` text,
	`currency` text,
	`work_role_id` text,
	`work_email_id` text,
	`years_of_experience` integer NOT NULL,
	`gender` text,
	`gender_other_text` text,
	`country_code` text NOT NULL,
	`type_of_employment` text NOT NULL,
	`work_metodology` text NOT NULL,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`company_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`currency`) REFERENCES `allowed_currencies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_role_id`) REFERENCES `work_role`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`work_email_id`) REFERENCES `work_email`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text(1024),
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `tags_communities` (
	`tag_id` text,
	`community_id` text,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer,
	PRIMARY KEY(`community_id`, `tag_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(1024) NOT NULL,
	`description` text(4096),
	`status` text DEFAULT 'inactive' NOT NULL,
	`visibility` text DEFAULT 'unlisted' NOT NULL,
	`start_date_time` integer NOT NULL,
	`end_date_time` integer,
	`requires_approval` integer DEFAULT false,
	`price` integer,
	`quantity` integer,
	`event_id` text NOT NULL,
	`currency` text,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`currency`) REFERENCES `allowed_currencies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`lastName` text,
	`bio` text(1024) DEFAULT '',
	`email` text,
	`gender` text,
	`gender_other_text` text,
	`isSuperAdmin` integer DEFAULT false,
	`emailVerified` integer,
	`imageUrl` text,
	`username` text(64) NOT NULL,
	`twoFactorEnabled` integer,
	`unsafeMetadata` blob,
	`publicMetadata` blob,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `users_communities` (
	`user_id` text,
	`community_id` text,
	`role` text DEFAULT 'member',
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`community_id`) REFERENCES `communities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`ticket_template_id` text NOT NULL,
	`status` text DEFAULT 'cancelled' NOT NULL,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`approval_status` text DEFAULT 'pending' NOT NULL,
	`redemption_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ticket_template_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_email` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`work_email` text NOT NULL,
	`confirmation_token_id` text,
	`status` text DEFAULT 'pending',
	`confirmation_date` integer,
	`company_id` text,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`confirmation_token_id`) REFERENCES `confirmation_token`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`company_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_role` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`seniority` text NOT NULL,
	`description` text NOT NULL,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `allowed_currencies_currency_unique` ON `allowed_currencies` (`currency`);--> statement-breakpoint
CREATE UNIQUE INDEX `communities_slug_unique` ON `communities` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `companies_company_id_unique` ON `companies` (`company_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `confirmation_token_id_unique` ON `confirmation_token` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `confirmation_token_token_unique` ON `confirmation_token` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `events_name_unique` ON `events` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `salaries_id_unique` ON `salaries` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_name_unique` ON `tickets` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `work_email_id_unique` ON `work_email` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `work_role_id_unique` ON `work_role` (`id`);