import { builder } from "~/builder";
import {
  selectWorkRoleSchema,
  selectWorkSenioritySchema,
} from "~/datasources/db/schema";
import { WorkRoleRef, WorkSeniorityRef } from "~/schema/shared/refs";

const WorkRoleSenioritiesInput = builder.inputType("WorkRoleSenioritiesInput", {
  fields: (t) => ({
    workRoleId: t.field({
      type: "String",
      required: true,
    }),
  }),
});

builder.queryFields((t) => ({
  workRoles: t.field({
    description: "Get a list of possible work roles",
    type: [WorkRoleRef],
    authz: {
      rules: ["IsAuthenticated"],
    },
    resolve: async (root, _, { DB, USER }) => {
      if (!USER) {
        throw new Error("No user present");
      }

      const workRoles = await DB.query.workRoleSchema.findMany();

      return workRoles.map((wr) => selectWorkRoleSchema.parse(wr));
    },
  }),
  workRoleSeniorities: t.field({
    description: "Get a a work role's seniorities",
    type: [WorkSeniorityRef],
    authz: {
      rules: ["IsAuthenticated"],
    },
    args: {
      input: t.arg({
        type: WorkRoleSenioritiesInput,
        required: true,
      }),
    },
    resolve: async (root, { input }, { DB, USER }) => {
      if (!USER) {
        throw new Error("No user present");
      }

      const { workRoleId } = input;
      const workSenioritiesAndRoles =
        await DB.query.workSeniorityAndRoleSchema.findMany({
          where: (t, { eq }) => eq(t.id, workRoleId),
          with: {
            seniority: true,
          },
        });

      return workSenioritiesAndRoles.map((workSeniorityAndRole) =>
        selectWorkSenioritySchema.parse(workSeniorityAndRole),
      );
    },
  }),
}));
