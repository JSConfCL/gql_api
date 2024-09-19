import { relations } from "drizzle-orm";
import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { purchaseOrdersSchema, ticketsSchema, usersSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export enum UserTicketApprovalStatus {
  /**
   * TODO: Document the use case for this status
   * This status is used when a ticket is approved by:
   * - Paying the ticket from a purchase order (not created by a waitlist)
   * - Calling approvalUserTicket (as a super admin or community admin)
   * - Accepting a gifted ticket
   */
  Approved = "approved",
  /**
   * TODO: Document the waitlist use case because it is not clear how to get out of this status
   * The DB default value represents one of the following:
   * - The ticket has been purchased but not yet paid
   * - The ticket is on a waitlist
   */
  Pending = "pending",
  /**
   * TODO: Document this status better because the use case is not clear
   * The mutation acceptGiftedTicket sets the status to Approved not GiftAccepted
   */
  GiftAccepted = "gift_accepted",
  /**
   * TODO: Document this status better and the relation with GiftAccepted if there is any
   * The ticket was gifted by an admin trough retool
   * the status changes to Approved when the users fills some data
   * it was mainly used for the AI Hackathon 2024
   */
  Gifted = "gifted",
  /**
   * TODO: Document use case for this status
   */
  NotRequired = "not_required",
  /**
   * TODO: Document use case for this status
   */
  Rejected = "rejected",
  /**
   * TODO: Document this status better because the use case is not clear
   * This status is used when a ticket is cancelled by:
   * - The owner of the ticket
   * - A super admin
   * - A event community admin
   */
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
  /**
   * The user has redeemed the ticket by assisting to the event
   */
  UserTicketRedemptionStatus.Redeemed,
  /**
   * The user has not redeemed the ticket yet
   */
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
