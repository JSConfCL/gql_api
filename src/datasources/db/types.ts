import { InferModel } from "drizzle-orm";
import { user } from "./schema";

export type User = InferModel<typeof user, "select">;
export type InsertUser = InferModel<typeof user, "insert">; // insert type
