/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type { JsonObject } from "type-fest";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: any; output: any; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: any; output: any; }
};

export enum CommnunityStatus {
  Active = 'active',
  Inactive = 'inactive'
}

/** Representation of a Community */
export type Community = {
  __typename?: 'Community';
  description?: Maybe<Scalars['String']['output']>;
  events: Array<Event>;
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  status: CommnunityStatus;
  users: Array<User>;
};

/** Representation of an Event (Events and Users, is what tickets are linked to) */
export type Event = {
  __typename?: 'Event';
  address?: Maybe<Scalars['String']['output']>;
  community?: Maybe<Community>;
  description?: Maybe<Scalars['String']['output']>;
  endDateTime?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  latitude?: Maybe<Scalars['String']['output']>;
  longitude?: Maybe<Scalars['String']['output']>;
  maxAttendees?: Maybe<Scalars['Int']['output']>;
  meetingURL?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  startDateTime: Scalars['DateTime']['output'];
  status: EventStatus;
  tags: Array<Tag>;
  tickets: Array<UserTicket>;
  users: Array<User>;
  visibility: EventVisibility;
};


/** Representation of an Event (Events and Users, is what tickets are linked to) */
export type EventTicketsArgs = {
  input?: InputMaybe<EventsTicketsSearchInput>;
};

export type EventCreateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  communityId: Scalars['String']['input'];
  description: Scalars['String']['input'];
  endDateTime?: InputMaybe<Scalars['DateTime']['input']>;
  latitude?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['String']['input']>;
  maxAttendees: Scalars['Int']['input'];
  meetingURL?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  startDateTime: Scalars['DateTime']['input'];
  status?: InputMaybe<EventStatus>;
  timeZone?: InputMaybe<Scalars['String']['input']>;
  visibility?: InputMaybe<EventVisibility>;
};

export enum EventStatus {
  Active = 'active',
  Inactive = 'inactive'
}

export enum EventVisibility {
  Private = 'private',
  Public = 'public',
  Unlisted = 'unlisted'
}

export type EventsSearchInput = {
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  startDateTimeFrom?: InputMaybe<Scalars['DateTime']['input']>;
  startDateTimeTo?: InputMaybe<Scalars['DateTime']['input']>;
  status?: InputMaybe<EventStatus>;
  visibility?: InputMaybe<EventVisibility>;
};

export type EventsTicketsSearchInput = {
  approvalStatus?: InputMaybe<TicketApprovalStatus>;
  id?: InputMaybe<Scalars['String']['input']>;
  paymentStatus?: InputMaybe<TicketPaymentStatus>;
  redemptionStatus?: InputMaybe<TicketRedemptionStatus>;
  status?: InputMaybe<TicketStatus>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Cancel a ticket */
  cancelUserTicket?: Maybe<UserTicket>;
  /** Create an event */
  createEvent: Event;
  /** Update a user */
  updateUser: User;
};


export type MutationCancelUserTicketArgs = {
  input: CancelUserTicket;
};


export type MutationCreateEventArgs = {
  input: EventCreateInput;
};


export type MutationUpdateUserArgs = {
  input: UserEditInput;
};

export type MyTicketsSearchInput = {
  approvalStatus?: InputMaybe<TicketApprovalStatus>;
  eventId?: InputMaybe<Scalars['String']['input']>;
  paymentStatus?: InputMaybe<TicketPaymentStatus>;
  redemptionStatus?: InputMaybe<TicketRedemptionStatus>;
  status?: InputMaybe<TicketStatus>;
};

export type Query = {
  __typename?: 'Query';
  /** Get a list of communities. Filter by name, id, or status */
  communities: Array<Community>;
  /** Get a community by id */
  community?: Maybe<Community>;
  /** Get an event by id */
  event?: Maybe<Event>;
  /** Get a list of events. Filter by name, id, status or date */
  events: Array<Event>;
  /** Get a list of tickets for the current user */
  myTickets: Array<UserTicket>;
  status: Scalars['String']['output'];
  /** Get a list of tags */
  tags: Array<Tag>;
  /** Get a list of users */
  users: Array<User>;
};


export type QueryCommunitiesArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<CommnunityStatus>;
};


export type QueryCommunityArgs = {
  id: Scalars['String']['input'];
};


export type QueryEventArgs = {
  id: Scalars['String']['input'];
};


export type QueryEventsArgs = {
  input?: InputMaybe<EventsSearchInput>;
};


export type QueryMyTicketsArgs = {
  input?: InputMaybe<MyTicketsSearchInput>;
};


export type QueryStatusArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
};


export type QueryTagsArgs = {
  input?: InputMaybe<TagSearchInput>;
};

/** Representation of a tag. Tags can be associated to many things. An event, a community, etc. */
export type Tag = {
  __typename?: 'Tag';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  slug: Scalars['String']['output'];
};

export type TagSearchInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export enum TicketApprovalStatus {
  Approved = 'approved',
  Pending = 'pending'
}

export enum TicketPaymentStatus {
  Paid = 'paid',
  Unpaid = 'unpaid'
}

export enum TicketRedemptionStatus {
  Pending = 'pending',
  Redeemed = 'redeemed'
}

export enum TicketStatus {
  Active = 'active',
  Cancelled = 'cancelled'
}

/** Representation of a user */
export type User = {
  __typename?: 'User';
  bio?: Maybe<Scalars['String']['output']>;
  communities: Array<Community>;
  id: Scalars['String']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  username: Scalars['String']['output'];
};

/** Representation of a User ticket */
export type UserTicket = {
  __typename?: 'UserTicket';
  approvalStatus: TicketApprovalStatus;
  id: Scalars['ID']['output'];
  paymentStatus: TicketPaymentStatus;
  redemptionStatus: TicketRedemptionStatus;
  status: TicketStatus;
};

export type CancelUserTicket = {
  communityId: Scalars['String']['input'];
  id: Scalars['String']['input'];
};

export type UserEditInput = {
  bio?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};
