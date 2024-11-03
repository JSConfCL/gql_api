/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type CancelUserTicketAddonsMutationVariables = Types.Exact<{
  userTicketAddonIds: Array<Types.Scalars['String']['input']> | Types.Scalars['String']['input'];
}>;


export type CancelUserTicketAddonsMutation = { __typename?: 'Mutation', cancelUserTicketAddons: Array<{ __typename?: 'UserTicketAddon', id: string, approvalStatus: Types.UserTicketAddonApprovalStatus, quantity: number, addonId: string, userTicketId: string }> };


export const CancelUserTicketAddons = gql`
    mutation cancelUserTicketAddons($userTicketAddonIds: [String!]!) {
  cancelUserTicketAddons(userTicketAddonIds: $userTicketAddonIds) {
    id
    approvalStatus
    quantity
    addonId
    userTicketId
  }
}
    `;