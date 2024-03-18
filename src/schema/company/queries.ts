import { SQL, ilike } from "drizzle-orm";

import { builder } from "~/builder";
import {
  companiesSchema,
  selectCompaniesSchema,
} from "~/datasources/db/schema";
import { sanitizeForLikeSearch } from "~/schema/shared/helpers";
import { CompanyRef } from "~/schema/shared/refs";

const SearchCompaniesInput = builder.inputType("SearchCompaniesInput", {
  fields: (t) => ({
    companyName: t.field({
      type: "String",
      required: false,
    }),
    description: t.field({
      type: "String",
      required: false,
    }),
    domain: t.field({
      type: "String",
      required: false,
    }),
    website: t.field({
      type: "String",
      required: false,
    }),
  }),
});

builder.queryFields((t) => ({
  companies: t.field({
    description: "Get all available companies",
    type: [CompanyRef],
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({
        type: SearchCompaniesInput,
        required: false,
      }),
    },
    resolve: async (root, { input }, { DB }) => {
      if (!input) {
        const companies = await DB.query.companiesSchema.findMany();
        return companies.map((c) => selectCompaniesSchema.parse(c));
      }
      const { companyName, description, domain, website } = input;
      const wheres: SQL[] = [];
      if (companyName) {
        wheres.push(
          ilike(companiesSchema.name, sanitizeForLikeSearch(companyName)),
        );
      }
      if (description) {
        wheres.push(
          ilike(
            companiesSchema.description,
            sanitizeForLikeSearch(description),
          ),
        );
      }
      if (domain) {
        wheres.push(
          ilike(companiesSchema.domain, sanitizeForLikeSearch(domain)),
        );
      }
      if (website) {
        wheres.push(
          ilike(companiesSchema.website, sanitizeForLikeSearch(website)),
        );
      }
      const companies = await DB.query.companiesSchema.findMany({
        where: (_, { and }) => and(...wheres),
      });
      return companies.map((c) => selectCompaniesSchema.parse(c));
    },
  }),
  company: t.field({
    description: "Get all available companies",
    type: CompanyRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      companyId: t.arg({
        type: "String",
        required: true,
      }),
    },
    resolve: async (root, { companyId }, { DB }) => {
      const company = await DB.query.companiesSchema.findFirst({
        where: (c, { eq }) => eq(c.id, companyId),
      });
      return selectCompaniesSchema.parse(company);
    },
  }),
}));
