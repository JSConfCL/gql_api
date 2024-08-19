import { builder } from "~/builder";
import { selectAllowedCurrencySchema } from "~/datasources/db/schema";
import { EventLoadable } from "~/schema/events/types";
import { AllowedCurrencyRef, PriceRef, TicketRef } from "~/schema/shared/refs";

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
      type: AllowedCurrencyRef,
      resolve: async (root, args, ctx) => {
        const currency = await ctx.DB.query.allowedCurrencySchema.findFirst({
          where: (acs, { eq }) => eq(acs.id, root.currencyId),
        });

        return selectAllowedCurrencySchema.parse(currency);
      },
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
              inArray(ut.approvalStatus, [
                "approved",
                "gift_accepted",
                "not_required",
                "pending",
                "gifted",
              ]),
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
    prices: t.field({
      type: [PriceRef],
      nullable: true,
      resolve: async (root, args, ctx) => {
        if (root.isFree) {
          return null;
        }

        const prices = await ctx.DB.query.ticketsPricesSchema.findMany({
          where: (tps, { eq }) => eq(tps.ticketId, root.id),
          with: {
            price: true,
          },
        });

        const pasedPrices = prices
          .map((p) => ({
            id: p.price.id,
            amount: p.price.price_in_cents,
            currencyId: p.price.currencyId,
          }))
          .filter((p) => p.amount !== null || p.currencyId !== null);

        // this "AS" is an unnecessary type cast, but it's here bc the "filter"
        // does not do proper type narrowing.
        return pasedPrices as {
          id: string;
          amount: number;
          currencyId: string;
        }[];
      },
    }),
  }),
});
