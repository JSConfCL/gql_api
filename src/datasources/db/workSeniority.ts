import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { workSeniorityAndRoleSchema } from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";

// WORK-ROLES-TABLE
export const workSenioritySchema = sqliteTable("work_seniority", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ...createdAndUpdatedAtFields,
});

export const workSeniorityRelations = relations(
  workSenioritySchema,
  ({ many }) => ({
    seniorityAndRole: many(workSeniorityAndRoleSchema),
  }),
);

export const selectWorkSenioritySchema =
  createSelectSchema(workSenioritySchema);

export const insertWorkSenioritySchema =
  createInsertSchema(workSenioritySchema);
