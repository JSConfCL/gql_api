ALTER TABLE
  confirmation_token
ADD
  `user_id` text NOT NULL REFERENCES users(id);
