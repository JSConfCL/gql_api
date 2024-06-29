import { builder } from "~/builder";
import { selectCompaniesSchema } from "~/datasources/db/schema";
import { statusEnumOptions } from "~/datasources/db/shared";
import {
  CompanyRef,
  ValidatedWorkEmailRef,
  WorkEmailRef,
} from "~/schema/shared/refs";

const EmailStatusEnum = builder.enumType("EmailStatus", {
  values: statusEnumOptions,
});

builder.objectType(WorkEmailRef, {
  description: "Representation of a (yet to validate) work email",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    isValidated: t.field({
      type: "Boolean",
      nullable: false,
      resolve: (root) => root.status === "confirmed",
    }),
  }),
});
builder.objectType(ValidatedWorkEmailRef, {
  description: "Representation of a work email associated to the current user",
  fields: (t) => ({
    // ID and isValidated are the same from WorkEmailRef.
    id: t.exposeString("id", { nullable: false }),
    isValidated: t.field({
      type: "Boolean",
      nullable: false,
      resolve: (root) => root.status === "confirmed",
    }),
    workEmail: t.exposeString("workEmail", { nullable: false }),
    status: t.field({
      type: EmailStatusEnum,
      nullable: false,
      resolve: (root) => root.status || "pending",
    }),
    confirmationDate: t.field({
      type: "DateTime",
      nullable: true,
      resolve: (root) =>
        root.confirmationDate ? new Date(root.confirmationDate) : null,
    }),
    company: t.field({
      type: CompanyRef,
      nullable: true,
      resolve: async (root, args, { DB }) => {
        const { companyId } = root;

        if (!companyId) {
          return null;
        }

        const company = await DB.query.companiesSchema.findFirst({
          where: (c, { eq }) => eq(c.id, companyId),
        });

        if (!company) {
          return null;
        }

        return selectCompaniesSchema.parse(company);
      },
    }),
  }),
});
