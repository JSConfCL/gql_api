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
} from "~/datasources/db/schema";

type UserGraphqlSchema = z.infer<typeof selectUsersSchema>;
export const UserRef = builder.objectRef<UserGraphqlSchema>("User");

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

type TicketGraphqlSchema = z.infer<typeof selectTicketSchema>;
export const TicketRef = builder.objectRef<TicketGraphqlSchema>("Ticket");

type WorkEmailGraphqlSchema = z.infer<typeof selectWorkEmailSchema>;
export const workEmailRef =
  builder.objectRef<WorkEmailGraphqlSchema>("WorkEmail");

type CompanyGraphqlSchema = z.infer<typeof selectCompaniesSchema>;
export const companyRef = builder.objectRef<CompanyGraphqlSchema>("Company");
