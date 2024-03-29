/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type TagsQueryVariables = Types.Exact<{
  input: Types.InputMaybe<Types.TagSearchInput>;
}>;


export type TagsQuery = { __typename?: 'Query', tags: Array<{ __typename?: 'Tag', description: string | null, id: string, name: string | null, slug: string }> };


export const Tags = gql`
    query Tags($input: TagSearchInput) {
  tags(input: $input) {
    description
    id
    name
    slug
  }
}
    `;