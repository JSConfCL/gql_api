/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/* This file is automatically generated using `npm run graphql:types` */
import type { JsonObject } from "type-fest";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: string; output: string };
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: { input: string; output: string };
};

export type AcceptTeamInvitationInput = {
  teamId: Scalars["String"]["input"];
};

export type AddPersonToTeamInput = {
  teamId: Scalars["String"]["input"];
  userEmail: Scalars["String"]["input"];
};

/** Response when adding a user to a team */
export type AddUserToTeamResponseRef = {
  __typename?: "AddUserToTeamResponseRef";
  team: TeamRef;
  userIsInOtherTeams: Scalars["Boolean"]["output"];
};

/** Representation of a workEmail */
export type AllowedCurrency = {
  __typename?: "AllowedCurrency";
  currency: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  validPaymentMethods: ValidPaymentMethods;
};

export type CheckForPurchaseOrderInput = {
  purchaseOrderId: Scalars["String"]["input"];
};

export enum CommnunityStatus {
  Active = "active",
  Inactive = "inactive",
}

/** Representation of a Community */
export type Community = {
  __typename?: "Community";
  banner?: Maybe<Scalars["String"]["output"]>;
  description?: Maybe<Scalars["String"]["output"]>;
  events: Array<Event>;
  id: Scalars["ID"]["output"];
  logo?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  status: CommnunityStatus;
  users: Array<User>;
};

/** Representation of a workEmail */
export type Company = {
  __typename?: "Company";
  description?: Maybe<Scalars["String"]["output"]>;
  domain: Scalars["String"]["output"];
  hasBeenUpdated: Scalars["Boolean"]["output"];
  id: Scalars["ID"]["output"];
  logo?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  salarySubmissions: Scalars["Int"]["output"];
  /** Not available to users */
  status?: Maybe<CompanyStatus>;
  website?: Maybe<Scalars["String"]["output"]>;
};

export enum CompanyStatus {
  Active = "active",
  Draft = "draft",
  Inactive = "inactive",
}

/** Representation of a consolidated payment entry log calculation */
export type ConsolidatedPaymentLogEntry = {
  __typename?: "ConsolidatedPaymentLogEntry";
  currencyId: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  platform: Scalars["String"]["output"];
  totalTransactionAmount: Scalars["Float"]["output"];
};

export type CreateCommunityInput = {
  description: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
  slug: Scalars["String"]["input"];
};

export type CreateCompanyInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  /** The email domain of the company (What we'll use to match the company to the user on account-creation) */
  domain: Scalars["String"]["input"];
  logo?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<CompanyStatus>;
  website?: InputMaybe<Scalars["String"]["input"]>;
};

export type CreateSalaryInput = {
  amount: Scalars["Int"]["input"];
  companyId: Scalars["String"]["input"];
  confirmationToken: Scalars["String"]["input"];
  countryCode: Scalars["String"]["input"];
  currencyCode: Scalars["String"]["input"];
  gender: Gender;
  genderOtherText: Scalars["String"]["input"];
  typeOfEmployment: TypeOfEmployment;
  workMetodology: WorkMetodology;
  workSeniorityAndRoleId: Scalars["String"]["input"];
  yearsOfExperience: Scalars["Int"]["input"];
};

export enum EmailStatus {
  Confirmed = "confirmed",
  Pending = "pending",
  Rejected = "rejected",
}

export type EnqueueGoogleAlbumImportInput = {
  albumId: Scalars["String"]["input"];
  sanityEventId: Scalars["String"]["input"];
  token: Scalars["String"]["input"];
};

/** Representation of an Event (Events and Users, is what tickets are linked to) */
export type Event = {
  __typename?: "Event";
  address?: Maybe<Scalars["String"]["output"]>;
  bannerImageSanityRef?: Maybe<Scalars["String"]["output"]>;
  community?: Maybe<Community>;
  description?: Maybe<Scalars["String"]["output"]>;
  endDateTime?: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["ID"]["output"];
  images: Array<SanityAssetRef>;
  latitude?: Maybe<Scalars["String"]["output"]>;
  longitude?: Maybe<Scalars["String"]["output"]>;
  meetingURL?: Maybe<Scalars["String"]["output"]>;
  name: Scalars["String"]["output"];
  startDateTime: Scalars["DateTime"]["output"];
  status: EventStatus;
  tags: Array<Tag>;
  teams: Array<TeamRef>;
  /** List of tickets for sale or redemption for this event. (If you are looking for a user's tickets, use the usersTickets field) */
  tickets: Array<Ticket>;
  users: Array<User>;
  /** List of tickets that a user owns for this event. */
  usersTickets: Array<UserTicket>;
  visibility: EventVisibility;
};

/** Representation of an Event (Events and Users, is what tickets are linked to) */
export type EventUsersTicketsArgs = {
  input?: InputMaybe<EventsTicketsSearchInput>;
};

export type EventCreateInput = {
  address?: InputMaybe<Scalars["String"]["input"]>;
  communityId: Scalars["String"]["input"];
  description: Scalars["String"]["input"];
  endDateTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  latitude?: InputMaybe<Scalars["String"]["input"]>;
  longitude?: InputMaybe<Scalars["String"]["input"]>;
  meetingURL?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
  startDateTime: Scalars["DateTime"]["input"];
  status?: InputMaybe<EventStatus>;
  timeZone?: InputMaybe<Scalars["String"]["input"]>;
  visibility?: InputMaybe<EventVisibility>;
};

export type EventEditInput = {
  address?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  endDateTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  eventId: Scalars["String"]["input"];
  latitude?: InputMaybe<Scalars["String"]["input"]>;
  longitude?: InputMaybe<Scalars["String"]["input"]>;
  meetingURL?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  startDateTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  status?: InputMaybe<EventStatus>;
  timeZone?: InputMaybe<Scalars["String"]["input"]>;
  visibility?: InputMaybe<EventVisibility>;
};

/** Search for tags */
export type EventImageSearch = {
  eventId: Scalars["String"]["input"];
};

export enum EventStatus {
  Active = "active",
  Inactive = "inactive",
}

export enum EventVisibility {
  Private = "private",
  Public = "public",
  Unlisted = "unlisted",
}

export type EventsSearchInput = {
  id?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  startDateTimeFrom?: InputMaybe<Scalars["DateTime"]["input"]>;
  startDateTimeTo?: InputMaybe<Scalars["DateTime"]["input"]>;
  status?: InputMaybe<EventStatus>;
  ticketTags?: InputMaybe<Array<Scalars["String"]["input"]>>;
  userHasTickets?: InputMaybe<Scalars["Boolean"]["input"]>;
  visibility?: InputMaybe<EventVisibility>;
};

export type EventsTicketsSearchInput = {
  approvalStatus?: InputMaybe<TicketApprovalStatus>;
  id?: InputMaybe<Scalars["String"]["input"]>;
  paymentStatus?: InputMaybe<TicketPaymentStatus>;
  redemptionStatus?: InputMaybe<TicketRedemptionStatus>;
};

export enum Gender {
  Agender = "Agender",
  Female = "Female",
  Genderfluid = "Genderfluid",
  Genderqueer = "Genderqueer",
  Male = "Male",
  NonBinary = "NonBinary",
  Other = "Other",
  PreferNotToSay = "PreferNotToSay",
  TransgenderFemale = "TransgenderFemale",
  TransgenderMale = "TransgenderMale",
  TwoSpirit = "TwoSpirit",
  Empty = "empty",
}

export type GeneratePaymentLinkInput = {
  currencyId: Scalars["String"]["input"];
};

export type Mutation = {
  __typename?: "Mutation";
  acceptGiftedTicket: UserTicket;
  /** Accept the user's invitation to a team */
  acceptTeamInvitation: TeamRef;
  /** Try to add a person to a team */
  addPersonToTeam: AddUserToTeamResponseRef;
  /** Approve a ticket */
  approvalUserTicket: UserTicket;
  /** Cancel a ticket */
  cancelUserTicket: UserTicket;
  /** Check the status of a purchase order */
  checkPurchaseOrderStatus: PurchaseOrder;
  /** Attempt to claim a certain ammount of tickets */
  claimUserTicket: RedeemUserTicketResponse;
  /** Create an community */
  createCommunity: Community;
  /** Create a company */
  createCompany: Company;
  /** Create an event */
  createEvent: Event;
  /** Create a salary */
  createSalary: Salary;
  /** Create a team, associated to a specific event */
  createTeam: TeamRef;
  /** Create a ticket */
  createTicket: Ticket;
  /** Try to add a person to a team */
  deletePersonFomTeam: TeamRef;
  /** Edit an community */
  editCommunity: Community;
  /** Edit an event */
  editEvent: Event;
  /** Edit a ticket */
  editTicket: Ticket;
  /** Enqueue images to import */
  enqueueGoogleAlbumImport: Scalars["Boolean"]["output"];
  /** Create a purchase order */
  payForPurchaseOrder: PurchaseOrder;
  /** Redeem a ticket */
  redeemUserTicket: UserTicket;
  /** Reject the user's invitation to a team */
  rejectTeamInvitation: TeamRef;
  /** Kickoff the email validation flow. This flow will links an email to a user, create a company if it does not exist, and allows filling data for that email's position */
  startWorkEmailValidation: WorkEmail;
  /** Update a company */
  updateCompany: Company;
  /** Create a salary */
  updateSalary: Salary;
  /** Updates a team information */
  updateTeam: TeamRef;
  /** Update a user */
  updateUser: User;
  /** Update a user role */
  updateUserRoleInCommunity: User;
  /** Validates work email for a user */
  validateWorkEmail: WorkEmail;
};

export type MutationAcceptGiftedTicketArgs = {
  userTicketId: Scalars["String"]["input"];
};

export type MutationAcceptTeamInvitationArgs = {
  input: AcceptTeamInvitationInput;
};

export type MutationAddPersonToTeamArgs = {
  input: AddPersonToTeamInput;
};

export type MutationApprovalUserTicketArgs = {
  userTicketId: Scalars["String"]["input"];
};

export type MutationCancelUserTicketArgs = {
  userTicketId: Scalars["String"]["input"];
};

export type MutationCheckPurchaseOrderStatusArgs = {
  input: CheckForPurchaseOrderInput;
};

export type MutationClaimUserTicketArgs = {
  input: TicketClaimInput;
};

export type MutationCreateCommunityArgs = {
  input: CreateCommunityInput;
};

export type MutationCreateCompanyArgs = {
  input: CreateCompanyInput;
};

export type MutationCreateEventArgs = {
  input: EventCreateInput;
};

export type MutationCreateSalaryArgs = {
  input: CreateSalaryInput;
};

export type MutationCreateTeamArgs = {
  input: TeamCreateInput;
};

export type MutationCreateTicketArgs = {
  input: TicketCreateInput;
};

export type MutationDeletePersonFomTeamArgs = {
  input: RemovePersonFromTeamInput;
};

export type MutationEditCommunityArgs = {
  input: UpdateCommunityInput;
};

export type MutationEditEventArgs = {
  input: EventEditInput;
};

export type MutationEditTicketArgs = {
  input: TicketEditInput;
};

export type MutationEnqueueGoogleAlbumImportArgs = {
  input: EnqueueGoogleAlbumImportInput;
};

export type MutationPayForPurchaseOrderArgs = {
  input: PayForPurchaseOrderInput;
};

export type MutationRedeemUserTicketArgs = {
  userTicketId: Scalars["String"]["input"];
};

export type MutationRejectTeamInvitationArgs = {
  input: RejectTeamInvitationInput;
};

export type MutationStartWorkEmailValidationArgs = {
  email: Scalars["String"]["input"];
};

export type MutationUpdateCompanyArgs = {
  input: UpdateCompanyInput;
};

export type MutationUpdateSalaryArgs = {
  input: UpdateSalaryInput;
};

export type MutationUpdateTeamArgs = {
  input: UpdateTeamInput;
};

export type MutationUpdateUserArgs = {
  input: UserEditInput;
};

export type MutationUpdateUserRoleInCommunityArgs = {
  input: UpdateUserRoleInCommunityInput;
};

export type MutationValidateWorkEmailArgs = {
  confirmationToken: Scalars["String"]["input"];
};

export type MyPurchaseOrdersInput = {
  paymentPlatform?: InputMaybe<Scalars["String"]["input"]>;
};

export type MyTicketsSearchValues = {
  approvalStatus?: InputMaybe<Array<TicketApprovalStatus>>;
  eventId?: InputMaybe<Scalars["String"]["input"]>;
  paymentStatus?: InputMaybe<Array<TicketPaymentStatus>>;
  redemptionStatus?: InputMaybe<Array<TicketRedemptionStatus>>;
};

/** Type used for querying the paginated leaves and it's paginated meta data */
export type PaginatedEvent = {
  __typename?: "PaginatedEvent";
  data: Array<Event>;
  pagination: Pagination;
};

export type PaginatedInputEventsSearchInput = {
  pagination?: PaginationSearchInputParams;
  search?: InputMaybe<EventsSearchInput>;
};

export type PaginatedInputMyPurchaseOrdersInput = {
  pagination?: PaginationSearchInputParams;
  search?: InputMaybe<MyPurchaseOrdersInput>;
};

export type PaginatedInputMyTicketsSearchValues = {
  pagination?: PaginationSearchInputParams;
  search?: InputMaybe<MyTicketsSearchValues>;
};

export type PaginatedInputTeamSearchValues = {
  pagination?: PaginationSearchInputParams;
  search?: InputMaybe<TeamSearchValues>;
};

export type PaginatedInputUserSearchValues = {
  pagination?: PaginationSearchInputParams;
  search?: InputMaybe<UserSearchValues>;
};

/** Type used for querying the paginated leaves and it's paginated meta data */
export type PaginatedPurchaseOrder = {
  __typename?: "PaginatedPurchaseOrder";
  data: Array<PurchaseOrder>;
  pagination: Pagination;
};

/** Type used for querying the paginated leaves and it's paginated meta data */
export type PaginatedTeamRef = {
  __typename?: "PaginatedTeamRef";
  data: Array<TeamRef>;
  pagination: Pagination;
};

/** Type used for querying the paginated leaves and it's paginated meta data */
export type PaginatedUser = {
  __typename?: "PaginatedUser";
  data: Array<User>;
  pagination: Pagination;
};

/** Type used for querying the paginated leaves and it's paginated meta data */
export type PaginatedUserTicket = {
  __typename?: "PaginatedUserTicket";
  data: Array<UserTicket>;
  pagination: Pagination;
};

/** Pagination meta data */
export type Pagination = {
  __typename?: "Pagination";
  currentPage: Scalars["Int"]["output"];
  pageSize: Scalars["Int"]["output"];
  totalPages: Scalars["Int"]["output"];
  totalRecords: Scalars["Int"]["output"];
};

export type PaginationSearchInputParams = {
  /** Page number, starts at 0 */
  page: Scalars["Int"]["input"];
  pageSize: Scalars["Int"]["input"];
};

export enum ParticipationStatus {
  Accepted = "accepted",
  NotAccepted = "not_accepted",
  WaitingResolution = "waiting_resolution",
}

export type PayForPurchaseOrderInput = {
  currencyID: Scalars["String"]["input"];
  purchaseOrderId: Scalars["String"]["input"];
};

/** Representation of a TicketPrice */
export type Price = {
  __typename?: "Price";
  amount: Scalars["Int"]["output"];
  currency: AllowedCurrency;
  id: Scalars["ID"]["output"];
};

export type PricingInputField = {
  currencyId: Scalars["String"]["input"];
  /** The price. But in cents, so for a $10 ticket, you'd pass 1000 (or 10_00), or for 1000 chilean pesos, you'd pass 1000_00 */
  value_in_cents: Scalars["Int"]["input"];
};

export enum PronounsEnum {
  Empty = "empty",
  HeHim = "heHim",
  Other = "other",
  SheHer = "sheHer",
  TheyThem = "theyThem",
}

/** Representation of a payment log entry */
export type PublicFinanceEntryRef = {
  __typename?: "PublicFinanceEntryRef";
  createdAt: Scalars["DateTime"]["output"];
  currencyId: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  platform: Scalars["String"]["output"];
  transactionAmount: Scalars["Float"]["output"];
  transactionDate?: Maybe<Scalars["DateTime"]["output"]>;
};

/** Representation of a Purchase Order */
export type PurchaseOrder = {
  __typename?: "PurchaseOrder";
  createdAt?: Maybe<Scalars["DateTime"]["output"]>;
  currency?: Maybe<AllowedCurrency>;
  finalPrice?: Maybe<Scalars["Float"]["output"]>;
  id: Scalars["ID"]["output"];
  paymentLink?: Maybe<Scalars["String"]["output"]>;
  paymentPlatform?: Maybe<Scalars["String"]["output"]>;
  purchasePaymentStatus?: Maybe<PurchaseOrderPaymentStatusEnum>;
  status?: Maybe<PurchaseOrderStatusEnum>;
  tickets: Array<UserTicket>;
};

export type PurchaseOrderInput = {
  quantity: Scalars["Int"]["input"];
  ticketId: Scalars["String"]["input"];
};

export enum PurchaseOrderPaymentStatusEnum {
  NotRequired = "not_required",
  Paid = "paid",
  Unpaid = "unpaid",
}

export enum PurchaseOrderStatusEnum {
  Complete = "complete",
  Expired = "expired",
  Open = "open",
}

export type Query = {
  __typename?: "Query";
  /** Get a list of communities. Filter by name, id, or status */
  communities: Array<Community>;
  /** Get a community by id */
  community?: Maybe<Community>;
  /** Get all available companies */
  companies: Array<Company>;
  /** Get all available companies */
  company: Company;
  /** Get an event by id */
  event?: Maybe<Event>;
  /** Get a list of images, that are attached to an event */
  eventImages: Array<SanityAssetRef>;
  /** Get the current user */
  me: User;
  /** Get a list of purchase orders for the authenticated user */
  myPurchaseOrders: PaginatedPurchaseOrder;
  /** Get a list of tickets for the current user */
  myTickets: PaginatedUserTicket;
  /** Get a list of salaries associated to the user */
  salaries: Array<Salary>;
  /** Search a consolidated payment logs, by date, aggregated by platform and currency_id */
  searchConsolidatedPaymentLogs: Array<ConsolidatedPaymentLogEntry>;
  /** Get a list of events. Filter by name, id, status or date */
  searchEvents: PaginatedEvent;
  /** Search on the payment logs by date, and returns a list of payment logs */
  searchPaymentLogs: Array<PublicFinanceEntryRef>;
  searchTeams: PaginatedTeamRef;
  status: Scalars["String"]["output"];
  /** Get a list of tags */
  tags: Array<Tag>;
  /** Get a list of users */
  userSearch: PaginatedUser;
  /** Get a list of users */
  users: Array<User>;
  /** Get a workEmail and check if its validated for this user */
  workEmail: WorkEmail;
  /** Get a list of validated work emails for the user */
  workEmails: Array<ValidatedWorkEmail>;
  /** Get a a work role's seniorities */
  workRoleSeniorities: Array<WorkSeniority>;
  /** Get a list of possible work roles */
  workRoles: Array<WorkRole>;
};

export type QueryCommunitiesArgs = {
  id?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<CommnunityStatus>;
};

export type QueryCommunityArgs = {
  id: Scalars["String"]["input"];
};

export type QueryCompaniesArgs = {
  input?: InputMaybe<SearchCompaniesInput>;
};

export type QueryCompanyArgs = {
  companyId: Scalars["String"]["input"];
};

export type QueryEventArgs = {
  id: Scalars["String"]["input"];
};

export type QueryEventImagesArgs = {
  input: EventImageSearch;
};

export type QueryMyPurchaseOrdersArgs = {
  input: PaginatedInputMyPurchaseOrdersInput;
};

export type QueryMyTicketsArgs = {
  input: PaginatedInputMyTicketsSearchValues;
};

export type QuerySearchConsolidatedPaymentLogsArgs = {
  input: SearchPaymentLogsInput;
};

export type QuerySearchEventsArgs = {
  input: PaginatedInputEventsSearchInput;
};

export type QuerySearchPaymentLogsArgs = {
  input: SearchPaymentLogsInput;
};

export type QuerySearchTeamsArgs = {
  input: PaginatedInputTeamSearchValues;
};

export type QueryStatusArgs = {
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryTagsArgs = {
  input?: InputMaybe<TagSearchInput>;
};

export type QueryUserSearchArgs = {
  input: PaginatedInputUserSearchValues;
};

export type QueryWorkEmailArgs = {
  email: Scalars["String"]["input"];
};

export type QueryWorkRoleSenioritiesArgs = {
  input: WorkRoleSenioritiesInput;
};

export type RedeemUserTicketError = {
  __typename?: "RedeemUserTicketError";
  error: Scalars["Boolean"]["output"];
  errorMessage: Scalars["String"]["output"];
};

export type RedeemUserTicketResponse = PurchaseOrder | RedeemUserTicketError;

export type RejectTeamInvitationInput = {
  teamId: Scalars["String"]["input"];
};

export type RemovePersonFromTeamInput = {
  teamId: Scalars["String"]["input"];
  userId: Scalars["String"]["input"];
};

/** Representation of a workEmail */
export type Salary = {
  __typename?: "Salary";
  amount: Scalars["Int"]["output"];
  company: Company;
  countryCode: Scalars["String"]["output"];
  currencyCode: Scalars["String"]["output"];
  gender?: Maybe<Gender>;
  genderOtherText?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  typeOfEmployment: TypeOfEmployment;
  workMetodology: WorkMetodology;
  workRole: WorkRole;
  workSeniority: WorkSeniority;
  yearsOfExperience: Scalars["Int"]["output"];
};

/** Representation of a Sanity Asset */
export type SanityAssetRef = {
  __typename?: "SanityAssetRef";
  assetId: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  originalFilename: Scalars["String"]["output"];
  path: Scalars["String"]["output"];
  size: Scalars["Int"]["output"];
  url: Scalars["String"]["output"];
};

export type SearchCompaniesInput = {
  companyName?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  domain?: InputMaybe<Scalars["String"]["input"]>;
  website?: InputMaybe<Scalars["String"]["input"]>;
};

export type SearchPaymentLogsInput = {
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  startDate: Scalars["DateTime"]["input"];
};

export enum SearchableUserTags {
  CoreTeam = "CORE_TEAM",
  DevTeam = "DEV_TEAM",
  Donor = "DONOR",
}

/** Representation of a tag. Tags can be associated to many things. An event, a community, etc. */
export type Tag = {
  __typename?: "Tag";
  description?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  name?: Maybe<Scalars["String"]["output"]>;
  slug: Scalars["String"]["output"];
};

export type TagSearchInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  id?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

export type TeamCreateInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  eventId: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
};

/** Representation of a team. This is compsed of a group of users and is attached to a specific event */
export type TeamRef = {
  __typename?: "TeamRef";
  description?: Maybe<Scalars["String"]["output"]>;
  event: Event;
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  status: TeamStatus;
  users: Array<UserWithStatusRef>;
};

export type TeamSearchValues = {
  eventIds?: InputMaybe<Array<Scalars["String"]["input"]>>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<Array<TeamStatus>>;
  teamIds?: InputMaybe<Array<Scalars["String"]["input"]>>;
  userIds?: InputMaybe<Array<Scalars["String"]["input"]>>;
};

export enum TeamStatus {
  Accepted = "accepted",
  Invited = "invited",
  NotAccepted = "not_accepted",
  WaitingResolution = "waiting_resolution",
}

/** Representation of a ticket */
export type Ticket = {
  __typename?: "Ticket";
  description?: Maybe<Scalars["String"]["output"]>;
  endDateTime?: Maybe<Scalars["DateTime"]["output"]>;
  event: Event;
  id: Scalars["ID"]["output"];
  /** Whether or not the ticket is free */
  isFree: Scalars["Boolean"]["output"];
  /** Whether or not the ticket has an unlimited quantity. This is reserved for things loike online events. */
  isUnlimited: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  prices?: Maybe<Array<Price>>;
  /** The number of tickets available for this ticket type */
  quantity?: Maybe<Scalars["Int"]["output"]>;
  quantityLeft?: Maybe<Scalars["Int"]["output"]>;
  requiresApproval: Scalars["Boolean"]["output"];
  startDateTime: Scalars["DateTime"]["output"];
  status: TicketTemplateStatus;
  visibility: TicketTemplateVisibility;
};

export enum TicketApprovalStatus {
  Approved = "approved",
  Cancelled = "cancelled",
  Gifted = "gifted",
  NotRequired = "not_required",
  Pending = "pending",
  Rejected = "rejected",
}

export type TicketClaimInput = {
  /** If this field is passed, a purchase order payment link will be generated right away */
  generatePaymentLink?: InputMaybe<GeneratePaymentLinkInput>;
  /** A unique key to prevent duplicate requests, it's optional to send, but it's recommended to send it to prevent duplicate requests. If not sent, it will be created by the server. */
  idempotencyUUIDKey?: InputMaybe<Scalars["String"]["input"]>;
  purchaseOrder: Array<PurchaseOrderInput>;
};

export type TicketCreateInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  endDateTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  eventId: Scalars["String"]["input"];
  /** If the ticket is free, the price submitted will be ignored. */
  isFree: Scalars["Boolean"]["input"];
  name: Scalars["String"]["input"];
  prices?: InputMaybe<Array<PricingInputField>>;
  quantity?: InputMaybe<Scalars["Int"]["input"]>;
  requiresApproval?: InputMaybe<Scalars["Boolean"]["input"]>;
  startDateTime: Scalars["DateTime"]["input"];
  status?: InputMaybe<TicketTemplateStatus>;
  /** If provided, quantity must not be passed. This is for things like online events where there is no limit to the amount of tickets that can be sold. */
  unlimitedTickets: Scalars["Boolean"]["input"];
  visibility?: InputMaybe<TicketTemplateVisibility>;
};

export type TicketEditInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  endDateTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  eventId?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  prices?: InputMaybe<PricingInputField>;
  quantity?: InputMaybe<Scalars["Int"]["input"]>;
  requiresApproval?: InputMaybe<Scalars["Boolean"]["input"]>;
  startDateTime?: InputMaybe<Scalars["DateTime"]["input"]>;
  status?: InputMaybe<TicketTemplateStatus>;
  ticketId: Scalars["String"]["input"];
  /** If provided, quantity must not be passed. This is for things like online events where there is no limit to the amount of tickets that can be sold. */
  unlimitedTickets?: InputMaybe<Scalars["Boolean"]["input"]>;
  visibility?: InputMaybe<TicketTemplateVisibility>;
};

export enum TicketPaymentStatus {
  NotRequired = "not_required",
  Paid = "paid",
  Unpaid = "unpaid",
}

export enum TicketRedemptionStatus {
  Pending = "pending",
  Redeemed = "redeemed",
}

export enum TicketTemplateStatus {
  Active = "active",
  Inactive = "inactive",
}

export enum TicketTemplateVisibility {
  Private = "private",
  Public = "public",
  Unlisted = "unlisted",
}

export enum TypeOfEmployment {
  Freelance = "freelance",
  FullTime = "fullTime",
  PartTime = "partTime",
}

export type UpdateCommunityInput = {
  communityId: Scalars["String"]["input"];
  description?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  slug?: InputMaybe<Scalars["String"]["input"]>;
  status?: InputMaybe<CommnunityStatus>;
};

export type UpdateCompanyInput = {
  companyId: Scalars["String"]["input"];
  description?: InputMaybe<Scalars["String"]["input"]>;
  domain?: InputMaybe<Scalars["String"]["input"]>;
  logo?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  website?: InputMaybe<Scalars["String"]["input"]>;
};

export type UpdateSalaryInput = {
  amount?: InputMaybe<Scalars["Int"]["input"]>;
  confirmationToken: Scalars["String"]["input"];
  countryCode?: InputMaybe<Scalars["String"]["input"]>;
  currencyCode?: InputMaybe<Scalars["String"]["input"]>;
  gender?: InputMaybe<Gender>;
  genderOtherText?: InputMaybe<Scalars["String"]["input"]>;
  salaryId: Scalars["String"]["input"];
  typeOfEmployment?: InputMaybe<TypeOfEmployment>;
  workMetodology?: InputMaybe<WorkMetodology>;
  workSeniorityAndRoleId?: InputMaybe<Scalars["String"]["input"]>;
  yearsOfExperience?: InputMaybe<Scalars["Int"]["input"]>;
};

export type UpdateTeamInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  teamId: Scalars["String"]["input"];
};

/** Representation of a user */
export type User = {
  __typename?: "User";
  bio?: Maybe<Scalars["String"]["output"]>;
  communities: Array<Community>;
  email?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  imageUrl?: Maybe<Scalars["String"]["output"]>;
  impersonatedUser?: Maybe<User>;
  isSuperAdmin?: Maybe<Scalars["Boolean"]["output"]>;
  lastName?: Maybe<Scalars["String"]["output"]>;
  name?: Maybe<Scalars["String"]["output"]>;
  pronouns?: Maybe<PronounsEnum>;
  teams: Array<TeamRef>;
  username: Scalars["String"]["output"];
};

export type UserSearchValues = {
  name?: InputMaybe<Scalars["String"]["input"]>;
  tags?: InputMaybe<Array<SearchableUserTags>>;
  userName?: InputMaybe<Scalars["String"]["input"]>;
};

export enum UserTeamRole {
  Leader = "leader",
  Member = "member",
}

/** Representation of a User ticket */
export type UserTicket = {
  __typename?: "UserTicket";
  approvalStatus: TicketApprovalStatus;
  createdAt: Scalars["DateTime"]["output"];
  id: Scalars["ID"]["output"];
  paymentStatus?: Maybe<PurchaseOrderPaymentStatusEnum>;
  purchaseOrder?: Maybe<PurchaseOrder>;
  redemptionStatus: TicketRedemptionStatus;
  ticketTemplate: Ticket;
};

/** Representation of a user in a team */
export type UserWithStatusRef = {
  __typename?: "UserWithStatusRef";
  id: Scalars["ID"]["output"];
  role: UserTeamRole;
  status: ParticipationStatus;
  user: User;
};

export enum ValidPaymentMethods {
  MercadoPago = "mercado_pago",
  Stripe = "stripe",
}

/** Representation of a work email associated to the current user */
export type ValidatedWorkEmail = {
  __typename?: "ValidatedWorkEmail";
  company?: Maybe<Company>;
  confirmationDate?: Maybe<Scalars["DateTime"]["output"]>;
  id: Scalars["ID"]["output"];
  isValidated: Scalars["Boolean"]["output"];
  status: EmailStatus;
  workEmail: Scalars["String"]["output"];
};

/** Representation of a (yet to validate) work email */
export type WorkEmail = {
  __typename?: "WorkEmail";
  id: Scalars["ID"]["output"];
  isValidated: Scalars["Boolean"]["output"];
};

export enum WorkMetodology {
  Hybrid = "hybrid",
  Office = "office",
  Remote = "remote",
}

/** Representation of a work role */
export type WorkRole = {
  __typename?: "WorkRole";
  description?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  seniorities: Array<WorkSeniority>;
};

export type WorkRoleSenioritiesInput = {
  workRoleId: Scalars["String"]["input"];
};

/** Representation of a work seniority */
export type WorkSeniority = {
  __typename?: "WorkSeniority";
  description?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
};

export type UpdateUserRoleInCommunityInput = {
  communityId: Scalars["String"]["input"];
  role: Scalars["String"]["input"];
  userId: Scalars["String"]["input"];
};

export type UserEditInput = {
  bio?: InputMaybe<Scalars["String"]["input"]>;
  id: Scalars["String"]["input"];
  lastName?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
  pronouns?: InputMaybe<PronounsEnum>;
  username?: InputMaybe<Scalars["String"]["input"]>;
};
