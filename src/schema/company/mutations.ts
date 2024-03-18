import { eq } from "drizzle-orm";

import { builder } from "~/builder";
import {
  companiesSchema,
  insertCompaniesSchema,
  selectCompaniesSchema,
} from "~/datasources/db/schema";
import { CompanyRef } from "~/schema/shared/refs";

import { CompanyStatus } from "./types";

const UpdateCompanyInput = builder.inputType("UpdateCompanyInput", {
  fields: (t) => ({
    companyId: t.field({
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
    logo: t.field({
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

const CreateCompanyInput = builder.inputType("CreateCompanyInput", {
  fields: (t) => ({
    domain: t.field({
      type: "String",
      description:
        "The email domain of the company (What we'll use to match the company to the user on account-creation)",
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
    logo: t.field({
      type: "String",
      required: false,
    }),

    website: t.field({
      type: "String",
      required: false,
    }),
    status: t.field({
      type: CompanyStatus,
      required: false,
    }),
  }),
});

builder.mutationFields((t) => ({
  updateCompany: t.field({
    description: "Update a company",
    type: CompanyRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({
        type: UpdateCompanyInput,
        required: true,
      }),
    },
    resolve: async (root, { input }, { DB, USER }) => {
      const { companyId, description, logo, domain, website, name } = input;
      const company = await DB.query.companiesSchema.findFirst({
        where: (c, { eq }) => eq(c.id, companyId),
      });
      if (!company) {
        throw new Error("Company not found");
      }
      if (!USER?.isSuperAdmin && company.updatedAt !== null) {
        throw new Error("Cannot update an already updated company");
      }
      const dataToUpdate: Record<string, string | null | undefined> = {};
      if (domain) {
        dataToUpdate.domain = domain;
      }
      if (website) {
        dataToUpdate.website = website;
      }
      if (name) {
        dataToUpdate.name = name;
      }
      if (logo) {
        dataToUpdate.logo = logo;
      }
      if (description) {
        dataToUpdate.description = description;
      }
      if (Object.keys(dataToUpdate).length === 0) {
        throw new Error("Nothing to update");
      }
      const updatedCompany = (
        await DB.update(companiesSchema)
          .set(dataToUpdate)
          .where(eq(companiesSchema.id, companyId))
          .returning()
      )?.[0];

      return selectCompaniesSchema.parse(updatedCompany);
    },
  }),
  createCompany: t.field({
    description: "Create a company",
    type: CompanyRef,
    authz: {
      rules: ["IsSuperAdmin"],
    },
    args: {
      input: t.arg({
        type: CreateCompanyInput,
        required: true,
      }),
    },
    resolve: async (root, { input }, { DB }) => {
      const { description, logo, domain, website, name, status } = input;

      const dataToCreate: Record<string, string | null | undefined> = {};
      if (domain) {
        dataToCreate.domain = domain;
      }
      if (website) {
        dataToCreate.website = website;
      }
      if (logo) {
        dataToCreate.logo = logo;
      }
      if (description) {
        dataToCreate.description = description;
      }
      if (name) {
        dataToCreate.name = name;
      }
      if (status) {
        dataToCreate.status = status;
      }
      if (Object.keys(dataToCreate).length === 0) {
        throw new Error("No data to create a company");
      }
      const updateCompanyData = insertCompaniesSchema.parse(dataToCreate);
      const createCompany = (
        await DB.insert(companiesSchema).values(updateCompanyData).returning()
      )?.[0];

      return selectCompaniesSchema.parse(createCompany);
    },
  }),
}));
