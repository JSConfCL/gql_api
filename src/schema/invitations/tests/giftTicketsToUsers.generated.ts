/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type GiftTicketsToUsersMutationVariables = Types.Exact<{
  input: Types.GiftTicketsToUserInput;
}>;


export type GiftTicketsToUsersMutation = { __typename?: 'Mutation', giftTicketsToUsers: Array<{ __typename?: 'UserTicket', id: string, redemptionStatus: Types.TicketRedemptionStatus, paymentStatus: Types.PurchaseOrderPaymentStatusEnum | null, approvalStatus: Types.TicketApprovalStatus, ticketTemplate: { __typename?: 'Ticket', id: string, name: string, event: { __typename?: 'Event', id: string, name: string } } }> };


export const GiftTicketsToUsers = gql`
    mutation giftTicketsToUsers($input: GiftTicketsToUserInput!) {
  giftTicketsToUsers(input: $input) {
    id
    redemptionStatus
    paymentStatus
    approvalStatus
    ticketTemplate {
      id
      name
      event {
        id
        name
      }
    }
  }
}
    `;