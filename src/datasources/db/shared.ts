import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/sqlite-core";

export const createdAndUpdatedAtFields = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`current_timestamp`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
};
