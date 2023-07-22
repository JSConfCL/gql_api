/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type GetTagsQueryVariables = Types.Exact<{
  tagDescription: Types.InputMaybe<Types.Scalars['String']['input']>;
  tagId: Types.InputMaybe<Types.Scalars['String']['input']>;
  tagName: Types.InputMaybe<Types.Scalars['String']['input']>;
}>;


export type GetTagsQuery = { __typename?: 'Query', tags: Array<{ __typename?: 'Tag', description: string | null, id: string, name: string | null, slug: string }> };


export const GetTags = gql`
    query GetTags($tagDescription: String, $tagId: String, $tagName: String) {
  tags(input: {description: $tagDescription, id: $tagId, name: $tagName}) {
    description
    id
    name
    slug
  }
}
    `;