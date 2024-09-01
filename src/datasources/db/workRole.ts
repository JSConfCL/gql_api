import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { workSeniorityAndRoleSchema } from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";

// WORK-ROLES-TABLE
export const workRoleSchema = sqliteTable("work_role", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ...createdAndUpdatedAtFields,
});

export const workRoleRelations = relations(workRoleSchema, ({ many }) => ({
  seniorityAndRole: many(workSeniorityAndRoleSchema),
}));

export const selectWorkRoleSchema = createSelectSchema(workRoleSchema);

export const insertWorkRoleSchema = createInsertSchema(workRoleSchema);
