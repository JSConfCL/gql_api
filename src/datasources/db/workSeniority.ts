import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { workSeniorityAndRoleSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

// WORK-ROLES-TABLE
export const workSenioritySchema = pgTable("work_seniority", {
  id: uuid("id").primaryKey().defaultRandom(),
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
