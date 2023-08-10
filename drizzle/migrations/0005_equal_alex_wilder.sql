DROP TABLE `events_users_roles`;--> statement-breakpoint
ALTER TABLE `userTickets` RENAME TO `user_tickets`;--> statement-breakpoint
ALTER TABLE events_users ADD `role` text DEFAULT 'member';
