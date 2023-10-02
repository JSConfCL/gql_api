import { builder } from "~/builder";
import { WorkRoleRef } from "./shared/refs";

builder.objectType(WorkRoleRef, {
  description: "Representation of a workEmail",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: false }),
    seniority: t.exposeString("seniority", { nullable: false }),
    description: t.exposeString("description", { nullable: false }),
  }),
});
