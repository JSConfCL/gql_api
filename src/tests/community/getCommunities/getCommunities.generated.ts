/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type CommunitiesQueryVariables = Types.Exact<{
  communityID: Types.InputMaybe<Types.Scalars['String']['input']>;
  communityName: Types.InputMaybe<Types.Scalars['String']['input']>;
  communityStatus: Types.InputMaybe<Types.CommnunityStatus>;
}>;


export type CommunitiesQuery = { __typename?: 'Query', communities: Array<{ __typename?: 'Community', description: string | null, id: string, name: string | null, status: Types.CommnunityStatus, events: Array<{ __typename?: 'Event', id: string }> }> };


export const Communities = gql`
    query Communities($communityID: String, $communityName: String, $communityStatus: CommnunityStatus) {
  communities(id: $communityID, name: $communityName, status: $communityStatus) {
    description
    id
    name
    status
    events {
      id
    }
  }
}
    `;