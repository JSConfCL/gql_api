import { builder } from "~/builder";
import { WorkSeniorityRef } from "~/schema/shared/refs";

builder.objectType(WorkSeniorityRef, {
  description: "Representation of a work seniority",
  fields: (t) => ({
    id: t.exposeString("id", { nullable: false }),
    name: t.exposeString("name", { nullable: false }),
    description: t.exposeString("description", { nullable: true }),
  }),
});
