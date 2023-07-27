import { preExecRule } from "@graphql-authz/core";
import { GraphqlContext } from "~/builder";

export const IsAuthenticated = preExecRule({
  error: "User is not authenticated",
})((context: GraphqlContext, fieldArgs: unknown) => {
  return !!context.USER;
});

export const CanEditCommunity = preExecRule({
  error: "User is not authenticated",
})(async ({ USER, DB }: GraphqlContext, fieldArgs: { id?: string }) => {
  if (!fieldArgs.id) {
    return false;
  }
  if (!USER) {
    return false;
  }
  const user = await DB.query.communitySchema.findFirst({
    with: {
      usersToCommunities: {
        where: (utc, { eq, and }) =>
          and(eq(utc.userId, USER.id), eq(utc.role, "admin")),
      },
    },
  });
  return Boolean(user);
});
