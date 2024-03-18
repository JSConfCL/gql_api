import { builder } from "~/builder";
import { TicketRef } from "~/schema/shared/refs";

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
  }),
});
