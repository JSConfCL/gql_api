import { builder } from "~/builder";
import { UserToCommunitiesRef } from "./shared/refs";


builder.objectType(UserToCommunitiesRef, {
  description: "Representation of a user to communities",
  fields: (t) => ({
    userId: t.exposeString("userId", { nullable: true }),
    communityId: t.exposeString("communityId", { nullable: true }),
    role: t.exposeString("role", { nullable: true }),
  }),
});
