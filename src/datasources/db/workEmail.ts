import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema } from "./users";
import { companiesSchema } from "./companies";

// WORK-EMAILS-TABLE
export const workEmailSchema = sqliteTable("companies", {
  id: text("company_id").primaryKey().unique(),
  userId: text("user_id")
    .references(() => usersSchema.id)
    .notNull(),
  workEmail: text("work_email").notNull(),
  confirmationToken: text("confirmation_token").notNull(),
  isConfirmed: int("is_confirmed", { mode: "boolean" }).default(false),
  confirmationDate: int("confirmation_date", {
    mode: "timestamp_ms",
  }),
  companyId: text("company_id").references(() => companiesSchema.id),
  ...createdAndUpdatedAtFields,
});

export const selectWorkEmailSchema = createSelectSchema(workEmailSchema);
export const insertWorkEmailSchema = createInsertSchema(workEmailSchema);
