/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type StatusQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type StatusQuery = { __typename?: 'Query', status: string };


export const Status = gql`
    query Status {
  status
}
    `;