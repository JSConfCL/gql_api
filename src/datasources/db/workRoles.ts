import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAndUpdatedAtFields } from "./shared";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// WORK-ROLES-TABLE
export const workRoleSchema = sqliteTable("work_role", {
  id: text("id").primaryKey().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ...createdAndUpdatedAtFields,
});

export const selectWorkRoleSchema = createSelectSchema(workRoleSchema);
export const insertWorkRoleSchema = createInsertSchema(workRoleSchema);
