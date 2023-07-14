import { builder } from "../builder";
import { selectUsersSchema, usersSchema } from "~/datasources/db/schema";
import { z } from "zod";

type UserGraphqlSchema = z.infer<typeof selectUsersSchema>;
const UserRef = builder.objectRef<UserGraphqlSchema>("User");

builder.objectType(UserRef, {
  description: "Representation of auser",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: true }),
    email: t.exposeString("email", { nullable: true }),
    username: t.exposeString("username", { nullable: false }),
  }),
});

builder.queryFields((t) => ({
  users: t.field({
    type: [UserRef],
    resolve: async (root, args, ctx) => {
      const users = await ctx.DB.select().from(usersSchema).all();
      return users.map((u) => selectUsersSchema.parse(u));
    },
  }),
}));
