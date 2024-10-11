import { z } from "zod";

import { builder } from "~/builder";
import {
  selectUsersSchema,
  selectCommunitySchema,
  selectEventsSchema,
  selectTagsSchema,
  selectUserTicketsSchema,
  selectTicketSchema,
  selectWorkEmailSchema,
  selectCompaniesSchema,
  selectSalariesSchema,
  selectAllowedCurrencySchema,
  selectWorkRoleSchema,
  selectWorkSenioritySchema,
  selectPaymentLogsSchema,
  selectUserDataSchema,
  SelectUserTicketTransferSchema,
} from "~/datasources/db/schema";
import { SanityAsset, SanityEvent } from "~/datasources/sanity/types";

export type UserGraphqlSchema = z.infer<typeof selectUsersSchema>;

export const UserRef = builder.objectRef<UserGraphqlSchema>("User");

export type UserDataGraphqlSchema = z.infer<typeof selectUserDataSchema>;

export const UserDataRef = builder.objectRef<UserDataGraphqlSchema>("UserData");

export const PublicUserInfoRef =
  builder.objectRef<UserGraphqlSchema>("PublicUserInfo");

type CommunityGraphqlSchema = z.infer<typeof selectCommunitySchema>;

export const CommunityRef =
  builder.objectRef<CommunityGraphqlSchema>("Community");

type TagGraphqllSchema = z.infer<typeof selectTagsSchema>;

export const TagRef = builder.objectRef<TagGraphqllSchema>("Tag");

type EventGraphqlSchema = z.infer<typeof selectEventsSchema>;

export const EventRef = builder.objectRef<EventGraphqlSchema>("Event");

type UserTicketGraphqlSchema = z.infer<typeof selectUserTicketsSchema>;

export const UserTicketRef =
  builder.objectRef<UserTicketGraphqlSchema>("UserTicket");

export const PublicUserTicketRef =
  builder.objectRef<UserTicketGraphqlSchema>("PublicUserTicket");

export const PublicEventAttendanceRef = builder.objectRef<{
  publicId: string;
  user: UserGraphqlSchema;
  event: EventGraphqlSchema;
}>("PublicEventAttendance");

type TicketGraphqlSchema = z.infer<typeof selectTicketSchema>;

export const TicketRef = builder.objectRef<TicketGraphqlSchema>("Ticket");

export const WaitlistRef = builder.objectRef<TicketGraphqlSchema>("Waitlist");

export const PriceRef = builder.objectRef<{
  id: string;
  amount: number;
  currencyId: string;
}>("Price");

type WorkEmailGraphqlSchema = z.infer<typeof selectWorkEmailSchema>;

export const WorkEmailRef =
  builder.objectRef<WorkEmailGraphqlSchema>("WorkEmail");

export const ValidatedWorkEmailRef =
  builder.objectRef<WorkEmailGraphqlSchema>("ValidatedWorkEmail");

type AllowedCurrencyGraphqlSchema = z.infer<typeof selectAllowedCurrencySchema>;

export const AllowedCurrencyRef =
  builder.objectRef<AllowedCurrencyGraphqlSchema>("AllowedCurrency");

type CompanyGraphqlSchema = z.infer<typeof selectCompaniesSchema>;

export const CompanyRef = builder.objectRef<CompanyGraphqlSchema>("Company");

type SalaryGraphqlSchema = z.infer<typeof selectSalariesSchema>;

export const SalaryRef = builder.objectRef<SalaryGraphqlSchema>("Salary");

type WorkRoleGraphqlSchema = z.infer<typeof selectWorkRoleSchema>;

export const WorkRoleRef = builder.objectRef<WorkRoleGraphqlSchema>("WorkRole");

type WorkSeniorityGraphqlSchema = z.infer<typeof selectWorkSenioritySchema>;

export const WorkSeniorityRef =
  builder.objectRef<WorkSeniorityGraphqlSchema>("WorkSeniority");

export const SanityAssetRef = builder.objectRef<SanityAsset>("SanityAssetRef");

export const SanityEventRef = builder.objectRef<SanityEvent>("SanityEventRef");

type PaymentLogGraphqlSchema = z.infer<typeof selectPaymentLogsSchema>;

export const PaymentLogRef = builder.objectRef<PaymentLogGraphqlSchema>(
  "PublicFinanceEntryRef",
);

export const ConsolidatedPaymentLogEntryRef = builder.objectRef<{
  id: string;
  totalTransactionAmount: number;
  platform: string;
  currencyId: string;
}>("ConsolidatedPaymentLogEntry");

export const UserTicketTransferRef =
  builder.objectRef<SelectUserTicketTransferSchema>("UserTicketTransfer");
