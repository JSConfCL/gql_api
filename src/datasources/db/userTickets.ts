import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { ticketsSchema, usersSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

// USER-TICKETS-TABLE
export const userTicketsSchema = sqliteTable("user_tickets", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").references(() => usersSchema.id),
  ticketTemplateId: text("ticket_template_id")
    .references(() => ticketsSchema.id)
    .notNull(),
  status: text("status", { enum: ["active", "cancelled"] })
    .default("cancelled")
    .notNull(),
  paymentStatus: text("payment_status", { enum: ["paid", "unpaid"] })
    .default("unpaid")
    .notNull(),
  approvalStatus: text("approval_status", {
    enum: ["approved", "pending"],
  })
    .default("pending")
    .notNull(),
  redemptionStatus: text("redemption_status", {
    enum: ["redeemed", "pending"],
  })
    .default("pending")
    .notNull(),
  ...createdAndUpdatedAtFields,
});

export const userTicketsRelations = relations(userTicketsSchema, ({ one }) => ({
  ticketTemplate: one(ticketsSchema, {
    fields: [userTicketsSchema.ticketTemplateId],
    references: [ticketsSchema.id],
  }),
  user: one(usersSchema, {
    fields: [userTicketsSchema.userId],
    references: [usersSchema.id],
  }),
}));

export const selectUserTicketsSchema = createSelectSchema(userTicketsSchema);
export const insertUserTicketsSchema = createInsertSchema(userTicketsSchema);
