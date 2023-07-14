import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const usersSchema = sqliteTable("users", {
  id: text("id").unique().notNull(),
  name: text("name"),
  bio: text("bio", { length: 1024 }),
  email: text("email"),
  username: text("username", { length: 64 }).unique().notNull(),
  externalId: text("external_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
    sql`current_timestamp`,
  ),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});
export const selectUsersSchema = createSelectSchema(usersSchema);
export const insertUsersSchema = createInsertSchema(usersSchema);
// export const userRelations = relations(usersSchema, ({ many }) => ({
//   communities: many(communitySchema),
// }));

// export const communitySchema = sqliteTable(
//   "communities",
//   {
//     id: text("id").primaryKey().notNull(),
//     name: text("name"),
//     email: text("email"),
//     externalId: text("external_id").notNull(),
//     createdAt: integer("created_at", { mode: "timestamp_ms" }).default(NOW),
//     updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
//   },
//   (table) => {
//     return {
//       nameIdx: index("user_name_idx").on(table.name),
//     };
//   },
// );
// export const selectCommunitySchema = createSelectSchema(communitySchema);
// export const insertCommunitySchema = createInsertSchema(communitySchema);
