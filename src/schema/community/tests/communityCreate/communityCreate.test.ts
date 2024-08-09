import { faker } from "@faker-js/faker";
import { it, describe, assert } from "vitest";

import { CommnunityStatus } from "~/generated/types";
import {
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertUser,
} from "~/tests/fixtures";

import {
  CreateCommunity,
  CreateCommunityMutation,
  CreateCommunityMutationVariables,
} from "./communityCreate.generated";

describe("Community", () => {
  describe("Should create an community", () => {
    it("As an super admin", async () => {
      const fakeData = {
        name: faker.lorem.words(3),
        slug: faker.lorem.slug(3),
        description: faker.lorem.paragraph(3),
      };
      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateCommunityMutation,
        CreateCommunityMutationVariables
      >({
        document: CreateCommunity,
        variables: {
          input: fakeData,
        },
      });

      assert.equal(response.errors, undefined);

      assert.equal(response.data?.createCommunity.name, fakeData.name);

      assert.equal(
        response.data?.createCommunity.description,
        fakeData.description,
      );

      assert.equal(
        response.data?.createCommunity.status,
        CommnunityStatus.Inactive,
      );
    });
  });

  describe("Should fail to create an community", () => {
    it("As normal user", async () => {
      const user1 = await insertUser();
      const fakeData = {
        name: faker.lorem.words(3),
        slug: faker.lorem.slug(3),
        description: faker.lorem.paragraph(3),
      };
      const response = await executeGraphqlOperationAsUser<
        CreateCommunityMutation,
        CreateCommunityMutationVariables
      >(
        {
          document: CreateCommunity,
          variables: {
            input: fakeData,
          },
        },
        user1,
      );

      assert.equal(response.errors?.length, 1);

      assert.equal(response.errors?.[0]?.message, "FORBIDDEN");
    });

    it("If community slug already exist", async () => {
      await insertCommunity({
        name: "aas",
        slug: "c",
      });
      const fakeData = {
        name: faker.lorem.words(3),
        slug: "c",
        description: faker.lorem.paragraph(3),
      };
      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateCommunityMutation,
        CreateCommunityMutationVariables
      >({
        document: CreateCommunity,
        variables: {
          input: fakeData,
        },
      });

      assert.equal(response.errors?.length, 1);

      assert.equal(response.errors?.[0]?.message, "This slug already exist");
    });

    it("If community name shorter than 2 characters", async () => {
      const fakeData = {
        name: "s",
        slug: "c",
        description: faker.lorem.paragraph(3),
      };
      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateCommunityMutation,
        CreateCommunityMutationVariables
      >({
        document: CreateCommunity,
        variables: {
          input: fakeData,
        },
      });
      const msg = JSON.parse(response.errors?.[0]?.message || "") as {
        message: string;
      }[];

      assert.equal(response.errors?.length, 1);

      assert.equal(
        msg[0].message,
        "String must contain at least 2 character(s)",
      );
    });

    it("If community name shorter than 65 characters", async () => {
      const fakeData = {
        name: faker.lorem.words(65),
        slug: "c",
        description: faker.lorem.paragraph(3),
      };
      const response = await executeGraphqlOperationAsSuperAdmin<
        CreateCommunityMutation,
        CreateCommunityMutationVariables
      >({
        document: CreateCommunity,
        variables: {
          input: fakeData,
        },
      });
      const msg = JSON.parse(response.errors?.[0]?.message || "") as {
        message: string;
      }[];

      assert.equal(response.errors?.length, 1);

      assert.equal(
        msg[0].message,
        "String must contain at most 64 character(s)",
      );
    });
  });
});
