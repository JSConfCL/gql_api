/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type CreateTicketMutationVariables = Types.Exact<{
  input: Types.TicketCreateInput;
}>;


export type CreateTicketMutation = { __typename?: 'Mutation', createTicket: { __typename?: 'Ticket', id: string, name: string, description: string | null, status: Types.TicketTemplateStatus, visibility: Types.TicketTemplateVisibility, startDateTime: string, endDateTime: string | null, isUnlimited: boolean, requiresApproval: boolean, quantity: number | null, eventId: string } };


export const CreateTicket = gql`
    mutation CreateTicket($input: TicketCreateInput!) {
  createTicket(input: $input) {
    id
    name
    description
    status
    visibility
    startDateTime
    endDateTime
    isUnlimited
    requiresApproval
    quantity
    eventId
  }
}
    `;