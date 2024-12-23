/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type UpdateAddonMutationVariables = Types.Exact<{
  input: Types.UpdateAddonInput;
}>;


export type UpdateAddonMutation = { __typename?: 'Mutation', updateAddon: { __typename?: 'Addon', id: string, name: string, prices: Array<{ __typename?: 'Price', id: string, amount: number }> } };


export const UpdateAddon = gql`
    mutation UpdateAddon($input: UpdateAddonInput!) {
  updateAddon(input: $input) {
    id
    name
    prices {
      id
      amount
    }
  }
}
    `;