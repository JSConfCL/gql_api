import { relations } from "drizzle-orm";
import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { usersSchema } from "./schema";
import { createdAndUpdatedAtFields, uuid, boolean } from "./shared";

export const userDataSchema = sqliteTable(
  "user_data",
  {
    id: uuid("id").primaryKey().notNull(),
    userId: uuid("user_id").references(() => usersSchema.id),
    countryOfResidence: text("country_of_residence").notNull(),
    city: text("city").notNull(),
    worksInOrganization: boolean("works_in_organization").notNull(),
    organizationName: text("organization_name"),
    roleInOrganization: text("role_in_organization"),
    rut: text("rut"),
    foodAllergies: text("food_allergies"),
    emergencyPhoneNumber: text("emergency_phone_number"),
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
  rut: true,
  foodAllergies: true,
  emergencyPhoneNumber: true,
});
