import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields, statusEnumOptions } from "./shared";
import {
  usersSchema,
  companiesSchema,
  confirmationTokenSchema,
} from "./schema";
import { relations } from "drizzle-orm";

// WORK-EMAILS-TABLE
export const workEmailSchema = sqliteTable("work_email", {
  id: text("id").primaryKey().unique(),
  userId: text("user_id")
    .references(() => usersSchema.id)
    .notNull(),
  workEmail: text("work_email").notNull(),
  confirmationTokenId: text("confirmation_token_id").references(
    () => confirmationTokenSchema.id,
  ),
  status: text("status", {
    enum: statusEnumOptions,
  }).default("pending"),
  confirmationDate: int("confirmation_date", {
    mode: "timestamp_ms",
  }),
  companyId: text("company_id").references(() => companiesSchema.id),
  ...createdAndUpdatedAtFields,
});

export const workEmailRelations = relations(workEmailSchema, ({ one }) => ({
  associatedCompany: one(companiesSchema, {
    fields: [workEmailSchema.companyId],
    references: [companiesSchema.id],
  }),
  confirmationToken: one(confirmationTokenSchema, {
    fields: [workEmailSchema.confirmationTokenId],
    references: [confirmationTokenSchema.id],
  }),
  user: one(usersSchema, {
    fields: [workEmailSchema.userId],
    references: [usersSchema.id],
  }),
}));

export const selectWorkEmailSchema = createSelectSchema(workEmailSchema);
export const insertWorkEmailSchema = createInsertSchema(workEmailSchema);
