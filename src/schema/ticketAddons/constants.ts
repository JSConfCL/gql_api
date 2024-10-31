import { UserTicketAddonApprovalStatus } from "~/datasources/db/userTicketsAddons";

/**
 * This statuses are taken into account
 * when counting the number of available stick
 */
export const RESERVED_USER_TICKET_ADDON_APPROVAL_STATUSES: UserTicketAddonApprovalStatus[] =
  [
    UserTicketAddonApprovalStatus.APPROVED,
    UserTicketAddonApprovalStatus.PENDING,
  ];
