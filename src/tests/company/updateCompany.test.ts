import { it, describe, afterEach, expect } from "vitest";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  insertUser,
} from "~/tests/__fixtures";
import { faker } from "@faker-js/faker";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import {
  UpdateCompany,
  UpdateCompanyMutation,
  UpdateCompanyMutationVariables,
} from "./mutations.generated";

afterEach(() => {
  clearDatabase();
});

describe("Company", () => {
  describe("As a Superadmin", () => {
    it("Should create a company", async () => {
      const domain = faker.internet.domainName();
      const description = faker.lorem.paragraph(3);
      const name = faker.lorem.words(3);
      const response = await executeGraphqlOperationAsSuperAdmin<
        UpdateCompanyMutation,
        UpdateCompanyMutationVariables
      >({
        document: UpdateCompany,
        variables: {
          input: {
            domain,
            description,
            name,
          },
        },
      });
      expect(response.data?.updateCompany).toBeDefined();
      expect(response.data?.updateCompany?.name).toEqual(name);
      expect(response.data?.updateCompany?.domain).toEqual(domain);
      expect(response.data?.updateCompany?.logo).toBeDefined();
      expect(response.data?.updateCompany?.website).toBeDefined();
      expect(response.data?.updateCompany?.description).toEqual(description);
      expect(response.data?.updateCompany?.hasBeenUpdated).toBeDefined();
      expect(response.data?.updateCompany?.status).toEqual("draft");
      expect(response.data?.updateCompany?.salarySubmissions).toEqual(0);
    });
  });
  describe("As a User", () => {
    it("Should error to create company", async () => {
      const domain = faker.internet.domainName();
      const description = faker.lorem.paragraph(3);
      const name = faker.lorem.words(3);
      const user = await insertUser();
      const response = await executeGraphqlOperationAsUser<
        UpdateCompanyMutation,
        UpdateCompanyMutationVariables
      >(
        {
          document: UpdateCompany,
          variables: {
            input: {
              domain,
              description,
              name,
            },
          },
        },
        user,
      );
      expect(response.data?.updateCompany).not.toBeDefined();
      expect(response.errors).toBeDefined();
      expect(response.errors?.[0].message).toBe("Unauthorized!");
    });
  });
  describe("As an anonymous User", () => {
    it("Should error to create company", async () => {
      const domain = faker.internet.domainName();
      const description = faker.lorem.paragraph(3);
      const name = faker.lorem.words(3);
      const response = await executeGraphqlOperation<
        UpdateCompanyMutation,
        UpdateCompanyMutationVariables
      >({
        document: UpdateCompany,
        variables: {
          input: {
            domain,
            description,
            name,
          },
        },
      });
      expect(response.data?.updateCompany).not.toBeDefined();
      expect(response.errors).toBeDefined();
      expect(response.errors?.[0].message).toBe("Unauthorized!");
    });
  });
});
