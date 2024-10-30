import { relations } from "drizzle-orm";
import { pgTable, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { pricesSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";
import { addonsSchema } from "./ticketAddons";

export const addonsPricesSchema = pgTable("addons_prices", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  addonId: uuid("addon_id")
    .notNull()
    .references(() => addonsSchema.id),
  priceId: uuid("price_id")
    .notNull()
    .references(() => pricesSchema.id),
  ...createdAndUpdatedAtFields,
});

export const addonsPricesRelations = relations(
  addonsPricesSchema,
  ({ one }) => ({
    addon: one(addonsSchema, {
      fields: [addonsPricesSchema.addonId],
      references: [addonsSchema.id],
    }),
    price: one(pricesSchema, {
      fields: [addonsPricesSchema.priceId],
      references: [pricesSchema.id],
    }),
  }),
);

export const selectAddonPriceSchema = createSelectSchema(addonsPricesSchema);

export type SelectAddonPriceSchema = z.infer<typeof selectAddonPriceSchema>;

export const insertAddonPriceSchema = createInsertSchema(addonsPricesSchema);

export type InsertAddonPriceSchema = z.infer<typeof insertAddonPriceSchema>;
