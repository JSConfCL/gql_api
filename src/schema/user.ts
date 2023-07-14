import { builder } from "../builder";
import { selectUserSchema, userSchema } from "~/datasources/db/schema";
import { z } from "zod";

type UserGraphqlSchema = z.infer<typeof selectUserSchema>;
const UserRef = builder.objectRef<UserGraphqlSchema>("User");

builder.objectType(UserRef, {
  description: "Representation of auser",
  fields: (t) => ({
    id: t.exposeString("id", {}),
    name: t.exposeString("name", { nullable: true }),
    email: t.exposeString("email", { nullable: true }),
  }),
});

builder.queryFields((t) => ({
  users: t.field({
    type: [UserRef],
    resolve: async (root, args, ctx) => {
      const users = await ctx.DB.select().from(userSchema).all();
      return users.map((u) => selectUserSchema.parse(u));
    },
  }),
}));
