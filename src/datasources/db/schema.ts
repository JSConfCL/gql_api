import { text, timestamp, pgTable, uuid } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: uuid("id").defaultRandom(),
  name: text("name"),
  email: text("email"),
  externalId: text("external_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});
