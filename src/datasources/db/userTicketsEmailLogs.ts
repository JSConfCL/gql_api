import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { userTicketsSchema } from "./schema";
import {
  createdAndUpdatedAtFields,
  TypescriptEnumAsDBEnumOptions,
} from "./shared";

export enum UserTicketsEmailType {
  WAITLIST_ENTRY_CREATED = "waitlist_entry_created",
  WAITLIST_ENTRY_ACCEPTED = "waitlist_entry_accepted",
  WAITLIST_ENTRY_REJECTED = "waitlist_entry_rejected",
}

export const userTicketsEmailLogSchema = pgTable(
  "user_tickets_email_logs",
  {
    id: uuid("id").primaryKey().defaultRandom().unique(),
    userTicketId: uuid("user_ticket_id")
      .references(() => userTicketsSchema.id)
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

export const selectUserTicketsEmailLogSchema = createSelectSchema(
  userTicketsEmailLogSchema,
);

export const insertUserTicketsEmailLogSchema = createInsertSchema(
  userTicketsEmailLogSchema,
);
