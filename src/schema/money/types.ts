import { builder } from "~/builder";
import {
  ConsolidatedPaymentLogEntryRef,
  PaymentLogRef,
} from "~/schema/shared/refs";

builder.objectType(PaymentLogRef, {
  description: "Representation of a payment log entry",
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
    transactionAmount: t.field({
      type: "Float",
      nullable: false,
      resolve: (root) => parseFloat(root.transactionAmount),
    }),
    transactionDate: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (root) =>
        root.externalCreationDate ? new Date(root.externalCreationDate) : null,
    }),
    createdAt: t.field({
      type: "DateTime",
      nullable: false,
      resolve: (root) => new Date(root.createdAt),
    }),
    platform: t.exposeString("platform", { nullable: false }),
    currencyId: t.exposeString("currencyId", { nullable: false }),
  }),
});

builder.objectType(ConsolidatedPaymentLogEntryRef, {
  description: "Representation of a consolidated payment entry log calculation",
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
    totalTransactionAmount: t.exposeFloat("totalTransactionAmount"),
    platform: t.exposeString("platform", { nullable: false }),
    currencyId: t.exposeString("currencyId", { nullable: false }),
  }),
});
