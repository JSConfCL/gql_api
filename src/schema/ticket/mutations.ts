import { eq } from "drizzle-orm";
import { GraphQLError } from "graphql";

import { builder } from "~/builder";
import {
  insertTicketSchema,
  selectTicketSchema,
  ticketsSchema,
  updateTicketSchema,
} from "~/datasources/db/schema";
import { addToObjectIfPropertyExists } from "~/schema/shared/helpers";
import { TicketRef } from "~/schema/shared/refs";
import {
  TicketTemplateStatus,
  TicketTemplateVisibility,
} from "~/schema/ticket/types";
import { canCreateTicket, canEditTicket } from "~/validations";

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
    price: t.int({
      required: false,
    }),
    quantity: t.int({
      required: false,
    }),
    eventId: t.string({
      required: true,
    }),
    currencyId: t.string({
      required: false,
    }),
  }),
});

const TicketEditInput = builder.inputType("TicketEditInput", {
  fields: (t) => ({
    ticketId: t.field({
      type: "String",
      required: true,
    }),
    name: t.field({
      type: "String",
      required: false,
    }),
    description: t.field({
      type: "String",
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
    requiresApproval: t.field({
      type: "Boolean",
      required: false,
    }),
    price: t.field({
      type: "Int",
      required: false,
    }),
    quantity: t.field({
      type: "Int",
      required: false,
    }),
    eventId: t.field({
      type: "String",
      required: false,
    }),
    currencyId: t.field({
      type: "String",
      required: false,
    }),
  }),
});

builder.mutationFields((t) => ({
  createTicket: t.field({
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
      try {
        if (!ctx.USER) {
          throw new GraphQLError("User not found");
        }
        const { eventId } = input;
        const hasPermissions = await canCreateTicket({
          user: ctx.USER,
          eventId: eventId,
          DB: ctx.DB,
        });

        if (!hasPermissions) {
          throw new GraphQLError("Not authorized");
        }

        const insertTicketValues = insertTicketSchema.parse({
          name: input.name,
          description: input.description,
          status: input.status,
          visibility: input.visibility,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          requiresApproval: input.requiresApproval,
          price: input.price,
          quantity: input.quantity,
          currencyId: input.currencyId,
          eventId: input.eventId,
        });

        const ticket = (
          await ctx.DB.insert(ticketsSchema)
            .values(insertTicketValues)
            .returning()
        )?.[0];

        return selectTicketSchema.parse(ticket);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),

  editTicket: t.field({
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
        addToObjectIfPropertyExists(updateFields, "price", input.price);
        addToObjectIfPropertyExists(updateFields, "quantity", input.quantity);
        addToObjectIfPropertyExists(
          updateFields,
          "currencyId",
          input.currencyId,
        );

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
}));
