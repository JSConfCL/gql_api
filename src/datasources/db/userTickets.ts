import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { ticketsSchema, usersSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export const userTicketsStatusEnum = ["active", "inactive"] as const;
export const userTicketsPaymentStatusEnum = [
  "paid",
  "unpaid",
  "not_required",
] as const;
export const userTicketsApprovalStatusEnum = [
  "approved",
  "pending",
  "rejected",
] as const;
export const userTicketsRedemptionStatusEnum = ["redeemed", "pending"] as const;
// USER-TICKETS-TABLE
export const userTicketsSchema = pgTable("user_tickets", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: text("user_id").references(() => usersSchema.id),
  ticketTemplateId: uuid("ticket_template_id")
    .references(() => ticketsSchema.id)
    .notNull(),
  status: text("status", { enum: userTicketsStatusEnum })
    .default("inactive")
    .notNull(),
  paymentStatus: text("payment_status", { enum: userTicketsPaymentStatusEnum })
    .default("unpaid")
    .notNull(),
  approvalStatus: text("approval_status", {
    enum: userTicketsApprovalStatusEnum,
  })
    .default("pending")
    .notNull(),
  redemptionStatus: text("redemption_status", {
    enum: userTicketsRedemptionStatusEnum,
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
