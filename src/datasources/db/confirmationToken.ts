import { relations } from "drizzle-orm";
import { timestamp, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { createdAndUpdatedAtFields } from "./shared";
import { usersSchema } from "./users";

const confirmationTokenStatusEnum = [
  "pending",
  "confirmed",
  "rejected",
  "expired",
] as const;
const confirmationTokenSourceEnum = [
  "work_email",
  "onboarding",
  "salary_submission",
] as const;

// CONFIRMATION-TOKEN-TABLE
// Usada para validar emails, resetear passwords, etc.
// La idea es tener una tabla que se pueda usar para validar multiples cosas
// source y sourceId te permiten saber que es lo que se esta validando
// Por ejemplo, si source es "workEmail" y sourceId es el id de un workEmailSchema
// entonces sabes que esta validando un email
// validUntil es el timestamp en el que el token deja de ser valido
export const confirmationTokenSchema = pgTable("confirmation_token", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source", {
    enum: confirmationTokenSourceEnum,
  }).notNull(),
  userId: uuid("user_id")
    .references(() => usersSchema.id)
    .notNull(),
  sourceId: text("source_id").notNull(),
  token: uuid("token").notNull().unique().defaultRandom(),
  status: text("status", {
    enum: confirmationTokenStatusEnum,
  }).default("pending"),
  validUntil: timestamp("valid_until").notNull(),
  confirmationDate: timestamp("confirmation_date"),
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
