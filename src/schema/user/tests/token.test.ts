import { faker } from "@faker-js/faker";
import { decode, verify } from "@tsndr/cloudflare-worker-jwt";
import { it, describe, assert } from "vitest";

import { USER } from "~/datasources/db/users";
import { executeGraphqlOperation, insertUser } from "~/tests/fixtures";

import {
  Tokens,
  TokensMutation,
  TokensMutationVariables,
} from "./token.generated";

describe("User", () => {
  it("Should create a token", async () => {
    const retoolToken = faker.string.alphanumeric(10);
    const encoder = faker.string.alphanumeric(10);
    const user1 = await insertUser({
      isRetoolEnabled: true,
      isSuperAdmin: true,
      isEmailVerified: true,
    });
    const response = await executeGraphqlOperation<
      TokensMutation,
      TokensMutationVariables
    >(
      {
        document: Tokens,
        variables: {
          input: {
            authToken: retoolToken,
            userEmail: user1.email,
          },
        },
      },
      {
        RETOOL_AUTHENTICATION_TOKEN: retoolToken,
        SUPABASE_JWT_ENCODER: encoder,
      },
    );

    assert.equal(response.errors, undefined);

    const token = response.data?.retoolToken?.token;

    assert.exists(token);

    if (!token) {
      throw new Error("Token not found");
    }

    const verified = await verify(token, encoder);

    assert.exists(verified);

    assert.equal(verified, true);

    const decodedToken = decode<{
      user_metadata: USER;
    }>(token);

    const userTokenData = decodedToken?.payload?.user_metadata;

    assert.equal(userTokenData?.email, user1.email);

    assert.equal(userTokenData?.isSuperAdmin, true);

    assert.equal(userTokenData?.isRetoolEnabled, true);

    assert.equal(userTokenData?.isEmailVerified, true);

    assert.equal(userTokenData?.id, user1.id);
  });
});
