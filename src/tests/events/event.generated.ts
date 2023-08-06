/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type EventQueryVariables = Types.Exact<{
  eventId: Types.Scalars['String']['input'];
}>;


export type EventQuery = { __typename?: 'Query', event: { __typename?: 'Event', id: string, name: string, description: string | null, visibility: Types.EventVisibility, status: Types.EventStatus, startDateTime: string, endDateTime: string | null, tags: Array<{ __typename?: 'Tag', id: string }>, community: { __typename?: 'Community', id: string } | null, users: Array<{ __typename?: 'User', id: string }>, tickets: Array<{ __typename?: 'UserTicket', id: string, status: Types.TicketStatus, paymentStatus: Types.TicketPaymentStatus, approvalStatus: Types.TicketApprovalStatus, redemptionStatus: Types.TicketRedemptionStatus }> } | null };


export const Event = gql`
    query Event($eventId: String!) {
  event(id: $eventId) {
    id
    name
    description
    visibility
    status
    startDateTime
    endDateTime
    tags {
      id
    }
    community {
      id
    }
    users {
      id
    }
    tickets {
      id
      status
      paymentStatus
      approvalStatus
      redemptionStatus
    }
  }
}
    `;