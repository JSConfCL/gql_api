import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema } from "./users";
import { relations } from "drizzle-orm";

// CONFIRMATION-TOKEN-TABLE
// Usada para validar emails, resetear passwords, etc.
// La idea es tener una tabla que se pueda usar para validar multiples cosas
// source y sourceId te permiten saber que es lo que se esta validando
// Por ejemplo, si source es "workEmail" y sourceId es el id de un workEmailSchema
// entonces sabes que esta validando un email
// validUntil es el timestamp en el que el token deja de ser valido
export const confirmationTokenSchema = sqliteTable("confirmation_token", {
  id: text("id").primaryKey().unique(),
  source: text("source", {
    enum: ["work_email", "onboarding", "salary_submission"],
  }).notNull(),
  userId: text("user_id")
    .references(() => usersSchema.id)
    .notNull(),
  sourceId: text("source_id").notNull(),
  token: text("token").notNull().unique(),
  status: text("status", {
    enum: ["pending", "confirmed", "rejected", "expired"],
  }).default("pending"),
  validUntil: int("valid_until", {
    mode: "timestamp_ms",
  }).notNull(),
  confirmationDate: int("confirmation_date", {
    mode: "timestamp_ms",
  }),
  ...createdAndUpdatedAtFields,
});

export const confirmationTokenRelations = relations(
  confirmationTokenSchema,
  ({ one }) => ({
    user: one(usersSchema, {
      fields: [confirmationTokenSchema.userId],
      references: [usersSchema.id],
    }),
  }),
);

export const selectConfirmationTokenSchema = createSelectSchema(
  confirmationTokenSchema,
);
export const insertConfirmationTokenSchema = createInsertSchema(
  confirmationTokenSchema,
);
