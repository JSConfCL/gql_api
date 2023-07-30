CREATE TABLE `allowed_currencies` (
	`id` text PRIMARY KEY NOT NULL,
	`currency` text(3) NOT NULL,
	`payment_methods` text,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer
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
	`event_id` text,
	`currency` text,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`currency`) REFERENCES `allowed_currencies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `userTickets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`ticket_template_id` text,
	`status` text DEFAULT 'cancelled' NOT NULL,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`approval_status` text DEFAULT 'pending' NOT NULL,
	`redemption_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT current_timestamp NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ticket_template_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE events ADD `timezone` text(64);--> statement-breakpoint
ALTER TABLE events ADD `geo_latitude` text;--> statement-breakpoint
ALTER TABLE events ADD `geo_longitude` text;--> statement-breakpoint
ALTER TABLE events ADD `geo_address_json` text;--> statement-breakpoint
ALTER TABLE events ADD `meeting_url` text;--> statement-breakpoint
ALTER TABLE events ADD `max_attendees` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `allowed_currencies_currency_unique` ON `allowed_currencies` (`currency`);--> statement-breakpoint
CREATE UNIQUE INDEX `tickets_name_unique` ON `tickets` (`name`);