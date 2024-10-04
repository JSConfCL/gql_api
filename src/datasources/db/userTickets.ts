import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { purchaseOrdersSchema, ticketsSchema, usersSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export const userTicketsApprovalStatusEnum = [
  "approved",
  "pending",
  "gift_accepted",
  "gifted",
  "not_required",
  "rejected",
  "cancelled",
] as const;

export const userTicketsRedemptionStatusEnum = ["redeemed", "pending"] as const;

export enum UserTicketGiftStatus {
  Pending = "pending",
  Accepted = "accepted",
  Rejected = "rejected",
  Cancelled = "cancelled",
  Expired = "expired",
}

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

export const userTicketGiftsSchema = pgTable(
  "user_ticket_gifts",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userTicketId: uuid("user_ticket_id")
      .references(() => userTicketsSchema.id)
      .notNull(),
    gifterUserId: uuid("gifter_user_id")
      .references(() => usersSchema.id)
      .notNull(),
    receiverUserId: uuid("receiver_user_id")
      .references(() => usersSchema.id)
      .notNull(),
    status: text("status", {
      enum: [
        UserTicketGiftStatus.Pending,
        UserTicketGiftStatus.Accepted,
        UserTicketGiftStatus.Rejected,
        UserTicketGiftStatus.Cancelled,
        UserTicketGiftStatus.Expired,
      ],
    })
      .default(UserTicketGiftStatus.Pending)
      .notNull(),
    giftMessage: text("gift_message"),
    expirationDate: timestamp("expiration_date").notNull(),
    isReturn: boolean("is_return").default(false).notNull(),
    ...createdAndUpdatedAtFields,
  },
  (table) => ({
    userTicketIdIndex: index("user_ticket_gifts_user_ticket_id_index").on(
      table.userTicketId,
    ),
    gifterUserIdIndex: index("user_ticket_gifts_gifter_user_id_index").on(
      table.gifterUserId,
    ),
    receiverUserIdIndex: index("user_ticket_gifts_receiver_user_id_index").on(
      table.receiverUserId,
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
    giftAttempts: many(userTicketGiftsSchema),
  }),
);

export const userTicketGiftsRelations = relations(
  userTicketGiftsSchema,
  ({ one }) => ({
    userTicket: one(userTicketsSchema, {
      fields: [userTicketGiftsSchema.userTicketId],
      references: [userTicketsSchema.id],
    }),
    gifterUser: one(usersSchema, {
      fields: [userTicketGiftsSchema.gifterUserId],
      references: [usersSchema.id],
    }),
    receiverUser: one(usersSchema, {
      fields: [userTicketGiftsSchema.receiverUserId],
      references: [usersSchema.id],
    }),
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

export const selectUserTicketGiftSchema = createSelectSchema(
  userTicketGiftsSchema,
);

export type SelectUserTicketGiftSchema = z.infer<
  typeof selectUserTicketGiftSchema
>;

export const insertUserTicketGiftSchema = createInsertSchema(
  userTicketGiftsSchema,
);

export type InsertUserTicketGiftSchema = z.infer<
  typeof insertUserTicketGiftSchema
>;
