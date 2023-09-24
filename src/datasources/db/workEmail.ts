import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema, companiesSchema } from "./schema";
import { relations } from "drizzle-orm";

// WORK-EMAILS-TABLE
export const workEmailSchema = sqliteTable("work_email", {
  id: text("id").primaryKey().unique(),
  userId: text("user_id")
    .references(() => usersSchema.id)
    .notNull(),
  workEmail: text("work_email").notNull(),
  confirmationToken: text("confirmation_token"),
  isConfirmed: int("is_confirmed", { mode: "boolean" }).default(false),
  confirmationDate: int("confirmation_date", {
    mode: "timestamp_ms",
  }),
  companyId: text("company_id").references(() => companiesSchema.id),
  ...createdAndUpdatedAtFields,
});

export const workEmailRelations = relations(workEmailSchema, ({ one }) => ({
  associatedCompany: one(companiesSchema),
  user: one(usersSchema),
}));

export const selectWorkEmailSchema = createSelectSchema(workEmailSchema);
export const insertWorkEmailSchema = createInsertSchema(workEmailSchema);
