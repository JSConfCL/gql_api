import { pgTable, text } from "drizzle-orm/pg-core";
import { createdAndUpdatedAtFields } from "./shared";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { salariesSchema } from "./schema";

// WORK-ROLES-TABLE
export const workRoleSchema = pgTable("work_role", {
  id: text("id").primaryKey().unique(),
  name: text("name").notNull(),
  seniority: text("seniority").notNull(),
  description: text("description").notNull(),
  ...createdAndUpdatedAtFields,
});

export const workRoleRelations = relations(workRoleSchema, ({ many }) => ({
  salaries: many(salariesSchema),
}));

export const selectWorkRoleSchema = createSelectSchema(workRoleSchema);
export const insertWorkRoleSchema = createInsertSchema(workRoleSchema);
