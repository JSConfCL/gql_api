/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type TriggerUserTicketApprovalReviewMutationVariables = Types.Exact<{
  eventId: Types.Scalars['String']['input'];
  userId: Types.Scalars['String']['input'];
}>;


export type TriggerUserTicketApprovalReviewMutation = { __typename?: 'Mutation', triggerUserTicketApprovalReview: Array<{ __typename?: 'UserTicket', id: string, paymentStatus: Types.PurchaseOrderPaymentStatusEnum | null, approvalStatus: Types.TicketApprovalStatus, redemptionStatus: Types.TicketRedemptionStatus }> };


export const TriggerUserTicketApprovalReview = gql`
    mutation TriggerUserTicketApprovalReview($eventId: String!, $userId: String!) {
  triggerUserTicketApprovalReview(eventId: $eventId, userId: $userId) {
    id
    paymentStatus
    approvalStatus
    redemptionStatus
  }
}
    `;