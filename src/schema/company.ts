import { SQL, eq, like } from "drizzle-orm";
import { builder } from "~/builder";
import {
  companiesSchema,
  insertCompaniesSchema,
  selectCompaniesSchema,
} from "~/datasources/db/schema";
import { companyRef } from "~/schema/shared/refs";

builder.objectType(companyRef, {
  description: "Representation of a workEmail",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: true }),
    description: t.exposeString("description", { nullable: true }),
    domain: t.exposeString("domain", { nullable: false }),
    logo: t.exposeString("logo", { nullable: true }),
    website: t.exposeString("website", { nullable: true }),
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

const SearchCompaniesInput = builder.inputType("MyTicketsSearchInput", {
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
    type: [companyRef],
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
        const searchName = `%${companyName}%`;
        wheres.push(like(companiesSchema.name, searchName));
      }
      if (description) {
        const searchDescription = `%${description}%`;
        wheres.push(like(companiesSchema.description, searchDescription));
      }
      if (domain) {
        const searchDomain = `%${domain}%`;
        wheres.push(like(companiesSchema.domain, searchDomain));
      }
      if (website) {
        const searchWebsite = `%${website}%`;
        wheres.push(like(companiesSchema.website, searchWebsite));
      }
      const companies = await DB.query.companiesSchema.findMany({
        where: (_, { and }) => and(...wheres),
      });
      return companies.map((c) => selectCompaniesSchema.parse(c));
    },
  }),
  company: t.field({
    description: "Get all available companies",
    type: companyRef,
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

const UpdateCompanyInput = builder.inputType("MyTicketsSearchInput", {
  fields: (t) => ({
    companyId: t.field({
      type: "String",
      required: true,
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

builder.mutationFields((t) => ({
  updateCompany: t.field({
    description: "Update a company",
    type: companyRef,
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({
        type: UpdateCompanyInput,
        required: true,
      }),
    },
    resolve: async (root, { input }, { DB }) => {
      const { companyId, description, logo, domain, website } = input;
      const company = await DB.query.companiesSchema.findFirst({
        where: (c, { eq }) => eq(c.id, companyId),
      });
      if (!company) {
        throw new Error("Company not found");
      }
      let dataToUpdate = {};
      if (!company.domain) {
        dataToUpdate = {
          ...dataToUpdate,
          domain,
        };
      }
      if (!company.website) {
        dataToUpdate = {
          ...dataToUpdate,
          website,
        };
      }
      if (!company.logo) {
        dataToUpdate = {
          ...dataToUpdate,
          logo,
        };
      }
      if (!company.description) {
        dataToUpdate = {
          ...dataToUpdate,
          description,
        };
      }
      if (Object.keys(dataToUpdate).length === 0) {
        throw new Error("Nothing to update");
      }
      const updateCompanyData = insertCompaniesSchema.parse(dataToUpdate);
      const updatedCompany = await DB.update(companiesSchema)
        .set(updateCompanyData)
        .where(eq(companiesSchema.id, companyId))
        .returning()
        .get();

      return selectCompaniesSchema.parse(updatedCompany);
    },
  }),
}));
