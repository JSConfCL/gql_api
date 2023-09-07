CREATE TABLE `event_tickets` (
	`event_id` text,
	`ticket_id` text,
	PRIMARY KEY(`event_id`, `ticket_id`),
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON UPDATE no action ON DELETE no action
);
