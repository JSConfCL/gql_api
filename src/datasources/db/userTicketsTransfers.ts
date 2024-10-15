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

import { usersSchema, userTicketsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export enum UserTicketTransferStatus {
  Pending = "pending",
  Accepted = "accepted",
  Rejected = "rejected",
  Cancelled = "cancelled",
  Expired = "expired",
}

export const userTicketTransfersSchema = pgTable(
  "user_ticket_transfers",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userTicketId: uuid("user_ticket_id")
      .references(() => userTicketsSchema.id, {
        onDelete: "cascade",
      })
      .notNull(),
    senderUserId: uuid("sender_user_id")
      .references(() => usersSchema.id)
      .notNull(),
    recipientUserId: uuid("recipient_user_id")
      .references(() => usersSchema.id)
      .notNull(),
    status: text("status", {
      enum: [
        UserTicketTransferStatus.Pending,
        UserTicketTransferStatus.Accepted,
        UserTicketTransferStatus.Rejected,
        UserTicketTransferStatus.Cancelled,
        UserTicketTransferStatus.Expired,
      ],
    })
      .default(UserTicketTransferStatus.Pending)
      .notNull(),
    transferMessage: text("transfer_message"),
    expirationDate: timestamp("expiration_date").notNull(),
    isReturn: boolean("is_return").default(false).notNull(),
    ...createdAndUpdatedAtFields,
  },
  (table) => ({
    userTicketIdIndex: index("user_ticket_transfers_user_ticket_id_index").on(
      table.userTicketId,
    ),
    senderUserIdIndex: index("user_ticket_transfers_sender_user_id_index").on(
      table.senderUserId,
    ),
    recipientUserIdIndex: index(
      "user_ticket_transfers_recipient_user_id_index",
    ).on(table.recipientUserId),
  }),
);

export const userTicketTransfersRelations = relations(
  userTicketTransfersSchema,
  ({ one }) => ({
    userTicket: one(userTicketsSchema, {
      fields: [userTicketTransfersSchema.userTicketId],
      references: [userTicketsSchema.id],
    }),
    senderUser: one(usersSchema, {
      fields: [userTicketTransfersSchema.senderUserId],
      references: [usersSchema.id],
    }),
    recipientUser: one(usersSchema, {
      fields: [userTicketTransfersSchema.recipientUserId],
      references: [usersSchema.id],
    }),
  }),
);

export const selectUserTicketTransferSchema = createSelectSchema(
  userTicketTransfersSchema,
);

export type SelectUserTicketTransferSchema = z.infer<
  typeof selectUserTicketTransferSchema
>;

export const insertUserTicketTransferSchema = createInsertSchema(
  userTicketTransfersSchema,
);

export type InsertUserTicketTransferSchema = z.infer<
  typeof insertUserTicketTransferSchema
>;
