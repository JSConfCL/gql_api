/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type CommunitiesUsersQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type CommunitiesUsersQuery = { __typename?: 'Query', communities: Array<{ __typename?: 'Community', description: string | null, id: string, users: Array<{ __typename?: 'User', id: string, communities: Array<{ __typename?: 'Community', id: string }> }> }> };

export type SingleCommunityUsersQueryVariables = Types.Exact<{
  id: Types.Scalars['String']['input'];
}>;


export type SingleCommunityUsersQuery = { __typename?: 'Query', community: { __typename?: 'Community', description: string | null, id: string, users: Array<{ __typename?: 'User', id: string, communities: Array<{ __typename?: 'Community', id: string }> }> } | null };


export const CommunitiesUsers = gql`
    query CommunitiesUsers {
  communities {
    description
    id
    users {
      id
      communities {
        id
      }
    }
  }
}
    `;
export const SingleCommunityUsers = gql`
    query SingleCommunityUsers($id: String!) {
  community(id: $id) {
    description
    id
    users {
      id
      communities {
        id
      }
    }
  }
}
    `;