import { relations } from "drizzle-orm";
import { pgTable, uuid, text, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { ticketsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export const requirementTypeEnum = [
  "ticket_ownership", // User must own a specific ticket
  "ticket_category", // User must own a ticket of a specific category
] as const;

export const ticketRequirementsSchema = pgTable(
  "ticket_requirements",
  {
    ticketId: uuid("ticket_id")
      .references(() => ticketsSchema.id)
      .notNull(),
    // The ticket that is required to access this ticket
    requiredTicketId: uuid("required_ticket_id")
      .references(() => ticketsSchema.id)
      .notNull(),
    requirementType: text("requirement_type", {
      enum: requirementTypeEnum,
    }).notNull(),
    description: text("description"),
    ...createdAndUpdatedAtFields,
  },
  (table) => ({
    uniqueTicketRequirement: uniqueIndex("unique_ticket_requirement").on(
      table.ticketId,
      table.requiredTicketId,
    ),
  }),
);

export const ticketRequirementsRelations = relations(
  ticketRequirementsSchema,
  ({ one }) => ({
    ticket: one(ticketsSchema, {
      fields: [ticketRequirementsSchema.ticketId],
      references: [ticketsSchema.id],
    }),
    requiredTicket: one(ticketsSchema, {
      fields: [ticketRequirementsSchema.requiredTicketId],
      references: [ticketsSchema.id],
    }),
  }),
);

export const selectTicketRequirementsSchema = createSelectSchema(
  ticketRequirementsSchema,
);

export const insertTicketRequirementsSchema = createInsertSchema(
  ticketRequirementsSchema,
);
