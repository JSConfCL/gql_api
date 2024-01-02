import { builder } from "~/builder";
import { WorkRoleRef } from "./shared/refs";
import { selectWorkRoleSchema } from "../datasources/db/schema";

builder.objectType(WorkRoleRef, {
  description: "Representation of a work role",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: false }),
    description: t.exposeString("description", { nullable: true }),
  }),
});

builder.queryFields((t) => ({
  workRoles: t.field({
    description: "Get a list of possible work roles",
    type: [WorkRoleRef],
    resolve: async (root, _, { DB, USER }) => {
      if (!USER) {
        throw new Error("No user present");
      }
      const workRoles = await DB.query.workRoleSchema.findMany();
      return workRoles.map((workRole) => selectWorkRoleSchema.parse(workRole));
    },
  }),
}));
