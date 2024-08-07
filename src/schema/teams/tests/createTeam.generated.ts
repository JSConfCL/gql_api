/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type * as Types from '../../../generated/types';

import type { JsonObject } from "type-fest";
import gql from 'graphql-tag';
export type CreateTeamMutationVariables = Types.Exact<{
  input: Types.TeamCreateInput;
}>;


export type CreateTeamMutation = { __typename?: 'Mutation', createTeam: { __typename?: 'TeamRef', id: string, name: string, status: Types.TeamStatus, description: string | null, event: { __typename?: 'Event', id: string }, users: Array<{ __typename?: 'UserWithStatusRef', id: string, role: Types.UserTeamRole, status: Types.ParticipationStatus, user: { __typename?: 'User', id: string } }> } };


export const CreateTeam = gql`
    mutation CreateTeam($input: TeamCreateInput!) {
  createTeam(input: $input) {
    id
    name
    status
    description
    event {
      id
    }
    users {
      id
      role
      status
      user {
        id
      }
    }
  }
}
    `;