/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type ClaimUserTicketMutationVariables = Types.Exact<{
  input: Types.TicketClaimInput;
}>;


export type ClaimUserTicketMutation = { __typename?: 'Mutation', claimUserTicket: { __typename: 'PurchaseOrder', id: string, tickets: Array<{ __typename?: 'UserTicket', id: string, paymentStatus: Types.PurchaseOrderPaymentStatusEnum | null, approvalStatus: Types.TicketApprovalStatus, redemptionStatus: Types.TicketRedemptionStatus }> } | { __typename: 'RedeemUserTicketError', errorMessage: string } };


export const ClaimUserTicket = gql`
    mutation ClaimUserTicket($input: TicketClaimInput!) {
  claimUserTicket(input: $input) {
    __typename
    ... on PurchaseOrder {
      id
      tickets {
        id
        paymentStatus
        approvalStatus
        redemptionStatus
      }
    }
    ... on RedeemUserTicketError {
      __typename
      errorMessage
    }
  }
}
    `;