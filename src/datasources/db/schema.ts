import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  externalId: text("external_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
    sql`SELECT TIME(‘now’)`,
  ),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});
