import { builder } from "~/builder";
import { CompanyRef } from "~/schema/shared/refs";

export const CompanyStatus = builder.enumType("CompanyStatus", {
  values: ["active", "inactive", "draft"],
});

builder.objectType(CompanyRef, {
  description: "Representation of a workEmail",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: true }),
    description: t.exposeString("description", { nullable: true }),
    domain: t.exposeString("domain", { nullable: false }),
    logo: t.exposeString("logo", { nullable: true }),
    website: t.exposeString("website", { nullable: true }),
    status: t.field({
      type: CompanyStatus,
      nullable: true,
      description: "Not available to users",
      // Solo superadmins pueden saber el status de una empresa
      resolve: (root, _, { USER }) => {
        if (USER?.isSuperAdmin && root.status) {
          return root.status;
        }

        return null;
      },
    }),
    hasBeenUpdated: t.field({
      type: "Boolean",
      nullable: false,
      resolve: async (root, args, { DB }) => {
        const company = await DB.query.companiesSchema.findFirst({
          where: (c, { eq }) => eq(c.id, root.id),
        });

        if (!company) {
          return false;
        }

        return Boolean(company.updatedAt);
      },
    }),
    salarySubmissions: t.field({
      type: "Int",
      nullable: false,
      resolve: async (root, args, { DB }) => {
        const submissions = await DB.query.salariesSchema.findMany({
          columns: {
            id: true,
          },
          where: (sS, { eq }) => eq(sS.companyId, root.id),
        });

        return submissions.length;
      },
    }),
  }),
});
