/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type UpdateUserMutationVariables = Types.Exact<{
  input: Types.UserEditInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser: { __typename?: 'User', id: string, name: string | null, lastName: string | null, bio: string | null, username: string } };


export const UpdateUser = gql`
    mutation UpdateUser($input: userEditInput!) {
  updateUser(input: $input) {
    id
    name
    lastName
    bio
    username
  }
}
    `;