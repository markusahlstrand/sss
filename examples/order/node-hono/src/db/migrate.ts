import { initializeDatabase } from "./index";

async function runMigrations() {
  try {
    console.log("Starting database migrations...");
    await initializeDatabase();
    console.log("Database migrations completed successfully");
    process.exit(0);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Migration failed:", errorMessage);
    process.exit(1);
  }
}

runMigrations();
