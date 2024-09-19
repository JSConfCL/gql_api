import { relations } from "drizzle-orm";
import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { purchaseOrdersSchema, ticketsSchema, usersSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export enum UserTicketApprovalStatus {
  Approved = "approved",
  Pending = "pending",
  GiftAccepted = "gift_accepted",
  Gifted = "gifted",
  NotRequired = "not_required",
  Rejected = "rejected",
  Cancelled = "cancelled",
}

export const userTicketsApprovalStatusEnum = [
  UserTicketApprovalStatus.Approved,
  UserTicketApprovalStatus.Pending,
  UserTicketApprovalStatus.GiftAccepted,
  UserTicketApprovalStatus.Gifted,
  UserTicketApprovalStatus.NotRequired,
  UserTicketApprovalStatus.Rejected,
  UserTicketApprovalStatus.Cancelled,
] as const;

export enum UserTicketRedemptionStatus {
  Redeemed = "redeemed",
  Pending = "pending",
}

export const userTicketsRedemptionStatusEnum = [
  UserTicketRedemptionStatus.Redeemed,
  UserTicketRedemptionStatus.Pending,
] as const;

// USER-TICKETS-TABLE
export const userTicketsSchema = pgTable(
  "user_tickets",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    publicId: uuid("public_id").notNull().defaultRandom(),
    userId: uuid("user_id").references(() => usersSchema.id),
    ticketTemplateId: uuid("ticket_template_id")
      .references(() => ticketsSchema.id)
      .notNull(),
    purchaseOrderId: uuid("purchase_order_id")
      .references(() => purchaseOrdersSchema.id)
      .notNull(),
    approvalStatus: text("approval_status", {
      enum: userTicketsApprovalStatusEnum,
    })
      .default(UserTicketApprovalStatus.Pending)
      .notNull(),
    redemptionStatus: text("redemption_status", {
      enum: [
        UserTicketRedemptionStatus.Redeemed,
        UserTicketRedemptionStatus.Pending,
      ],
    })
      .default(UserTicketRedemptionStatus.Pending)
      .notNull(),
    ...createdAndUpdatedAtFields,
  },
  (table) => ({
    publicIdIndex: index("user_tickets_public_id_index").on(table.publicId),
  }),
);

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

export const approveUserTicketsSchema = selectUserTicketsSchema.pick({
  approvalStatus: true,
});

export type InsertUserTicketSchema = z.infer<typeof insertUserTicketsSchema>;

export type SelectUserTicketSchema = z.infer<typeof selectUserTicketsSchema>;
