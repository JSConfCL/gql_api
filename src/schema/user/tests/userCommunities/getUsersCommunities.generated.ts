/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type UsersAndCommunitiesQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type UsersAndCommunitiesQuery = { __typename?: 'Query', users: Array<{ __typename?: 'User', id: string, name: string | null, communities: Array<{ __typename?: 'Community', description: string | null, id: string, name: string | null, status: Types.CommnunityStatus }> }> };


export const UsersAndCommunities = gql`
    query UsersAndCommunities {
  users {
    id
    name
    communities {
      description
      id
      name
      status
    }
  }
}
    `;