import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const NOW = sql`(strftime('%s', 'now'))`;
export const userSchema = sqliteTable(
  "user",
  {
    id: text("id").primaryKey().notNull(),
    name: text("name"),
    email: text("email"),
    externalId: text("external_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(NOW),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  },
  (table) => {
    return {
      nameIdx: index("user_name_idx").on(table.name),
    };
  },
);
export const selectUserSchema = createSelectSchema(userSchema);
export const insertUserSchema = createInsertSchema(userSchema);
