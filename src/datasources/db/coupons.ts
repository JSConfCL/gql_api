import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  index,
  uniqueIndex,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { eventsSchema, ticketsSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export const couponsSchema = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: text("name").notNull(),
    code: text("coupon").notNull(),
    description: text("description"),
    eventId: uuid("event_id")
      .references(() => eventsSchema.id)
      .notNull(),
    isActive: boolean("is_active").notNull().default(false),
    ...createdAndUpdatedAtFields,
  },
  (t) => ({
    eventIdIndex: index("coupons_event_id_index").on(t.eventId),
    codeIndex: index("coupons_code_index").on(t.code),
    uniqueEventCodeIndex: uniqueIndex("coupons_event_code_unique_index").on(
      t.eventId,
      t.code,
    ),
  }),
);

export const couponsRelations = relations(couponsSchema, ({ one, many }) => ({
  event: one(eventsSchema, {
    fields: [couponsSchema.eventId],
    references: [eventsSchema.id],
  }),
  tickets: many(ticketsSchema),
}));

export const selectCouponsSchema = createSelectSchema(couponsSchema);

export const insertCouponsSchema = createInsertSchema(couponsSchema);
