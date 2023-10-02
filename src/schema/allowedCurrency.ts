import {
  communitySchema,
  selectCommunitySchema,
  selectEventsSchema,
  selectUsersSchema,
} from "~/datasources/db/schema";
import { SQL, eq, like } from "drizzle-orm";
import { AllowedCurrencyRef } from "~/schema/shared/refs";
import { builder } from "~/builder";

builder.objectType(AllowedCurrencyRef, {
  description: "Representation of a workEmail",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    currency: t.exposeString("currency", { nullable: false }),
  }),
});
