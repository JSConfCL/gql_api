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

export const userRelations = relations(usersSchema, ({ many }) => ({
  communities: many(communitySchema),
}));

export const communitySchema = sqliteTable("communities", {
  id: text("id").unique().notNull(),
  name: text("name").notNull(),
  description: text("description", { length: 1024 }),
  status: text("status", { enum: ["active", "inactive"] })
    .default("inactive")
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(
    sql`current_timestamp`,
  ),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});
export const selectCommunitySchema = createSelectSchema(communitySchema);
export const insertCommunitySchema = createInsertSchema(communitySchema);
export const communityRelations = relations(usersSchema, ({ many }) => ({
  users: many(usersSchema),
}));
