import { faker } from "@faker-js/faker";
import { verify } from "jsonwebtoken";
import { it, describe, assert } from "vitest";

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

    const decodedToken = verify(token, encoder, {
      complete: true,
    }) as unknown as {
      payload: {
        audience: string;
        user_metadata: {
          sub: string;
        };
      };
    };

    assert.exists(token);

    const { user_metadata: userTokenData, audience } = decodedToken.payload;

    assert.equal(userTokenData?.sub, user1.id);

    assert.equal(Object.keys(userTokenData).length, 1);

    assert.equal(audience, "retool");
  });
});
