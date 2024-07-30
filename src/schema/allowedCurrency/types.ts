import { builder } from "~/builder";
import { validPaymentMethodsEnum } from "~/datasources/db/schema";
import { AllowedCurrencyRef } from "~/schema/shared/refs";

const ValidPaymentMethodsEnumType = builder.enumType("ValidPaymentMethods", {
  values: validPaymentMethodsEnum,
});

builder.objectType(AllowedCurrencyRef, {
  description: "Representation of a workEmail",
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
    validPaymentMethods: t.field({
      nullable: false,
      type: ValidPaymentMethodsEnumType,
      resolve: (root) => root.validPaymentMethods,
    }),
    currency: t.exposeString("currency", { nullable: false }),
  }),
});
