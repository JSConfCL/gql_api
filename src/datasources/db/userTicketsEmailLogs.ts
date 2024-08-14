import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { usersSchema, userTicketsSchema } from "./schema";
import {
  createdAndUpdatedAtFields,
  TypescriptEnumAsDBEnumOptions,
} from "./shared";

export enum UserTicketsEmailType {
  // waitlist comms
  WAITLIST_ENTRY_CREATED = "waitlist_entry_created",
  WAITLIST_TICKET_ACCEPTED = "waitlist_ticket_accepted",
  WAITLIST_TICKET_REJECTED = "waitlist_ticket_rejected",
  // ticket purchase
  TICKET_PURCHASED_SUCCESSFUL = "ticket_purchased_successful",
  TICKET_PURCHASED_FAILED = "ticket_purchased_failed",
  // ticket gift
  TICKET_GIFT_SENT = "ticket_gift_sent",
  TICKET_GIFT_RECEIVED = "ticket_gift_received",
  TICKET_GIFT_ACCEPTED = "ticket_gift_accepted",
  // free ticket
  FREE_TICKET_ASSIGNED = "free_ticket_assigned",
  // ticket transfer
  TICKET_TRANSFER_REQUESTED = "ticket_transfer_requested",
  TICKET_TRANSFER_ACCEPTED = "ticket_transfer_accepted",
  TICKET_TRANSFER_REJECTED = "ticket_transfer_rejected",
  // ticket cancellation
  TICKET_CANCELLED = "ticket_cancelled",
  // ticket reminder
  TICKET_REMINDER = "ticket_reminder",
}

export const userTicketsEmailLogSchema = pgTable(
  "user_tickets_email_logs",
  {
    id: uuid("id").primaryKey().defaultRandom().unique(),
    userTicketId: uuid("user_ticket_id")
      .references(() => userTicketsSchema.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => usersSchema.id)
      .notNull(),
    emailType: text("email_type", {
      enum: TypescriptEnumAsDBEnumOptions(UserTicketsEmailType),
    }).notNull(),
    sentAt: timestamp("sent_at", {
      precision: 6,
    }),
    ...createdAndUpdatedAtFields,
  },
  (table) => {
    return {
      emailTypeIndex: index("user_tickets_email_logs_email_type_index").on(
        table.emailType,
      ),
    };
  },
);

export const userTicketsEmailLogSchemaRelations = relations(
  userTicketsEmailLogSchema,
  ({ one }) => ({
    userTicket: one(userTicketsSchema, {
      fields: [userTicketsEmailLogSchema.userTicketId],
      references: [userTicketsSchema.id],
    }),
    user: one(usersSchema, {
      fields: [userTicketsEmailLogSchema.userId],
      references: [usersSchema.id],
    }),
  }),
);

export const selectUserTicketsEmailLogSchema = createSelectSchema(
  userTicketsEmailLogSchema,
);

export const insertUserTicketsEmailLogSchema = createInsertSchema(
  userTicketsEmailLogSchema,
);
