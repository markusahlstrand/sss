import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { logger } from "../middleware/logger";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const databasePath =
  process.env.DATABASE_URL ||
  `file:${path.join(process.cwd(), "data", "orders.db")}`;
const client = createClient({ url: databasePath });

export const db = drizzle(client, { schema });

// Initialize database (libsql doesn't support migrations in the same way)
export async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id)
      )
    `);

    logger.info("Database tables created successfully");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Database initialization failed", { error: errorMessage });
    throw error;
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await client.execute("SELECT 1 as test");
    return result !== undefined;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Database health check failed", { error: errorMessage });
    return false;
  }
}

// Graceful shutdown
export function closeDatabase() {
  try {
    client.close();
    logger.info("Database connection closed");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Error closing database", { error: errorMessage });
  }
}
