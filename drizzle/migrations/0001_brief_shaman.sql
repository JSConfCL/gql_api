CREATE TABLE `users_tags` (
  `tag_id` text,
  `user_id` text,
  `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` integer,
  `deleted_at` integer,
  PRIMARY KEY(`tag_id`, `user_id`),
  FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no ACTION ON DELETE no ACTION,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no ACTION ON DELETE no ACTION
);
