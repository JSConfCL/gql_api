import { it, describe, expect } from "vitest";
import {
  executeGraphqlOperation,
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  insertUser,
} from "~/tests/__fixtures";
import { faker } from "@faker-js/faker";
import {
  CreateCompany,
  CreateCompanyMutation,
  CreateCompanyMutationVariables,
} from "./mutations.generated";

describe("Company", () => {
  describe("As a Superadmin", () => {
    it("Should create a company", async () => {
      const domain = faker.internet.domainName();
      const description = faker.lorem.paragraph(3);
      const name = faker.lorem.words(3);
      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateCompanyMutation,
        CreateCompanyMutationVariables
      >({
        document: CreateCompany,
        variables: {
          input: {
            domain,
            description,
            name,
          },
        },
      });
      expect(response.data?.createCompany).toBeDefined();
      expect(response.data?.createCompany?.name).toEqual(name);
      expect(response.data?.createCompany?.domain).toEqual(domain);
      expect(response.data?.createCompany?.logo).toBeDefined();
      expect(response.data?.createCompany?.website).toBeDefined();
      expect(response.data?.createCompany?.description).toEqual(description);
      expect(response.data?.createCompany?.hasBeenUpdated).toBeDefined();
      expect(response.data?.createCompany?.status).toEqual("draft");
      expect(response.data?.createCompany?.salarySubmissions).toEqual(0);
    });
  });
  describe("As a User", () => {
    it("Should error to create company", async () => {
      const domain = faker.internet.domainName();
      const description = faker.lorem.paragraph(3);
      const name = faker.lorem.words(3);
      const user = await insertUser();
      const response = await executeGraphqlOperationAsUser<
        CreateCompanyMutation,
        CreateCompanyMutationVariables
      >(
        {
          document: CreateCompany,
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
      expect(response.data?.createCompany).not.toBeDefined();
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
        CreateCompanyMutation,
        CreateCompanyMutationVariables
      >({
        document: CreateCompany,
        variables: {
          input: {
            domain,
            description,
            name,
          },
        },
      });
      expect(response.data?.createCompany).not.toBeDefined();
      expect(response.errors).toBeDefined();
      expect(response.errors?.[0].message).toBe("Unauthorized!");
    });
  });
});
