import { relations } from "drizzle-orm";
import { boolean, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { usersSchema } from "./schema";
import { createdAndUpdatedAtFields } from "./shared";

export const userDataSchema = pgTable(
  "user_data",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("user_id").references(() => usersSchema.id),
    countryOfResidence: text("country_of_residence").notNull(),
    city: text("city").notNull(),
    worksInOrganization: boolean("works_in_organization").notNull(),
    organizationName: text("organization_name"),
    roleInOrganization: text("role_in_organization"),
    ...createdAndUpdatedAtFields,
  },
  (table) => ({
    userIdIndex: uniqueIndex("user_id_index").on(table.userId),
  }),
);

export const userDataRelations = relations(userDataSchema, ({ one }) => ({
  user: one(usersSchema, {
    fields: [userDataSchema.userId],
    references: [usersSchema.id],
  }),
}));

export const selectUserDataSchema = createSelectSchema(userDataSchema);

export const insertUserDataSchema = createInsertSchema(userDataSchema);

export const updateUserDataSchema = insertUserDataSchema.pick({
  city: true,
  countryOfResidence: true,
  organizationName: true,
  roleInOrganization: true,
  worksInOrganization: true,
});
