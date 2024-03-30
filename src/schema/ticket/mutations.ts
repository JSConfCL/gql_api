import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  insertPriceSchema,
  insertTicketPriceSchema,
  insertTicketSchema,
  pricesSchema,
  selectPriceSchema,
  selectTicketSchema,
  ticketsPricesSchema,
  ticketsSchema,
  updateTicketSchema,
} from "~/datasources/db/schema";
import { createStripeProduct } from "~/datasources/stripe";
import { addToObjectIfPropertyExists } from "~/schema/shared/helpers";
import { TicketRef } from "~/schema/shared/refs";
import {
  TicketTemplateStatus,
  TicketTemplateVisibility,
} from "~/schema/ticket/types";
import { canCreateTicket, canEditTicket } from "~/validations";

const PricingInputField = builder.inputType("PricingInputField", {
  fields: (t) => ({
    value: t.int({
      required: false,
    }),
    currencyId: t.string({
      required: false,
    }),
  }),
});

const TicketCreateInput = builder.inputType("TicketCreateInput", {
  fields: (t) => ({
    name: t.string({
      required: true,
    }),
    description: t.string({
      required: false,
    }),
    status: t.field({
      type: TicketTemplateStatus,
      required: false,
    }),
    visibility: t.field({
      type: TicketTemplateVisibility,
      required: false,
    }),
    startDateTime: t.field({
      type: "DateTime",
      required: true,
    }),
    endDateTime: t.field({
      type: "DateTime",
      required: false,
    }),
    requiresApproval: t.boolean({
      required: false,
    }),
    quantity: t.int({
      required: false,
    }),
    eventId: t.string({
      required: true,
    }),
    unlimitedTickets: t.boolean({
      required: true,
      description:
        "If provided, quantity must not be passed. This is for things like online events where there is no limit to the amount of tickets that can be sold.",
    }),
    prices: t.field({
      type: [PricingInputField],
      required: false,
    }),
  }),
});

builder.mutationField("createTicket", (t) =>
  t.field({
    description: "Create a ticket",
    type: TicketRef,
    args: {
      input: t.arg({
        type: TicketCreateInput,
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { input }, ctx) => {
      if (!ctx.USER) {
        throw new GraphQLError("User not found");
      }
      const { eventId } = input;
      // Check if the user has permissions to create a ticket
      const hasPermissions = await canCreateTicket({
        user: ctx.USER,
        eventId: eventId,
        DB: ctx.DB,
      });

      if (!hasPermissions) {
        throw new GraphQLError("Not authorized");
      }
      const transactionResults = await ctx.DB.transaction(async (trx) => {
        try {
          const hasQuantity = input.quantity ? input.quantity !== 0 : false;
          if (!hasQuantity && !input.unlimitedTickets) {
            throw new GraphQLError(
              "Quantity must be provided if unlimitedTickets is false",
            );
          }

          // First, we check if the user is trying to create a ticket with
          // price. If so, we create all the prices.
          const insertedPrices: Array<typeof selectPriceSchema._type> = [];
          if (Array.isArray(input.prices)) {
            if (input.prices.length === 0) {
              throw new GraphQLError("Prices array must not be empty");
            }
            for (const price of input.prices) {
              if (!price.value) {
                throw new GraphQLError("Price is required");
              }
              if (price.value <= 0) {
                throw new GraphQLError("Price must be greater than 0");
              }
              if (!price.currencyId) {
                throw new GraphQLError(
                  "CurrencyId is required when price is provided",
                );
              }

              const insertPriceValues = insertPriceSchema.parse({
                price: price.value,
                currencyId: price.currencyId,
              });

              const insertedPrice = await trx
                .insert(pricesSchema)
                .values(insertPriceValues)
                .returning();
              const newPrice = insertedPrice?.[0];
              if (!newPrice) {
                throw new GraphQLError("Price not created");
              }
              insertedPrices.push(newPrice);
            }
          }

          // Second, we create the ticket
          const insertTicketValues = insertTicketSchema.parse({
            name: input.name,
            description: input.description,
            status: input.status,
            visibility: input.visibility,
            startDateTime: input.startDateTime,
            endDateTime: input.endDateTime,
            requiresApproval: input.requiresApproval,
            quantity: input.quantity,
            eventId: input.eventId,
            isUnlimited: input.unlimitedTickets,
          });
          const insertedTickets = await trx
            .insert(ticketsSchema)
            .values(insertTicketValues)
            .returning();
          const ticket = insertedTickets?.[0];

          if (!ticket) {
            throw new GraphQLError("Could not create ticket");
          }

          // Third, we attach the prices to the ticket.
          for (const price of insertedPrices) {
            console.log("Attaching price to ticket: ", price);
            const ticketPriceToInsert = insertTicketPriceSchema.parse({
              ticketId: ticket.id,
              priceId: price.id,
            });
            const insertedTicketPrice = await trx
              .insert(ticketsPricesSchema)
              .values(ticketPriceToInsert)
              .returning();
            const ticketPrice = insertedTicketPrice?.[0];
            if (!ticketPrice) {
              throw new GraphQLError("Could not attach price to ticket");
            }

            // We pull the priceId w/ the currencyId. If the currencyId is USD,
            // we create the product in Stripe. If the currencyId is CLP, we
            // create the product in MercadoPago.
            const foundPrice = await trx.query.pricesSchema.findFirst({
              where: (ps, { eq }) => eq(ps.id, ticketPrice.priceId),
              with: {
                currency: true,
              },
            });
            console.log("Found price: ", ctx);
            if (foundPrice?.currency) {
              if (foundPrice.currency.currency === "USD") {
                await createStripeProduct({
                  item: {
                    id: ticket.id,
                    name: ticket.name,
                    description: ticket.description ?? undefined,
                    currency: foundPrice.currency.currency,
                    unit_amount: foundPrice.price,
                  },
                  getStripeClient: ctx.GET_STRIPE_CLIENT,
                });
              }
              if (foundPrice?.currencyId === "CLP") {
                // TODO: createMercadoPagoProduct
              }
            }
          }
          return selectTicketSchema.parse(ticket);
        } catch (e) {
          console.log("Error creating tickets:", e);
          throw new GraphQLError(
            e instanceof Error ? e.message : "Unknown error",
          );
        }
      });

      return transactionResults;
    },
  }),
);

const TicketEditInput = builder.inputType("TicketEditInput", {
  fields: (t) => ({
    ticketId: t.string({
      required: true,
    }),
    name: t.string({
      required: false,
    }),
    description: t.string({
      required: false,
    }),
    status: t.field({
      type: TicketTemplateStatus,
      required: false,
    }),
    visibility: t.field({
      type: TicketTemplateVisibility,
      required: false,
    }),
    startDateTime: t.field({
      type: "DateTime",
      required: false,
    }),
    endDateTime: t.field({
      type: "DateTime",
      required: false,
    }),
    requiresApproval: t.boolean({
      required: false,
    }),
    quantity: t.int({
      required: false,
    }),
    eventId: t.string({
      required: false,
    }),
    unlimitedTickets: t.boolean({
      required: true,
      description:
        "If provided, quantity must not be passed. This is for things like online events where there is no limit to the amount of tickets that can be sold.",
    }),
    prices: t.field({
      type: PricingInputField,
      required: false,
    }),
  }),
});

builder.mutationField("editTicket", (t) =>
  t.field({
    description: "Edit a ticket",
    type: TicketRef,
    args: {
      input: t.arg({
        type: TicketEditInput,
        required: true,
      }),
    },
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, { input }, ctx) => {
      try {
        const { ticketId } = input;
        if (!ctx.USER) {
          throw new GraphQLError("User not found");
        }
        if (!(await canEditTicket(ctx.USER.id, ticketId, ctx.DB))) {
          throw new GraphQLError("Not authorized");
        }

        const updateFields = {};
        addToObjectIfPropertyExists(updateFields, "name", input.name);
        addToObjectIfPropertyExists(
          updateFields,
          "description",
          input.description,
        );
        addToObjectIfPropertyExists(updateFields, "status", input.status);
        addToObjectIfPropertyExists(
          updateFields,
          "visibility",
          input.visibility,
        );
        addToObjectIfPropertyExists(
          updateFields,
          "startDateTime",
          input.startDateTime,
        );
        addToObjectIfPropertyExists(
          updateFields,
          "endDateTime",
          input.endDateTime,
        );
        addToObjectIfPropertyExists(
          updateFields,
          "requiresApproval",
          input.requiresApproval,
        );
        addToObjectIfPropertyExists(updateFields, "quantity", input.quantity);
        // addToObjectIfPropertyExists(updateFields, "price", input.price);
        // addToObjectIfPropertyExists(
        //   updateFields,
        //   "currencyId",
        //   input.currencyId,
        // );

        const response = updateTicketSchema.safeParse(updateFields);
        if (response.success) {
          const ticket = (
            await ctx.DB.update(ticketsSchema)
              .set(response.data)
              .where(eq(ticketsSchema.id, ticketId))
              .returning()
          )?.[0];
          return selectTicketSchema.parse(ticket);
        } else {
          console.error("ERROR:", response.error);
          throw new Error("Invalid input", response.error);
        }
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
);
