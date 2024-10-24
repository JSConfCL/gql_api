import { builder } from "~/builder";
import {
  selectAllowedCurrencySchema,
  validPaymentMethodsEnum,
} from "~/datasources/db/schema";
import { AllowedCurrencyRef } from "~/schema/shared/refs";

const ValidPaymentMethodsEnumType = builder.enumType("ValidPaymentMethods", {
  values: validPaymentMethodsEnum,
});

export const AllowedCurrencyLoadable = builder.loadableObject(
  AllowedCurrencyRef,
  {
    description: "Representation of an allowed currency",
    load: async (ids: string[], { DB }) => {
      const result = await DB.query.allowedCurrencySchema.findMany({
        where: (ac, { inArray }) => inArray(ac.id, ids),
      });

      const resultByIdMap = new Map(
        result.map((item) => [
          item.id,
          selectAllowedCurrencySchema.parse(item),
        ]),
      );

      return ids.map(
        (id) => resultByIdMap.get(id) || new Error(`Currency ${id} not found`),
      );
    },
    fields: (t) => ({
      id: t.exposeID("id", { nullable: false }),
      validPaymentMethods: t.field({
        nullable: false,
        type: ValidPaymentMethodsEnumType,
        resolve: (root) => root.validPaymentMethods,
      }),
      currency: t.exposeString("currency", { nullable: false }),
    }),
  },
);
