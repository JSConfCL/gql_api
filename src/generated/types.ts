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
};

export enum CommnunityStatus {
  Active = 'active',
  Inactive = 'inactive'
}

/** Representation of a Community */
export type Community = {
  __typename?: 'Community';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  status: CommnunityStatus;
  users: Array<User>;
};

/** Representation of an Event (This is what tickets will be assigned to) */
export type Event = {
  __typename?: 'Event';
  community?: Maybe<Community>;
  description?: Maybe<Scalars['String']['output']>;
  endDateTime?: Maybe<Scalars['Int']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  startDateTime: Scalars['Int']['output'];
  status: EventStatus;
  tags: Array<Tag>;
  users: Array<User>;
  visibility: EventVisibility;
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
  endDateTime?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  startDateTime?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<EventStatus>;
  visibility?: InputMaybe<EventVisibility>;
};

export type Query = {
  __typename?: 'Query';
  /** Get a list of communities. Filter by name, id, or status */
  communities: Array<Community>;
  /** Get a community by id */
  community?: Maybe<Community>;
  /** Get an event by id */
  event?: Maybe<Event>;
  /** Get a list of events. Filter by name, id, status or tags */
  events: Array<Event>;
  status: Scalars['String']['output'];
  /** Get a list of users */
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

/** Representation of a user */
export type User = {
  __typename?: 'User';
  communities: Array<Community>;
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  username: Scalars['String']['output'];
};
