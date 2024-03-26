import { builder } from "~/builder";
import { selectUserTicketsSchema } from "~/datasources/db/schema";
import { UserTicketRef } from "~/schema/shared/refs";

export const PurchaseOrderRef = builder.objectRef<{
  id: string;
  amount?: number;
  ticketsIds: string[];
  paymentLink?: string;
}>("PurchaseOrder");

builder.objectType(PurchaseOrderRef, {
  description: "Representation of a Purchase Order",
  fields: (t) => ({
    id: t.exposeID("id"),
    totalAmount: t.field({
      type: "Float",
      nullable: true,
      resolve: (root) => root.amount,
    }),
    tickets: t.field({
      type: [UserTicketRef],
      resolve: async (root, s, { DB }) => {
        const userTickets = await DB.query.userTicketsSchema.findMany({
          where: (ut, { eq, and }) => and(eq(ut.purchaseOrderId, root.id)),
        });
        return userTickets.map((ut) => selectUserTicketsSchema.parse(ut));
      },
    }),
  }),
});
