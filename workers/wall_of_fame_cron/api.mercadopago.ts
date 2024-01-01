/* eslint-disable no-console */
import { v4 } from "uuid";
import { getDb } from "../../src/datasources/db";
import { ENV } from "./types";
import {
  insertUsersToTagsSchema,
  insertTagsSchema,
  tagsSchema,
  usersTagsSchema,
  AllowedUserTags,
} from "../../src/datasources/db/schema";
import { sanitizeForLikeSearch } from "../../src/schema/shared/helpers";

const externalReferences = {
  "1LUKA": "1LUKA",
  "5LUKAS": "5LUKAS",
  "10LUKAS": "10LUKAS",
};

const getFetch = (env: ENV) => async (url: string) => {
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${env.MP_ACCESS_TOKEN}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(url, {
    headers,
  });
  const json = await response.json();
  return json;
};

type Result = {
  id: string;
  operation_type: string;
  payer: {
    id: string;
    email?: string | null;
    first_name: null | string;
    last_name: null | string;
  };
  transaction_details: {
    total_paid_amount: number;
  };
};

export const getSubscriptions = async (env: ENV) => {
  const DB = getDb({
    neonUrl: env.NEON_URL,
  });
  const meliFetch = getFetch(env);
  let results: Result[] = [];
  for await (const [externalReference, externalReferenceId] of Object.entries(
    externalReferences,
  )) {
    console.log("Searching for", externalReference);
    const subscriptions = (await meliFetch(
      `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&external_reference=${externalReferenceId}`,
    )) as {
      results?: Result[];
    };
    results = [...results, ...(subscriptions?.results || [])];
  }

  const tagToInsert = insertTagsSchema.parse({
    name: AllowedUserTags.DONOR,
    description: "Usuario Donador",
  });

  await DB.insert(tagsSchema).values(tagToInsert).onConflictDoNothing();

  const tag = await DB.query.tagsSchema.findFirst({
    where: (tags, { eq }) => eq(tags.name, AllowedUserTags.DONOR),
  });
  if (!tag) {
    throw new Error(`Missing TAG: ${AllowedUserTags.DONOR}`);
  }

  console.log("Results", results.length);
  for await (const subscription of results) {
    try {
      const email = subscription.payer.email;
      if (!email) {
        throw new Error("Email not found for subscription");
      }
      const user = await DB.query.usersSchema.findFirst({
        where: (u, { ilike }) => ilike(u.name, sanitizeForLikeSearch(email)),
      });
      if (!user) {
        throw new Error("User not found");
      }
      const userTag = insertUsersToTagsSchema.parse({
        tagId: tag.id,
        userId: user.id,
      });
      await DB.insert(usersTagsSchema)
        .values(userTag)
        .returning()
        .onConflictDoNothing();
    } catch (error) {
      console.error("Error processing", error);
    }
  }
};
