import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { workSeniorityAndRoleSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

// WORK-ROLES-TABLE
export const workRoleSchema = pgTable("work_role", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  ...createdAndUpdatedAtFields,
});

export const workRoleRelations = relations(workRoleSchema, ({ many }) => ({
  seniorityAndRole: many(workSeniorityAndRoleSchema),
}));

export const selectWorkRoleSchema = createSelectSchema(workRoleSchema);

export const insertWorkRoleSchema = createInsertSchema(workRoleSchema);
