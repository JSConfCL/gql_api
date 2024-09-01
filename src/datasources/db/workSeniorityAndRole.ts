import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { workSenioritySchema, workRoleSchema, salariesSchema } from "./schema";
import { createdAndUpdatedAtFields, uuid } from "./shared";

// WORK-ROLES-TABLE
export const workSeniorityAndRoleSchema = sqliteTable(
  "work_seniority_and_role",
  {
    id: uuid("id").primaryKey(),
    workRoleId: uuid("work_role_id").references(() => workRoleSchema.id),
    workSeniorityId: uuid("work_seniority_id").references(
      () => workSenioritySchema.id,
    ),
    description: text("description"),
    ...createdAndUpdatedAtFields,
  },
);

export const workSeniorityAndRoleRelations = relations(
  workSeniorityAndRoleSchema,
  ({ one, many }) => ({
    seniority: one(workSenioritySchema, {
      fields: [workSeniorityAndRoleSchema.workSeniorityId],
      references: [workSenioritySchema.id],
    }),
    role: one(workRoleSchema, {
      fields: [workSeniorityAndRoleSchema.workRoleId],
      references: [workRoleSchema.id],
    }),
    salaries: many(salariesSchema),
  }),
);

export const selectWorkSeniorityAndRoleSchema = createSelectSchema(
  workSeniorityAndRoleSchema,
);

export const insertWorkSeniorityAndRoleSchema = createInsertSchema(
  workSeniorityAndRoleSchema,
);
