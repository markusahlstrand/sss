import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// Database connection utility
export function getDatabase(database?: D1Database) {
  if (!database) {
    throw new Error("Database not available");
  }
  return drizzle(database, { schema });
}

export type Database = ReturnType<typeof getDatabase>;
export { schema };
