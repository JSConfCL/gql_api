import { relations } from "drizzle-orm";
import { pgTable, uuid, integer, index, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { purchaseOrdersSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { addonsSchema } from "./ticketAddons";
import { userTicketsSchema } from "./userTickets";

export enum UserTicketAddonRedemptionStatus {
  /**
   * The addon has been purchased but not yet redeemed
   */
  PENDING = "pending",
  /**
   * The addon has been redeemed (it has claimed a meal, a book, etc.)
   */
  REDEEMED = "redeemed",
}

export enum UserTicketAddonApprovalStatus {
  /**
   * The addon is pending approval
   * For example, if the user has not yet paid for the addon
   */
  PENDING = "pending",
  /**
   * The addon has been approved
   * For example, if the addon has been paid for
   */
  APPROVED = "approved",
  /**
   * The addon has been cancelled
   * For example, if the user cancels their order or it doesn't pays
   */
  CANCELLED = "cancelled",
}

// User-Ticket-Addon association table
export const userTicketAddonsSchema = pgTable(
  "user_ticket_addons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userTicketId: uuid("user_ticket_id")
      .references(() => userTicketsSchema.id)
      .notNull(),
    addonId: uuid("addon_id")
      .references(() => addonsSchema.id)
      .notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceInCents: integer("unit_price_in_cents").notNull(),
    approvalStatus: text("approval_status", {
      enum: [
        UserTicketAddonApprovalStatus.PENDING,
        UserTicketAddonApprovalStatus.APPROVED,
        UserTicketAddonApprovalStatus.CANCELLED,
      ],
    })
      .notNull()
      .default(UserTicketAddonApprovalStatus.PENDING),
    redemptionStatus: text("redemption_status", {
      enum: [
        UserTicketAddonRedemptionStatus.PENDING,
        UserTicketAddonRedemptionStatus.REDEEMED,
      ],
    })
      .notNull()
      .default(UserTicketAddonRedemptionStatus.PENDING),
    purchaseOrderId: uuid("purchase_order_id")
      .references(() => purchaseOrdersSchema.id)
      .notNull(),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    userTicketIdIndex: index("idx_user_ticket_addons_user_ticket_id").on(
      t.userTicketId,
    ),
    addonIdIndex: index("idx_user_ticket_addons_addon_id").on(t.addonId),
  }),
);

// Relations
export const userTicketAddonsRelations = relations(
  userTicketAddonsSchema,
  ({ one }) => ({
    userTicket: one(userTicketsSchema, {
      fields: [userTicketAddonsSchema.userTicketId],
      references: [userTicketsSchema.id],
    }),
    addon: one(addonsSchema, {
      fields: [userTicketAddonsSchema.addonId],
      references: [addonsSchema.id],
    }),
    purchaseOrder: one(purchaseOrdersSchema, {
      fields: [userTicketAddonsSchema.purchaseOrderId],
      references: [purchaseOrdersSchema.id],
    }),
  }),
);

// Zod schemas
export const selectUserTicketAddonSchema = createSelectSchema(
  userTicketAddonsSchema,
);

export type SelectUserTicketAddonSchema = z.infer<
  typeof selectUserTicketAddonSchema
>;

export const insertUserTicketAddonSchema = createInsertSchema(
  userTicketAddonsSchema,
);

export type InsertUserTicketAddonSchema = z.infer<
  typeof insertUserTicketAddonSchema
>;

export const insertUserTicketAddonClaimSchema = createInsertSchema(
  userTicketAddonsSchema,
);

export type InsertUserTicketAddonClaimSchema = z.infer<
  typeof insertUserTicketAddonClaimSchema
>;
