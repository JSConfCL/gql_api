import { relations } from "drizzle-orm";
import { pgTable, uuid, text, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { purchaseOrdersSchema, ticketsSchema, usersSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { userTicketTransfersSchema } from "./userTicketsTransfers";

export const userTicketsApprovalStatusEnum = [
  "approved",
  "pending",
  "gift_accepted",
  "gifted",
  "not_required",
  "rejected",
  "cancelled",
  // A transfer has been initiated but not yet accepted by the recipient
  "transfer_pending",
  // The transferred ticket has been accepted by the recipient
  "transfer_accepted",
] as const;

export const userTicketsRedemptionStatusEnum = ["redeemed", "pending"] as const;

// USER-TICKETS-TABLE
export const userTicketsSchema = pgTable(
  "user_tickets",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    publicId: uuid("public_id").notNull().defaultRandom(),
    userId: uuid("user_id")
      .references(() => usersSchema.id)
      .notNull(),
    ticketTemplateId: uuid("ticket_template_id")
      .references(() => ticketsSchema.id)
      .notNull(),
    purchaseOrderId: uuid("purchase_order_id")
      .references(() => purchaseOrdersSchema.id, {
        onDelete: "cascade",
      })
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
  },
  (table) => ({
    publicIdIndex: index("user_tickets_public_id_index").on(table.publicId),
    ticketTemplateIdIndex: index("user_tickets_ticket_template_id_index").on(
      table.ticketTemplateId,
    ),
    userIdIndex: index("user_tickets_user_id_index").on(table.userId),
    approvalStatusIndex: index("user_tickets_approval_status_index").on(
      table.approvalStatus,
    ),
    purchaseOrderIdIndex: index("user_tickets_purchase_order_id_index").on(
      table.purchaseOrderId,
    ),
  }),
);

// Relations
export const userTicketsRelations = relations(
  userTicketsSchema,
  ({ one, many }) => ({
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
    transferAttempts: many(userTicketTransfersSchema),
  }),
);

export const selectUserTicketsSchema = createSelectSchema(userTicketsSchema);

export const insertUserTicketsSchema = createInsertSchema(userTicketsSchema);

export const approveUserTicketsSchema = selectUserTicketsSchema.pick({
  approvalStatus: true,
});

export type SelectUserTicketSchema = z.infer<typeof selectUserTicketsSchema>;

export type InsertUserTicketSchema = z.infer<typeof insertUserTicketsSchema>;

export type ApproveUserTicketsSchema = z.infer<typeof approveUserTicketsSchema>;
