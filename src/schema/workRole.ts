import { builder } from "~/builder";
import { WorkRoleRef } from "./shared/refs";
import { selectWorkRoleSchema } from "../datasources/db/schema";

builder.objectType(WorkRoleRef, {
  description: "Representation of a workEmail",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: false }),
    seniority: t.exposeString("seniority", { nullable: false }),
    description: t.exposeString("description", { nullable: false }),
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
