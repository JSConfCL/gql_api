/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type FetchWaitlistQueryVariables = Types.Exact<{
  ticketId: Types.Scalars['String']['input'];
}>;


export type FetchWaitlistQuery = { __typename?: 'Query', getWaitlist: { __typename?: 'Waitlist', id: string, myRsvp: { __typename?: 'UserTicket', id: string, approvalStatus: Types.TicketApprovalStatus, user: { __typename?: 'User', id: string } | null } | null, ticket: { __typename?: 'Ticket', id: string } } };


export const FetchWaitlist = gql`
    query FetchWaitlist($ticketId: String!) {
  getWaitlist(ticketId: $ticketId) {
    id
    myRsvp {
      id
      user {
        id
      }
      approvalStatus
    }
    ticket {
      id
    }
  }
}
    `;