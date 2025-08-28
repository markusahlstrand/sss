import { serve } from "@hono/node-server";
import app from "./app.js";
import { initializeDatabase, closeDatabase } from "./db/index.js";

const port = parseInt(process.env.PORT || "3000", 10);

async function startServer() {
  try {
    // Initialize database and run migrations
    console.log("🗃️  Initializing database...");
    await initializeDatabase();
    console.log("✅ Database initialized successfully");

    console.log(`🚀 Starting Orders Service on port ${port}`);

    serve(
      {
        fetch: app.fetch,
        port,
      },
      (info) => {
        console.log(
          `✅ Orders Service is running at http://localhost:${info.port}`
        );
        console.log(
          `📖 API docs available at http://localhost:${info.port}/docs`
        );
        console.log(
          `📋 OpenAPI spec at http://localhost:${info.port}/openapi.json`
        );
      }
    );

    // Graceful shutdown
    process.on("SIGINT", () => {
      console.log("🛑 Shutting down gracefully...");
      closeDatabase();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("🛑 Shutting down gracefully...");
      closeDatabase();
      process.exit(0);
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Failed to start server:", errorMessage);
    process.exit(1);
  }
}

startServer();
