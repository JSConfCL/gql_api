import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  integer,
  index,
  uniqueIndex,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { eventsSchema } from "./events";
import { createdAndUpdatedAtFields } from "./shared";
import { ticketsSchema } from "./tickets";
import { addonsPricesSchema } from "./ticketsAddonsPrices";

// Addons table
export const addonsSchema = pgTable(
  "addons",
  {
    id: uuid("id").notNull().defaultRandom().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    totalStock: integer("total_stock"),
    maxPerTicket: integer("max_per_ticket"),
    tags: text("tags")
      .array()
      .$type<string[]>()
      .default(sql`ARRAY[]::text[]`),
    isFree: boolean("is_free").notNull().default(false),
    isUnlimited: boolean("is_unlimited").notNull().default(false),
    stripeProductId: text("stripe_product_id"),
    eventId: uuid("event_id")
      .references(() => eventsSchema.id)
      .notNull(),
    ...createdAndUpdatedAtFields,
  },
  (table) => ({
    nameIndex: index("idx_addons_name").on(table.name),
  }),
);

export const addonsRelations = relations(addonsSchema, ({ many }) => ({
  prices: many(addonsPricesSchema),
  ticketAddons: many(ticketAddonsSchema),
  constraints: many(addonConstraintsSchema),
}));

// Ticket-Addon association table
export const ticketAddonsSchema = pgTable(
  "ticket_addons",
  {
    id: uuid("id").notNull().defaultRandom().unique(),
    ticketId: uuid("ticket_id")
      .references(() => ticketsSchema.id)
      .notNull(),
    addonId: uuid("addon_id")
      .references(() => addonsSchema.id)
      .notNull(),
    orderDisplay: integer("order_display").notNull(),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    ticketIdIndex: index("idx_ticket_addons_ticket_id").on(t.ticketId),
    addonIdIndex: index("idx_ticket_addons_addon_id").on(t.addonId),
    uniqueTicketAddon: uniqueIndex("idx_ticket_addons_unique").on(
      t.ticketId,
      t.addonId,
    ),
    uniqueOrderDisplay: uniqueIndex("idx_ticket_addons_order_display").on(
      t.ticketId,
      t.orderDisplay,
    ),
  }),
);

export const ticketAddonsRelations = relations(
  ticketAddonsSchema,
  ({ one }) => ({
    ticket: one(ticketsSchema, {
      fields: [ticketAddonsSchema.ticketId],
      references: [ticketsSchema.id],
    }),
    addon: one(addonsSchema, {
      fields: [ticketAddonsSchema.addonId],
      references: [addonsSchema.id],
    }),
  }),
);

export enum AddonConstraintType {
  /**
   * The addon is dependent on the related addon.
   */
  DEPENDENCY = "DEPENDENCY",
  /**
   * The addon is mutually exclusive with the related addon.
   */
  MUTUAL_EXCLUSION = "MUTUAL_EXCLUSION",
}

export const addonConstraintsSchema = pgTable(
  "addon_constraints",
  {
    id: uuid("id").notNull().defaultRandom().unique(),
    addonId: uuid("addon_id")
      .references(() => addonsSchema.id)
      .notNull(),
    relatedAddonId: uuid("related_addon_id")
      .references(() => addonsSchema.id)
      .notNull(),
    constraintType: text("constraint_type", {
      enum: [
        AddonConstraintType.DEPENDENCY,
        AddonConstraintType.MUTUAL_EXCLUSION,
      ],
    }).notNull(),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    uniqueAddonConstraint: uniqueIndex("idx_addon_constraints_unique").on(
      t.addonId,
      t.relatedAddonId,
    ),
    addonIdIndex: index("idx_addon_constraints_addon_id").on(t.addonId),
    relatedAddonIdIndex: index("idx_addon_constraints_related_addon_id").on(
      t.relatedAddonId,
    ),
    relationshipTypeIndex: index("idx_addon_relationships_constraint_type").on(
      t.constraintType,
    ),
  }),
);

export const addonConstraintsRelations = relations(
  addonConstraintsSchema,
  ({ one }) => ({
    addon: one(addonsSchema, {
      fields: [addonConstraintsSchema.addonId],
      references: [addonsSchema.id],
    }),
  }),
);

// Zod schemas
export const selectAddonSchema = createSelectSchema(addonsSchema, {
  tags: z.array(z.string()),
});

export type SelectAddonSchema = z.infer<typeof selectAddonSchema>;

export const insertAddonSchema = createInsertSchema(addonsSchema, {
  tags: z.array(z.string()),
});

export type InsertAddonSchema = z.infer<typeof insertAddonSchema>;

export const selectTicketAddonSchema = createSelectSchema(ticketAddonsSchema);

export type SelectTicketAddonSchema = z.infer<typeof selectTicketAddonSchema>;

export const insertTicketAddonSchema = createInsertSchema(ticketAddonsSchema);

export type InsertTicketAddonSchema = z.infer<typeof insertTicketAddonSchema>;

export const selectAddonConstraintSchema = createSelectSchema(
  addonConstraintsSchema,
);

export type SelectAddonConstraintSchema = z.infer<
  typeof selectAddonConstraintSchema
>;

export const insertAddonConstraintSchema = createInsertSchema(
  addonConstraintsSchema,
);

export type InsertAddonConstraintSchema = z.infer<
  typeof insertAddonConstraintSchema
>;
