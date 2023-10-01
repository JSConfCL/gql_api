import { builder } from "~/builder";
import { TicketRef } from "./shared/refs";
import { GraphQLError } from "graphql";
import { canEditTicket } from "~/validations";
import { selectTicketSchema, ticketsSchema } from "~/datasources/db/tickets";
import { eq } from "drizzle-orm";
import { addToObjectIfPropertyExists } from "./shared/helpers";

export const TicketStatus = builder.enumType("TicketStatus", {
  values: ["active", "inactive"] as const,
});
export const TicketVisibility = builder.enumType("TicketVisibility", {
  values: ["public", "private", "unlisted"] as const,
});

builder.objectType(TicketRef, {
  description: "Representation of a ticket",
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    deescription: t.exposeString("description", { nullable: true }),
    status: t.field({
      type: TicketStatus,
      resolve: (root) => root.status,
    }),
    visibility: t.field({
      type: TicketVisibility,
      resolve: (root) => root.visibility,
    }),
    startDateTime: t.field({
      type: "DateTime",
      nullable: false,
      resolve: (root) => root.startDateTime,
    }),
    endDateTime: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (root) => root.endDateTime,
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
      type: TicketStatus,
      required: false,
    }),
    visibility: t.field({
      type: TicketVisibility,
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
        if (!ctx.USER) throw new GraphQLError("User not found");
        if (!(await canEditTicket(ctx.USER.id, ticketId, ctx.DB)))
          throw new GraphQLError("Not authorized");

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

        const ticket = await ctx.DB.update(ticketsSchema)
          .set(updateFields)
          .where(eq(ticketsSchema.id, ticketId))
          .returning()
          .get();

        return selectTicketSchema.parse(ticket);
      } catch (e) {
        throw new GraphQLError(
          e instanceof Error ? e.message : "Unknown error",
        );
      }
    },
  }),
}));
