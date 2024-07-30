import { builder } from "~/builder";
import { selectWorkSenioritySchema } from "~/datasources/db/schema";
import { WorkRoleRef, WorkSeniorityRef } from "~/schema/shared/refs";

builder.objectType(WorkRoleRef, {
  description: "Representation of a work role",
  fields: (t) => ({
    id: t.exposeID("id", { nullable: false }),
    name: t.exposeString("name", { nullable: false }),
    description: t.exposeString("description", { nullable: true }),
    seniorities: t.field({
      type: [WorkSeniorityRef],
      resolve: async (root, _, { DB }) => {
        const workSenioritiesAndRoles =
          await DB.query.workSeniorityAndRoleSchema.findMany({
            where: (t, { eq }) => eq(t.id, root.id),
            with: {
              seniority: true,
            },
          });

        return workSenioritiesAndRoles.map((workSeniorityAndRole) =>
          selectWorkSenioritySchema.parse(workSeniorityAndRole),
        );
      },
    }),
  }),
});
