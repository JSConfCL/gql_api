import { builder } from "~/builder";
import { TicketRef } from "./shared/refs";
import { GraphQLError } from "graphql";
import { canCreateTicket, canEditTicket } from "~/validations";
import {
  insertTicketSchema,
  selectTicketSchema,
  ticketsSchema,
} from "~/datasources/db/tickets";
import { eq } from "drizzle-orm";
import { addToObjectIfPropertyExists } from "./shared/helpers";

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
    price: t.exposeInt("price", { nullable: true }),
    quantity: t.exposeInt("quantity", { nullable: true }),
    eventId: t.exposeString("eventId", { nullable: false }),
    currencyId: t.exposeString("currencyId", { nullable: true }),
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
          userId: ctx.USER.id,
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

        const ticket = (await ctx.DB.insert(ticketsSchema)
          .values(insertTicketValues)
          .returning())?.[0];

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

        const ticket = (
          await ctx.DB.update(ticketsSchema)
            .set(updateFields)
            .where(eq(ticketsSchema.id, ticketId))
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
}));
