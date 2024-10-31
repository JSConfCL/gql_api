import { builder } from "~/builder";
import { EventLoadable } from "~/schema/events/types";
import { PriceRef, TicketRef } from "~/schema/shared/refs";

import { AllowedCurrencyLoadable } from "../allowedCurrency/types";
import { RESERVED_USER_TICKET_APPROVAL_STATUSES } from "../userTickets/constants";

export const TicketTemplateStatus = builder.enumType("TicketTemplateStatus", {
  values: ["active", "inactive"] as const,
});

export const TicketTemplateVisibility = builder.enumType(
  "TicketTemplateVisibility",
  {
    values: ["public", "private", "unlisted"] as const,
  },
);

builder.objectType(PriceRef, {
  description: "Representation of a TicketPrice",
  fields: (t) => ({
    id: t.exposeID("id"),
    amount: t.exposeInt("amount"),
    currency: t.field({
      type: AllowedCurrencyLoadable,
      nullable: false,
      resolve: (root) => root.currencyId,
    }),
  }),
});

export const TicketLoadable = builder.loadableObject(TicketRef, {
  description: "Representation of a ticket",
  load: async (ids: string[], context) => {
    const result = await context.DB.query.ticketsSchema.findMany({
      where: (t, { inArray }) => inArray(t.id, ids),
    });

    const ticketMap = new Map(result.map((ticket) => [ticket.id, ticket]));

    return ids.map(
      (id) => ticketMap.get(id) || new Error(`Ticket ${id} not found`),
    );
  },
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    status: t.field({
      type: TicketTemplateStatus,
      resolve: (root) => root.status,
    }),
    visibility: t.field({
      type: TicketTemplateVisibility,
      resolve: (root) => root.visibility,
    }),
    startDateTime: t.field({
      type: "DateTime",
      nullable: false,
      resolve: (root) => new Date(root.startDateTime),
    }),
    endDateTime: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (root) => (root.endDateTime ? new Date(root.endDateTime) : null),
    }),
    requiresApproval: t.exposeBoolean("requiresApproval"),
    quantity: t.exposeInt("quantity", {
      description: "The number of tickets available for this ticket type",
      nullable: true,
    }),
    quantityLeft: t.field({
      type: "Int",
      nullable: true,
      resolve: async (root, args, ctx) => {
        if (root.isUnlimited) {
          return null;
        }

        if (root.quantity === null) {
          return null;
        }

        const userTickets = await ctx.DB.query.userTicketsSchema.findMany({
          where: (ut, { eq, and, inArray }) =>
            and(
              eq(ut.ticketTemplateId, root.id),
              inArray(
                ut.approvalStatus,
                RESERVED_USER_TICKET_APPROVAL_STATUSES,
              ),
            ),
        });

        return root.quantity - userTickets.length;
      },
    }),
    imageLink: t.exposeString("imageLink", { nullable: true }),
    externalLink: t.exposeString("externalLink", { nullable: true }),
    isFree: t.exposeBoolean("isFree", {
      description: "Whether or not the ticket is free",
      nullable: false,
    }),
    tags: t.exposeStringList("tags"),
    isUnlimited: t.exposeBoolean("isUnlimited", {
      description:
        "Whether or not the ticket has an unlimited quantity. This is reserved for things loike online events.",
      nullable: false,
    }),
    event: t.field({
      type: EventLoadable,
      resolve: (root) => root.eventId,
    }),
    prices: t.loadableList({
      type: PriceRef,
      nullable: true,
      load: async (ticketsIds: string[], context) => {
        const validTicketIds = ticketsIds.filter((id) => id !== "");

        if (validTicketIds.length === 0) {
          return ticketsIds.map(() => null);
        }

        const prices = await context.DB.query.ticketsPricesSchema.findMany({
          where: (tps, { inArray }) => inArray(tps.ticketId, validTicketIds),
          with: {
            price: true,
          },
        });

        return ticketsIds.map((id) => {
          if (id === "") {
            return null;
          }

          const matches = prices.filter((p) => p.ticketId === id);

          return matches.map((m) => ({
            id: m.price.id,
            amount: m.price.price_in_cents,
            currencyId: m.price.currencyId,
          }));
        });
      },
      resolve: (root) => {
        if (root.isFree) {
          return "";
        }

        return root.id;
      },
    }),
  }),
});
