ALTER TABLE salaries RENAME TO salaries_old; --> statement-breakpoint

CREATE TABLE `salaries` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `amount` integer NOT NULL,
  `company_id` text,
  `currency_code` text,
  `work_role_id` text,
  `work_email_id` text,
  `years_of_experience` integer NOT NULL,
  `gender` text,
  `gender_other_text` text,
  `country_code` text NOT NULL,
  `type_of_employment` text NOT NULL,
  `work_metodology` text NOT NULL,
  `created_at` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` integer,
  `deleted_at` integer,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no ACTION ON DELETE no ACTION,
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`company_id`) ON UPDATE no ACTION ON DELETE no ACTION,
  FOREIGN KEY (`work_role_id`) REFERENCES `work_role`(`id`) ON UPDATE no ACTION ON DELETE no ACTION,
  FOREIGN KEY (`work_email_id`) REFERENCES `work_email`(`id`) ON UPDATE no ACTION ON DELETE no ACTION
); --> statement-breakpoint

DROP TABLE salaries_old
