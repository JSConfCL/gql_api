import { UserTicketApprovalStatus } from "~/datasources/db/userTickets";

/**
 * This statuses are valid
 * in the sense that they are visible to the user
 * and can be potentially used to redeem a user ticket
 */
export const ACCESSIBLE_USER_TICKET_APPROVAL_STATUSES: UserTicketApprovalStatus[] =
  [
    "approved",
    "not_required",
    "gifted",
    "gift_accepted",
    "transfer_pending",
    "transfer_accepted",
  ];

/**
 * This statuses are valid to redeem a user ticket
 */
export const REDEEMABLE_USER_TICKET_APPROVAL_STATUSES: UserTicketApprovalStatus[] =
  ["approved", "not_required", "gift_accepted", "transfer_accepted"];

/**
 * This statuses are taken into account
 * when counting the number of available stick
 */
export const RESERVED_USER_TICKET_APPROVAL_STATUSES: UserTicketApprovalStatus[] =
  [...ACCESSIBLE_USER_TICKET_APPROVAL_STATUSES, "pending"];

/**
 * Invalid statuses for a user ticket
 */
export const INVALID_USER_TICKET_APPROVAL_STATUSES: UserTicketApprovalStatus[] =
  ["rejected", "cancelled"];
