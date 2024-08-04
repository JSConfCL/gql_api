import { relations } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { purchaseOrdersSchema, ticketsSchema, usersSchema } from "./schema";
import {
  createdAndUpdatedAtFields,
  TypescriptEnumAsDBEnumOptions,
} from "./shared";

export enum UserTicketsApprovalStatusEnum {
  Approved = "approved",
  GiftAccepted = "gift_accepted",
  NotRequired = "not_required",
  Pending = "pending",
  Gifted = "gifted",
  Rejected = "rejected",
  Cancelled = "cancelled",
}
export const userTicketsRedemptionStatusEnum = ["redeemed", "pending"] as const;
// USER-TICKETS-TABLE
export const userTicketsSchema = pgTable("user_tickets", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id").references(() => usersSchema.id),
  ticketTemplateId: uuid("ticket_template_id")
    .references(() => ticketsSchema.id)
    .notNull(),
  purchaseOrderId: uuid("purchase_order_id")
    .references(() => purchaseOrdersSchema.id)
    .notNull(),
  approvalStatus: text("approval_status", {
    enum: TypescriptEnumAsDBEnumOptions(UserTicketsApprovalStatusEnum),
  })
    .default(UserTicketsApprovalStatusEnum.Pending)
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
  purchaseOrdersSchema: one(purchaseOrdersSchema, {
    fields: [userTicketsSchema.purchaseOrderId],
    references: [purchaseOrdersSchema.id],
  }),
  user: one(usersSchema, {
    fields: [userTicketsSchema.userId],
    references: [usersSchema.id],
  }),
}));

export const selectUserTicketsSchema = createSelectSchema(userTicketsSchema);
export const insertUserTicketsSchema = createInsertSchema(userTicketsSchema);
