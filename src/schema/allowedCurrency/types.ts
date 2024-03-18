import { builder } from "~/builder";
import { AllowedCurrencyRef } from "~/schema/shared/refs";

builder.objectType(AllowedCurrencyRef, {
  description: "Representation of a workEmail",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    currency: t.exposeString("currency", { nullable: false }),
  }),
});
