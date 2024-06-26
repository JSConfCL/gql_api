import { faker } from "@faker-js/faker";
import { it, describe, expect } from "vitest";

import {
  executeGraphqlOperation,
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  insertCompany,
  insertUser,
} from "~/tests/fixtures";

import {
  UpdateCompany,
  UpdateCompanyMutation,
  UpdateCompanyMutationVariables,
} from "./mutations.generated";

describe("Company", () => {
  describe("As a Superadmin", () => {
    it("Should update if it wasnt updated before", async () => {
      const company = await insertCompany({
        updatedAt: null,
      });
      const domain = faker.internet.domainName();
      const description = faker.lorem.paragraph(3);
      const name = faker.lorem.words(3);
      const logo = faker.image.url();
      const response = await executeGraphqlOperationAsSuperAdmin<
        UpdateCompanyMutation,
        UpdateCompanyMutationVariables
      >({
        document: UpdateCompany,
        variables: {
          input: {
            companyId: company.id,
            domain,
            logo,
            description,
            name,
          },
        },
      });

      expect(response.data?.updateCompany).toBeDefined();
      expect(response.data?.updateCompany?.name).toEqual(name);
      expect(response.data?.updateCompany?.domain).toEqual(domain);
      expect(response.data?.updateCompany?.logo).toEqual(logo);
      expect(response.data?.updateCompany?.website).toBeDefined();
      expect(response.data?.updateCompany?.description).toEqual(description);
      expect(response.data?.updateCompany?.hasBeenUpdated).toBeDefined();
      expect(response.data?.updateCompany?.status).toEqual("draft");
      expect(response.data?.updateCompany?.salarySubmissions).toEqual(0);
    });

    it("Should update if it has already been updated once", async () => {
      const company = await insertCompany({
        updatedAt: new Date(),
      });
      const domain = faker.internet.domainName();
      const description = faker.lorem.paragraph(3);
      const name = faker.lorem.words(3);
      const logo = faker.image.url();
      const response = await executeGraphqlOperationAsSuperAdmin<
        UpdateCompanyMutation,
        UpdateCompanyMutationVariables
      >({
        document: UpdateCompany,
        variables: {
          input: {
            companyId: company.id,
            domain,
            logo,
            description,
            name,
          },
        },
      });

      expect(response.data?.updateCompany).toBeDefined();
      expect(response.data?.updateCompany?.name).toEqual(name);
      expect(response.data?.updateCompany?.domain).toEqual(domain);
      expect(response.data?.updateCompany?.logo).toEqual(logo);
      expect(response.data?.updateCompany?.website).toBeDefined();
      expect(response.data?.updateCompany?.description).toEqual(description);
      expect(response.data?.updateCompany?.hasBeenUpdated).toBeDefined();
      expect(response.data?.updateCompany?.status).toEqual("draft");
      expect(response.data?.updateCompany?.salarySubmissions).toEqual(0);
    });
  });
  describe("As a User", () => {
    it("Should update", async () => {
      const company = await insertCompany({
        updatedAt: null,
      });
      const domain = faker.internet.domainName();
      const description = faker.lorem.paragraph(3);
      const name = faker.lorem.words(3);
      const logo = faker.image.url();
      const user = await insertUser();
      const response = await executeGraphqlOperationAsUser<
        UpdateCompanyMutation,
        UpdateCompanyMutationVariables
      >(
        {
          document: UpdateCompany,
          variables: {
            input: {
              companyId: company.id,
              domain,
              logo,
              description,
              name,
            },
          },
        },
        user,
      );

      expect(response.data?.updateCompany).toBeDefined();
      expect(response.data?.updateCompany?.name).toEqual(name);
      expect(response.data?.updateCompany?.domain).toEqual(domain);
      expect(response.data?.updateCompany?.logo).toEqual(logo);
      expect(response.data?.updateCompany?.website).toBeDefined();
      expect(response.data?.updateCompany?.description).toEqual(description);
      expect(response.data?.updateCompany?.hasBeenUpdated).toBeDefined();
      expect(response.data?.updateCompany?.status).toEqual(null);
      expect(response.data?.updateCompany?.salarySubmissions).toEqual(0);
    });

    it("Should fail to update if it has already been updated once", async () => {
      const company = await insertCompany({
        updatedAt: new Date(),
      });
      const domain = faker.internet.domainName();
      const description = faker.lorem.paragraph(3);
      const name = faker.lorem.words(3);
      const logo = faker.image.url();
      const user = await insertUser();
      const response = await executeGraphqlOperationAsUser<
        UpdateCompanyMutation,
        UpdateCompanyMutationVariables
      >(
        {
          document: UpdateCompany,
          variables: {
            input: {
              companyId: company.id,
              domain,
              logo,
              description,
              name,
            },
          },
        },
        user,
      );

      expect(response.data?.updateCompany).toBeUndefined();
      expect(response.errors).toBeDefined();
      expect(response.errors?.[0]?.message).toEqual("Unexpected error.");
    });
  });
  describe("As an anonymous User", () => {
    it("Should fail to update", async () => {
      const company = await insertCompany();
      const domain = faker.internet.domainName();
      const description = faker.lorem.paragraph(3);
      const name = faker.lorem.words(3);
      const logo = faker.image.url();
      const response = await executeGraphqlOperation<
        UpdateCompanyMutation,
        UpdateCompanyMutationVariables
      >({
        document: UpdateCompany,
        variables: {
          input: {
            companyId: company.id,
            domain,
            logo,
            description,
            name,
          },
        },
      });

      expect(response.data?.updateCompany).toBeUndefined();
      expect(response.errors).toBeDefined();
    });
  });
});
