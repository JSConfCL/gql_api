/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type EditTicketMutationVariables = Types.Exact<{
  input: Types.TicketEditInput;
}>;


export type EditTicketMutation = { __typename?: 'Mutation', editTicket: { __typename?: 'Ticket', id: string, name: string, description: string | null, status: Types.TicketTemplateStatus, visibility: Types.TicketTemplateVisibility, isUnlimited: boolean, startDateTime: string, endDateTime: string | null, requiresApproval: boolean, quantity: number | null, event: { __typename?: 'Event', id: string } } };


export const EditTicket = gql`
    mutation EditTicket($input: TicketEditInput!) {
  editTicket(input: $input) {
    id
    name
    description
    status
    visibility
    isUnlimited
    startDateTime
    endDateTime
    requiresApproval
    quantity
    event {
      id
    }
  }
}
    `;