import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

export const getDb = (DATABASE_URL: string) => {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const db = drizzle(pool);
  return db;
};
