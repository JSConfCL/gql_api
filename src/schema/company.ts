import { SQL, eq, ilike } from "drizzle-orm";
import { v4 } from "uuid";
import { builder } from "~/builder";
import {
  companiesSchema,
  insertCompaniesSchema,
  selectCompaniesSchema,
} from "~/datasources/db/schema";
import { CompanyRef } from "~/schema/shared/refs";
import { sanitizeForLikeSearch } from "./shared/helpers";

const CompanyStatus = builder.enumType("CompanyStatus", {
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
      dataToCreate.id = v4();
      const updateCompanyData = insertCompaniesSchema.parse(dataToCreate);
      const createCompany = (
        await DB.insert(companiesSchema).values(updateCompanyData).returning()
      )?.[0];

      return selectCompaniesSchema.parse(createCompany);
    },
  }),
}));
