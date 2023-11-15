import { it, describe, afterEach, assert } from "vitest";
import {
  executeGraphqlOperationAsSuperAdmin,
  executeGraphqlOperationAsUser,
  insertCommunity,
  insertUser,
  insertUserToCommunity,
} from "~/tests/__fixtures";
import { faker } from "@faker-js/faker";
import { clearDatabase } from "~/tests/__fixtures/databaseHelper";
import {
  EditCommunity,
  EditCommunityMutation,
  EditCommunityMutationVariables,
} from "./editCommunity.generated";
import { CommnunityStatus } from "~/generated/types";

afterEach(() => {
  clearDatabase();
});

describe("Edit community", () => {
  describe("Should edit an community", () => {
    it("As an super admin", async () => {
      const community1 = await insertCommunity();
      const response = await executeGraphqlOperationAsSuperAdmin<
        EditCommunityMutation,
        EditCommunityMutationVariables
      >({
        document: EditCommunity,
        variables: {
          input: {
            communityId: community1.id,
            status: CommnunityStatus.Active,
          },
        },
      });

      assert.equal(response.errors, undefined);
      assert.equal(
        response.data?.editCommunity.status,
        CommnunityStatus.Active,
      );
      assert.equal(response.data?.editCommunity.id, community1.id);
    });
    it("As an community admin", async () => {
      const user1 = await insertUser();
      const community1 = await insertCommunity();
      await insertUserToCommunity({
        communityId: community1.id,
        role: "admin",
        userId: user1.id,
      });
      await executeGraphqlOperationAsUser<
        EditCommunityMutation,
        EditCommunityMutationVariables
      >(
        {
          document: EditCommunity,
          variables: {
            input: {
              communityId: community1.id,
              status: CommnunityStatus.Active,
            },
          },
        },
        user1,
      );

      const response = await executeGraphqlOperationAsUser<
        EditCommunityMutation,
        EditCommunityMutationVariables
      >(
        {
          document: EditCommunity,
          variables: {
            input: {
              communityId: community1.id,
              status: CommnunityStatus.Inactive,
            },
          },
        },
        user1,
      );

      assert.equal(response.errors, undefined);
      assert.equal(
        response.data?.editCommunity.status,
        CommnunityStatus.Inactive,
      );
      assert.equal(response.data?.editCommunity.id, community1.id);
    });
  });
  describe("Should fail to create an community", () => {
    it("As normal user", async () => {
      const user1 = await insertUser();
      const community1 = await insertCommunity();
      const response = await executeGraphqlOperationAsUser<
        EditCommunityMutation,
        EditCommunityMutationVariables
      >(
        {
          document: EditCommunity,
          variables: {
            input: {
              communityId: community1.id,
              status: CommnunityStatus.Active,
            },
          },
        },
        user1,
      );

      assert.equal(response.errors?.length, 1);
      assert.equal(response.errors?.[0]?.message, "FORBIDDEN");
    });
    it("If community does not exist", async () => {
      const response = await executeGraphqlOperationAsSuperAdmin<
        EditCommunityMutation,
        EditCommunityMutationVariables
      >({
        document: EditCommunity,
        variables: {
          input: {
            communityId: "1",
            status: CommnunityStatus.Active,
          },
        },
      });

      assert.equal(response.errors?.length, 1);
      assert.equal(response.errors?.[0]?.message, "Community not found");
    });
  });
});
