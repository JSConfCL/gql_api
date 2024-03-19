import { builder } from "~/builder";
import { PriceRef, TicketRef } from "~/schema/shared/refs";

export const TicketTemplateStatus = builder.enumType("TicketTemplateStatus", {
  values: ["active", "inactive"] as const,
});
export const TicketTemplateVisibility = builder.enumType(
  "TicketTemplateVisibility",
  {
    values: ["public", "private", "unlisted"] as const,
  },
);

builder.objectType(TicketRef, {
  description: "Representation of a ticket",
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
    requiresApproval: t.exposeBoolean("requiresApproval", {
      nullable: true,
    }),
    quantity: t.exposeInt("quantity", { nullable: true }),
    eventId: t.exposeString("eventId", { nullable: false }),
    price: t.field({
      type: [PriceRef],
      nullable: true,
      resolve: async (root, args, ctx) => {
        const prices = await ctx.DB.query.ticketsPricesSchema.findMany({
          where: (tps, { eq }) => eq(tps.ticketId, root.id),
          with: {
            price: true,
          },
        });

        const pasedPrices = prices
          .map((p) => ({
            id: p.price.id,
            amount: p.price.price,
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
